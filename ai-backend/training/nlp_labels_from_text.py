"""
Extract physique metadata and weak label hints from Reddit/forum text.

Two public functions used by fetch_reddit.py and bootstrap_labels.py:
  extract_metadata_from_text(text) → dict (height_cm, weight_kg, bf_percent, sex, training_years)
  map_comments_to_labels(text)     → dict (partial labels dict, ordinal hints 0-5)

Both are regex + keyword-based — no external API required.
"""
from __future__ import annotations

import re
from typing import Any

# ── Regex patterns ─────────────────────────────────────────────────────────────

_HEIGHT_CM_RE = re.compile(r"(\d{2,3})\s*cm", re.IGNORECASE)
_HEIGHT_FT_RE = re.compile(r"""(\d)\s*[''′]\s*(\d{1,2})\s*(?:[""″]|in\b)?""", re.IGNORECASE)
_WEIGHT_KG_RE = re.compile(r"(\d{2,3}(?:\.\d)?)\s*kg", re.IGNORECASE)
_WEIGHT_LBS_RE = re.compile(r"(\d{2,3}(?:\.\d)?)\s*(?:lbs?|pounds?)", re.IGNORECASE)
_BF_RE = re.compile(r"(\d{1,2}(?:\.\d)?)\s*%\s*(?:bf|body\s*fat)|(?:bf|body\s*fat)[:\s]+(\d{1,2}(?:\.\d)?)", re.IGNORECASE)
_YEARS_LIFTING_RE = re.compile(
    r"(\d+(?:\.\d)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:lifting|training|gym|natty|bulk|cut)",
    re.IGNORECASE,
)
_SEX_MALE_RE = re.compile(r"\b(?:male|m\b|guy|man|bro)\b", re.IGNORECASE)
_SEX_FEMALE_RE = re.compile(r"\b(?:female|f\b|girl|woman)\b", re.IGNORECASE)


def extract_metadata_from_text(text: str) -> dict[str, Any]:
    """
    Parse height, weight, bf%, training years, sex from free text.
    Returns dict with keys: height_cm, weight_kg, bf_percent, sex, training_years
    All values can be None if not found.
    """
    meta: dict[str, Any] = {
        "height_cm": None,
        "weight_kg": None,
        "bf_percent": None,
        "sex": None,
        "training_years": None,
    }

    # Height (cm)
    m = _HEIGHT_CM_RE.search(text)
    if m:
        val = float(m.group(1))
        if 140 <= val <= 230:
            meta["height_cm"] = val

    # Height (ft'in") — convert to cm
    if meta["height_cm"] is None:
        m = _HEIGHT_FT_RE.search(text)
        if m:
            feet, inches = int(m.group(1)), int(m.group(2))
            cm = feet * 30.48 + inches * 2.54
            if 140 <= cm <= 230:
                meta["height_cm"] = round(cm, 1)

    # Weight (kg)
    m = _WEIGHT_KG_RE.search(text)
    if m:
        val = float(m.group(1))
        if 40 <= val <= 200:
            meta["weight_kg"] = val

    # Weight (lbs) → kg
    if meta["weight_kg"] is None:
        m = _WEIGHT_LBS_RE.search(text)
        if m:
            kg = float(m.group(1)) * 0.453592
            if 40 <= kg <= 200:
                meta["weight_kg"] = round(kg, 1)

    # Body fat %
    m = _BF_RE.search(text)
    if m:
        val = float(m.group(1) or m.group(2))
        if 3 <= val <= 50:
            meta["bf_percent"] = val

    # Training years
    m = _YEARS_LIFTING_RE.search(text)
    if m:
        val = float(m.group(1))
        if 0 <= val <= 40:
            meta["training_years"] = val

    # Sex
    has_male = bool(_SEX_MALE_RE.search(text))
    has_female = bool(_SEX_FEMALE_RE.search(text))
    if has_female and not has_male:
        meta["sex"] = "female"
    elif has_male and not has_female:
        meta["sex"] = "male"

    return meta


# ── Comment → label mappings ───────────────────────────────────────────────────
# Each entry: (pattern, label_field, delta)
# delta = +1..+3 → boost, -1..-3 → reduce
# Final label is clamped to [0, 5]

_COMMENT_RULES: list[tuple[re.Pattern, str, int]] = [
    # V-taper / lats
    (re.compile(r"\bv[\s-]?taper\b.*(?:great|good|nice|solid|amazing)", re.I), "v_taper_visibility", +2),
    (re.compile(r"(?:great|good|amazing)\s+v[\s-]?taper", re.I), "v_taper_visibility", +2),
    (re.compile(r"\blat\s+(?:spread|flare|width)\b", re.I), "v_taper_visibility", +1),
    (re.compile(r"\blagging\s+lats\b", re.I), "v_taper_visibility", -2),
    (re.compile(r"\bno\s+v[\s-]?taper\b", re.I), "v_taper_visibility", -2),

    # Shoulders
    (re.compile(r"\b(?:capped|round|3[dD])\s+(?:delts?|shoulders?)\b", re.I), "shoulder_roundness", +2),
    (re.compile(r"\b(?:great|wide|impressive)\s+shoulders?\b", re.I), "shoulder_width", +2),
    (re.compile(r"\blagging\s+(?:delts?|shoulders?)\b", re.I), "shoulder_roundness", -2),
    (re.compile(r"\blagging\s+(?:delts?|shoulders?)\b", re.I), "shoulder_width", -1),
    (re.compile(r"\bbring\s+up\s+(?:delts?|shoulders?)\b", re.I), "shoulder_roundness", -1),
    (re.compile(r"\bnarrow\s+shoulders?\b", re.I), "shoulder_width", -2),

    # Arms
    (re.compile(r"\b(?:huge|thick|jacked)\s+arms?\b", re.I), "arm_thickness", +2),
    (re.compile(r"\barms?\s+(?:are\s+)?(?:huge|thick|impressive)\b", re.I), "arm_thickness", +2),
    (re.compile(r"\blagging\s+arms?\b", re.I), "arm_thickness", -2),
    (re.compile(r"\bbring\s+up\s+arms?\b", re.I), "arm_thickness", -1),
    (re.compile(r"\b(?:good|nice)\s+(?:biceps?|triceps?)\b", re.I), "arm_thickness", +1),

    # Chest
    (re.compile(r"\b(?:great|impressive|thick)\s+chest\b", re.I), "chest_development", +2),
    (re.compile(r"\blagging\s+chest\b", re.I), "chest_development", -2),
    (re.compile(r"\bbring\s+up\s+chest\b", re.I), "chest_development", -1),

    # Traps
    (re.compile(r"\b(?:big|impressive|good)\s+traps?\b", re.I), "trap_development", +2),
    (re.compile(r"\blagging\s+traps?\b", re.I), "trap_development", -2),

    # Abs / conditioning
    (re.compile(r"\b(?:great|ripped|shredded|lean|peeled)\s+(?:abs?|core|midsection)\b", re.I), "abs_definition", +2),
    (re.compile(r"\bsix[\s-]?pack\b", re.I), "abs_definition", +2),
    (re.compile(r"\babs?\s+(?:are\s+)?(?:great|visible|coming\s+through)\b", re.I), "abs_definition", +2),
    (re.compile(r"\bno\s+abs?\b", re.I), "abs_definition", -2),
    (re.compile(r"\babs?\s+(?:are\s+)?(?:weak|soft|not\s+visible)\b", re.I), "abs_definition", -2),
    (re.compile(r"\bgood\s+conditioning\b", re.I), "muscular_separation", +2),
    (re.compile(r"\bshredded\b", re.I), "muscular_separation", +3),
    (re.compile(r"\bvascular\b", re.I), "vascularity", +2),

    # Body fat comments
    (re.compile(r"\bhigh\s+body\s*fat\b", re.I), "waist_softness", +2),
    (re.compile(r"\bhigh\s+body\s*fat\b", re.I), "abs_definition", -2),
    (re.compile(r"\bcut(?:ting)?\s+(?:more|harder)\b", re.I), "waist_softness", +1),
    (re.compile(r"\bbulk(?:ing)?\s+(?:too\s+hard|too\s+much)\b", re.I), "waist_softness", +2),
    (re.compile(r"\blean\b", re.I), "waist_softness", -1),

    # Quads / legs
    (re.compile(r"\b(?:huge|great|impressive)\s+(?:quads?|legs?|wheels?)\b", re.I), "quad_development", +2),
    (re.compile(r"\blagging\s+(?:quads?|legs?)\b", re.I), "quad_development", -2),
    (re.compile(r"\bskip\s+(?:leg\s+)?day\b", re.I), "quad_development", -2),

    # Symmetry
    (re.compile(r"\bperfect\s+(?:symmetry|balance)\b", re.I), "left_right_symmetry", +2),
    (re.compile(r"\basymmet(?:ry|ric)\b", re.I), "left_right_symmetry", -2),

    # Posture
    (re.compile(r"\bforward\s+(?:head|neck)\b", re.I), "posture_head_position", -2),
    (re.compile(r"\brounded\s+shoulders?\b", re.I), "posture_shoulder_alignment", -2),
    (re.compile(r"\bgood\s+posture\b", re.I), "posture_shoulder_alignment", +2),
]

# Starting prior for each label (mid-range, adjusted by comments)
_LABEL_PRIORS: dict[str, float] = {
    "shoulder_width": 2.5,
    "shoulder_roundness": 2.5,
    "arm_thickness": 2.5,
    "chest_development": 2.5,
    "trap_development": 2.0,
    "abs_definition": 2.0,
    "waist_softness": 2.5,
    "oblique_development": 2.0,
    "muscular_separation": 2.0,
    "vascularity": 1.5,
    "v_taper_visibility": 2.0,
    "quad_development": 2.0,
    "left_right_symmetry": 3.0,
    "posture_head_position": 3.0,
    "posture_shoulder_alignment": 3.0,
}


def map_comments_to_labels(text: str) -> dict[str, int]:
    """
    Apply keyword rules to derive ordinal label hints from comments.

    Returns a partial labels dict (only fields with strong signal).
    A field is only returned if at least one rule fired for it.
    """
    accumulator: dict[str, float] = {}
    fired: set[str] = set()

    for pattern, field, delta in _COMMENT_RULES:
        if pattern.search(text):
            prior = _LABEL_PRIORS.get(field, 2.5)
            if field not in accumulator:
                accumulator[field] = prior
            accumulator[field] += delta
            fired.add(field)

    result = {}
    for field in fired:
        val = int(round(max(0, min(5, accumulator[field]))))
        result[field] = val

    return result


def enrich_labels_with_nlp(
    existing_labels: dict,
    comment_text: str,
    overwrite_zeros: bool = True,
) -> dict:
    """
    Merge NLP-derived hints into existing labels dict.
    Only overwrites if existing value is 0/None and overwrite_zeros=True.
    """
    hints = map_comments_to_labels(comment_text)
    labels = dict(existing_labels)
    for field, val in hints.items():
        current = labels.get(field)
        if current is None or (overwrite_zeros and current == 0):
            labels[field] = val
    return labels


if __name__ == "__main__":
    # Quick self-test
    test_text = """
    Great V taper bro! Lagging delts though, bring them up.
    Shredded abs, six pack visible. High body fat around the waist.
    5'11" 190lbs 12% bf, 4 years of lifting. Male.
    Capped delts would complete the look. Skip leg day vibes.
    """
    meta = extract_metadata_from_text(test_text)
    labels = map_comments_to_labels(test_text)
    print("Metadata:", meta)
    print("Label hints:", labels)
