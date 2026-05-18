"""
Generate synthetic physique training data for XGBoost v1 bootstrapping.

Strategy:
- 10 body-type archetypes × pose types → realistic feature distributions
- Labels derived from features via domain-knowledge formulas (calibrated heuristics)
- Gaussian noise added to both features and labels for diversity
- Covers: elite→sedentary, male→female, front/back/side poses
- Source = "pose_dataset_bootstrap" → weighted 0.5× in training

Usage:
  python -m training.generate_synthetic --n-samples 200 --output data/train.jsonl
  python -m training.generate_synthetic --n-samples 200 --output data/train.jsonl --seed 42
"""
from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path
from typing import Any

import numpy as np

# ── Archetype definitions ──────────────────────────────────────────────────────
# Each entry: (mean, std) per feature
# Features in same order as pipeline/feature_extractor.py::FEATURE_NAMES

# Columns (index → name):
#  0  shoulder_width_norm        16 shoulder_height_diff_norm  32 v_taper_raw
#  1  hip_width_norm             17 left_elbow_angle           33 upper_body_width_mean
#  2  shoulder_to_hip_ratio_pose 18 right_elbow_angle          34 lower_body_width_mean
#  3  torso_height_norm          19 elbow_angle_symmetry       35 aspect_ratio
#  4  leg_height_norm            20 left_knee_angle            36 contour_irregularity
#  5  upper_lower_ratio          21 right_knee_angle           37 upper_arm_width_left
#  6  left_arm_length_norm       22 knee_angle_symmetry        38 upper_arm_width_right
#  7  right_arm_length_norm      23 landmark_visibility_mean   39 arm_width_symmetry
#  8  arm_length_symmetry        24 upper_body_visibility      40 thigh_width_left
#  9  left_leg_length_norm       25 lower_body_visibility      41 thigh_width_right
# 10  right_leg_length_norm      26 body_mask_area_norm        42 thigh_width_symmetry
# 11  leg_length_symmetry        27 silhouette_shoulder_width  43 chest_width_norm
# 12  shoulder_tilt_deg          28 silhouette_waist_width     44 waist_to_chest_ratio
# 13  hip_tilt_deg               29 silhouette_hip_width       45 body_brightness_mean
# 14  spine_angle_deg            30 shoulder_to_waist_sil      46 body_brightness_std
# 15  head_forward_offset        31 waist_to_hip_sil           47 edge_density_upper
#                                                              48 edge_density_lower
#                                                              49 pose_type_encoded

def _arch(
    shl_w=0.22, hip_w=0.22, torso_h=0.32, leg_h=0.42,
    sil_shl=0.28, sil_wst=0.22, sil_hip=0.24,
    arm_w=0.055, thigh_w=0.08, chest_w=0.24,
    bstd=0.08, edge_u=0.08, edge_l=0.06, contour=0.06,
    shl_tilt=4.0, spine_ang=4.0, head_fwd=0.05,
    vtaper=0.35, pose_enc=0.0, lm_vis=0.88,
    # std multiplier (tighter archetypes → 0.5, noisier → 1.5)
    noise=1.0,
) -> dict:
    """Build archetype mean vector + std array."""
    arm_len = 0.28
    leg_len = 0.40
    means = np.array([
        shl_w,         0.022,      # 0,1 (hip_width_norm derived below)
        shl_w / max(hip_w, 0.01),  # 2 shoulder_to_hip_ratio_pose
        torso_h,                   # 3
        leg_h,                     # 4
        torso_h / max(leg_h, 0.01),  # 5 upper_lower_ratio
        arm_len, arm_len,          # 6,7 arm lengths
        0.015,                     # 8 arm_length_symmetry
        leg_len, leg_len,          # 9,10
        0.015,                     # 11 leg_length_symmetry
        shl_tilt, shl_tilt * 0.8, # 12,13 tilt
        spine_ang,                 # 14
        head_fwd,                  # 15
        0.01,                      # 16 shoulder_height_diff_norm
        155.0, 155.0,              # 17,18 elbow angles
        3.0,                       # 19 elbow_angle_symmetry
        160.0, 160.0,              # 20,21 knee angles
        3.0,                       # 22 knee_angle_symmetry
        lm_vis,                    # 23 landmark_visibility_mean
        lm_vis + 0.04,             # 24 upper_body_visibility
        lm_vis - 0.05,             # 25 lower_body_visibility
        sil_shl * sil_shl * 3.5,  # 26 body_mask_area_norm (proxy)
        sil_shl,                   # 27 silhouette_shoulder_width
        sil_wst,                   # 28 silhouette_waist_width
        sil_hip,                   # 29 silhouette_hip_width
        sil_shl / max(sil_wst, 0.01),  # 30 shoulder_to_waist_sil
        sil_wst / max(sil_hip, 0.01),  # 31 waist_to_hip_sil
        vtaper,                    # 32 v_taper_raw
        (sil_shl + sil_wst) / 2,  # 33 upper_body_width_mean
        (sil_hip + sil_wst) / 2,  # 34 lower_body_width_mean
        2.5,                       # 35 aspect_ratio
        contour,                   # 36 contour_irregularity
        arm_w, arm_w,              # 37,38 upper_arm_width
        0.005,                     # 39 arm_width_symmetry
        thigh_w, thigh_w,          # 40,41 thigh_width
        0.005,                     # 42 thigh_width_symmetry
        chest_w,                   # 43 chest_width_norm
        sil_wst / max(chest_w, 0.01),  # 44 waist_to_chest_ratio
        0.55,                      # 45 body_brightness_mean
        bstd,                      # 46 body_brightness_std
        edge_u,                    # 47 edge_density_upper
        edge_l,                    # 48 edge_density_lower
        pose_enc,                  # 49 pose_type_encoded
    ], dtype=np.float64)

    # Override index 1 with proper hip value
    means[1] = hip_w

    base_std = np.array([
        0.03, 0.03, 0.08, 0.03, 0.04, 0.06, 0.02, 0.02, 0.01,
        0.025, 0.025, 0.01, 2.0, 1.5, 2.0, 0.02, 0.01,
        8.0, 8.0, 2.0, 8.0, 8.0, 2.0,
        0.05, 0.05, 0.06, 0.04,
        0.03, 0.025, 0.025, 0.10, 0.06, 0.08, 0.03, 0.03,
        0.3, 0.02,
        0.008, 0.008, 0.005, 0.012, 0.012, 0.005,
        0.025, 0.05, 0.06, 0.025, 0.025, 0.02,
        0.0,  # pose_type_encoded is deterministic
    ], dtype=np.float64)

    return {"means": means, "stds": base_std * noise}


# Pose type→encoded value
_P = {"front": 0.0, "back": 1.0, "side": 2.0, "mixed": 3.0}

ARCHETYPES: list[tuple[str, int, str, dict]] = [
    # (name, n_samples, pose_type, arch_kwargs)

    # ── Elite / competition-level ──────────────────────────────────────────
    ("elite_male_front", 12, "front", _arch(
        shl_w=0.31, hip_w=0.20, sil_shl=0.43, sil_wst=0.18, sil_hip=0.25,
        arm_w=0.092, thigh_w=0.125, chest_w=0.37,
        bstd=0.22, edge_u=0.25, edge_l=0.18, contour=0.16,
        shl_tilt=1.2, spine_ang=1.0, head_fwd=0.02,
        vtaper=0.80, pose_enc=_P["front"], lm_vis=0.96, noise=0.5,
    )),
    ("elite_male_back", 8, "back", _arch(
        shl_w=0.31, hip_w=0.21, sil_shl=0.44, sil_wst=0.19, sil_hip=0.26,
        arm_w=0.090, thigh_w=0.122, chest_w=0.36,
        bstd=0.21, edge_u=0.24, edge_l=0.17, contour=0.15,
        shl_tilt=1.0, spine_ang=1.2, head_fwd=0.01,
        vtaper=0.78, pose_enc=_P["back"], lm_vis=0.93, noise=0.5,
    )),

    # ── Advanced lifter ────────────────────────────────────────────────────
    ("advanced_male_front", 22, "front", _arch(
        shl_w=0.27, hip_w=0.22, sil_shl=0.37, sil_wst=0.20, sil_hip=0.25,
        arm_w=0.078, thigh_w=0.108, chest_w=0.32,
        bstd=0.16, edge_u=0.18, edge_l=0.13, contour=0.11,
        shl_tilt=2.0, spine_ang=2.5, head_fwd=0.04,
        vtaper=0.62, pose_enc=_P["front"], lm_vis=0.93, noise=0.8,
    )),
    ("advanced_male_back", 12, "back", _arch(
        shl_w=0.27, hip_w=0.23, sil_shl=0.38, sil_wst=0.21, sil_hip=0.26,
        arm_w=0.076, thigh_w=0.106, chest_w=0.31,
        bstd=0.15, edge_u=0.17, edge_l=0.12, contour=0.10,
        shl_tilt=1.8, spine_ang=2.2, head_fwd=0.03,
        vtaper=0.60, pose_enc=_P["back"], lm_vis=0.91, noise=0.8,
    )),
    ("advanced_male_side", 8, "side", _arch(
        shl_w=0.24, hip_w=0.22, sil_shl=0.30, sil_wst=0.19, sil_hip=0.23,
        arm_w=0.075, thigh_w=0.105, chest_w=0.28,
        bstd=0.15, edge_u=0.17, edge_l=0.12, contour=0.10,
        shl_tilt=1.5, spine_ang=2.0, head_fwd=0.04,
        vtaper=0.55, pose_enc=_P["side"], lm_vis=0.90, noise=0.9,
    )),

    # ── Intermediate / recreational gym-goer ──────────────────────────────
    ("intermediate_male_front", 30, "front", _arch(
        shl_w=0.23, hip_w=0.22, sil_shl=0.30, sil_wst=0.23, sil_hip=0.24,
        arm_w=0.062, thigh_w=0.090, chest_w=0.27,
        bstd=0.10, edge_u=0.11, edge_l=0.08, contour=0.07,
        shl_tilt=3.5, spine_ang=4.0, head_fwd=0.06,
        vtaper=0.42, pose_enc=_P["front"], lm_vis=0.89, noise=1.0,
    )),
    ("intermediate_male_back", 14, "back", _arch(
        shl_w=0.23, hip_w=0.22, sil_shl=0.31, sil_wst=0.23, sil_hip=0.25,
        arm_w=0.060, thigh_w=0.088, chest_w=0.26,
        bstd=0.09, edge_u=0.10, edge_l=0.08, contour=0.07,
        shl_tilt=3.0, spine_ang=3.5, head_fwd=0.05,
        vtaper=0.38, pose_enc=_P["back"], lm_vis=0.87, noise=1.0,
    )),

    # ── Beginner / untrained (lean) ────────────────────────────────────────
    ("beginner_lean_front", 20, "front", _arch(
        shl_w=0.20, hip_w=0.20, sil_shl=0.25, sil_wst=0.20, sil_hip=0.22,
        arm_w=0.045, thigh_w=0.070, chest_w=0.22,
        bstd=0.06, edge_u=0.06, edge_l=0.05, contour=0.04,
        shl_tilt=5.0, spine_ang=5.5, head_fwd=0.08,
        vtaper=0.25, pose_enc=_P["front"], lm_vis=0.85, noise=1.2,
    )),

    # ── Overweight / high BF ───────────────────────────────────────────────
    ("overweight_male_front", 18, "front", _arch(
        shl_w=0.24, hip_w=0.28, sil_shl=0.32, sil_wst=0.30, sil_hip=0.32,
        arm_w=0.072, thigh_w=0.110, chest_w=0.29,
        bstd=0.04, edge_u=0.04, edge_l=0.04, contour=0.03,
        shl_tilt=4.5, spine_ang=6.0, head_fwd=0.10,
        vtaper=0.10, pose_enc=_P["front"], lm_vis=0.82, noise=1.2,
    )),
    ("overweight_male_back", 8, "back", _arch(
        shl_w=0.24, hip_w=0.29, sil_shl=0.33, sil_wst=0.30, sil_hip=0.33,
        arm_w=0.070, thigh_w=0.108, chest_w=0.28,
        bstd=0.04, edge_u=0.04, edge_l=0.03, contour=0.03,
        shl_tilt=4.0, spine_ang=5.5, head_fwd=0.09,
        vtaper=0.08, pose_enc=_P["back"], lm_vis=0.80, noise=1.2,
    )),

    # ── Female (different shoulder/hip proportions) ────────────────────────
    ("advanced_female_front", 14, "front", _arch(
        shl_w=0.22, hip_w=0.26, sil_shl=0.29, sil_wst=0.19, sil_hip=0.30,
        arm_w=0.055, thigh_w=0.100, chest_w=0.26,
        bstd=0.12, edge_u=0.14, edge_l=0.11, contour=0.09,
        shl_tilt=2.0, spine_ang=2.8, head_fwd=0.04,
        vtaper=0.40, pose_enc=_P["front"], lm_vis=0.92, noise=0.9,
    )),
    ("intermediate_female_front", 20, "front", _arch(
        shl_w=0.20, hip_w=0.25, sil_shl=0.26, sil_wst=0.21, sil_hip=0.28,
        arm_w=0.045, thigh_w=0.090, chest_w=0.23,
        bstd=0.08, edge_u=0.09, edge_l=0.07, contour=0.06,
        shl_tilt=3.5, spine_ang=4.0, head_fwd=0.06,
        vtaper=0.30, pose_enc=_P["front"], lm_vis=0.88, noise=1.0,
    )),
    ("beginner_female_front", 14, "front", _arch(
        shl_w=0.19, hip_w=0.24, sil_shl=0.24, sil_wst=0.22, sil_hip=0.26,
        arm_w=0.038, thigh_w=0.082, chest_w=0.21,
        bstd=0.05, edge_u=0.05, edge_l=0.04, contour=0.04,
        shl_tilt=4.5, spine_ang=5.0, head_fwd=0.08,
        vtaper=0.18, pose_enc=_P["front"], lm_vis=0.84, noise=1.3,
    )),
]


# ── Feature → Label conversion ─────────────────────────────────────────────────

def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _ord(val: float, lo: int = 0, hi: int = 5, noise_scale: float = 0.4) -> int:
    """Round to ordinal with small noise for label diversity."""
    noisy = val + np.random.normal(0, noise_scale)
    return int(_clamp(round(noisy), lo, hi))


def features_to_labels(fv: np.ndarray, pose_type: str) -> dict[str, Any]:
    """Convert 50-feature vector to 24 physique labels via domain-knowledge mapping."""
    # Unpack key features
    shl_w_norm = float(fv[0])     # shoulder_width_norm
    hip_w_norm = float(fv[1])     # hip_width_norm
    sil_shl = float(fv[27])       # silhouette_shoulder_width
    sil_wst = float(fv[28])       # silhouette_waist_width
    sil_hip = float(fv[29])       # silhouette_hip_width
    vtaper = float(fv[32])        # v_taper_raw
    contour = float(fv[36])       # contour_irregularity
    arm_w_l = float(fv[37])       # upper_arm_width_left
    arm_w_r = float(fv[38])       # upper_arm_width_right
    arm_sym = float(fv[39])       # arm_width_symmetry
    thigh_l = float(fv[40])       # thigh_width_left
    thigh_r = float(fv[41])       # thigh_width_right
    thigh_sym = float(fv[42])     # thigh_width_symmetry
    chest_w = float(fv[43])       # chest_width_norm
    bstd = float(fv[46])          # body_brightness_std
    edge_u = float(fv[47])        # edge_density_upper
    edge_l = float(fv[48])        # edge_density_lower
    shl_tilt = float(fv[12])      # shoulder_tilt_deg
    spine_ang = float(fv[14])     # spine_angle_deg
    head_fwd = float(fv[15])      # head_forward_offset
    arm_len_sym = float(fv[8])    # arm_length_symmetry
    leg_len_sym = float(fv[11])   # leg_length_symmetry

    sil_wst = max(sil_wst, 0.05)
    sil_hip = max(sil_hip, 0.05)
    chest_w = max(chest_w, 0.05)

    # ── Ratio targets — use TARGETS ranges from measurement_model.py, NOT schema.json
    # TARGETS: shoulder_to_waist_ratio [1.0, 2.2], s2h [0.8, 2.0], w2h [0.6, 1.2]
    s2w = _clamp(sil_shl / sil_wst, 1.0, 2.2)
    s2h = _clamp(sil_shl / sil_hip, 0.8, 2.0)
    w2h = _clamp(sil_wst / sil_hip, 0.6, 1.2)

    # ── Conditioning proxy ──────────────────────────────────────────────────
    # High bstd + edge_u + contour → more definition
    conditioning = (bstd * 0.5 + edge_u * 0.3 + contour * 0.2) / 0.12  # normalised 0-1+
    conditioning = _clamp(conditioning, 0.0, 1.0)

    # ── Ordinal scores ──────────────────────────────────────────────────────
    # shoulder_width: mapped from silhouette shoulder width
    # shl_score_raw is already in 0-5 scale; do NOT multiply by 5 again
    shl_score_raw = (sil_shl - 0.18) / 0.052  # 0.18→0, 0.44→~4.9
    shl_score = _ord(shl_score_raw, 0, 5, 0.35)

    # shoulder_roundness: width + definition
    shl_round_raw = (shl_score_raw * 0.7 + conditioning * 5 * 0.3)
    shl_round = _ord(shl_round_raw, 0, 5, 0.4)

    # arm_thickness: direct from arm width
    arm_w_mean = (arm_w_l + arm_w_r) / 2
    # 0.030→0, 0.093→~5 (already 0-5 scale)
    arm_score_raw = (arm_w_mean - 0.030) / 0.013
    arm_score = _ord(arm_score_raw, 0, 5, 0.4)

    # forearm slightly lower than arm
    forearm_score = _ord(arm_score - 0.8, 0, 5, 0.5)

    # chest_development: chest width + conditioning
    chest_raw = ((chest_w - 0.18) / 0.038 * 0.6 + conditioning * 5 * 0.4)
    chest_score = _ord(_clamp(chest_raw, 0, 5), 0, 5, 0.4)

    # trap_development: shoulder width + edge upper
    trap_raw = (shl_score_raw * 0.6 + edge_u / 0.05 * 0.4)
    trap_score = _ord(_clamp(trap_raw, 0, 5), 0, 5, 0.5)

    # abs_definition: conditioning + thin waist
    abs_raw = conditioning * 0.7 + (0.28 - sil_wst) / 0.10 * 0.3
    abs_raw = _clamp(abs_raw, 0.0, 1.0)
    abs_score = _ord(abs_raw * 5, 0, 5, 0.5)

    # waist_softness: inverse of conditioning + wide waist
    waist_soft_raw = (0.25 - conditioning * 0.6) + (sil_wst - 0.18) / 0.12 * 0.4
    waist_soft = _ord(_clamp(waist_soft_raw * 5, 0, 5), 0, 5, 0.5)

    # oblique: slightly below abs
    oblique_score = _ord(abs_score - 0.7, 0, 5, 0.5)

    # muscular_separation: conditioning dominates
    separation_raw = conditioning * 0.8 + edge_u * 0.2 / 0.25
    separation = _ord(_clamp(separation_raw * 5, 0, 5), 0, 5, 0.4)

    # vascularity: only visible at high conditioning + low BF
    vasc_raw = _clamp((conditioning - 0.6) * 5, 0, 5)
    vascularity = _ord(vasc_raw, 0, 5, 0.4)

    # v_taper_visibility
    vtaper_score = _ord(vtaper * 6.5, 0, 5, 0.3)

    # quad_development: thigh width + conditioning
    thigh_mean = (thigh_l + thigh_r) / 2
    quad_raw = (thigh_mean - 0.05) / 0.016 * 0.7 + conditioning * 5 * 0.3
    quad_score = _ord(_clamp(quad_raw, 0, 5), 0, 5, 0.5)

    # calf slightly less than quad
    calf_score = _ord(max(0, quad_score - 0.8), 0, 5, 0.5)

    # glute from thigh + pose
    glute_raw = (thigh_mean - 0.04) / 0.016
    glute_score = _ord(_clamp(glute_raw, 0, 5), 0, 5, 0.5)

    # posture alignment: low shoulder tilt = good alignment
    posture_shl = _ord(_clamp(5 - shl_tilt / 2.5, 0, 5), 0, 5, 0.4)

    # spinal curvature
    spine_score = _ord(_clamp(5 - spine_ang / 3, 0, 5), 0, 5, 0.4)

    # head position
    head_score = _ord(_clamp(5 - head_fwd * 25, 0, 5), 0, 5, 0.4)

    # symmetry
    overall_sym = (arm_len_sym + leg_len_sym + arm_sym + thigh_sym) / 4
    sym_score = _ord(_clamp(5 - overall_sym * 35, 0, 5), 0, 5, 0.4)

    # back_width (back/mixed pose only)
    back_width = shl_score if pose_type in ("back", "mixed") else None

    # lat_flare (back pose only)
    lat_flare = _ord(shl_score_raw * 5 * 0.9, 0, 5, 0.4) if pose_type in ("back", "mixed") else None

    # glute / quad nullability by pose type
    if pose_type == "front":
        glute_val = None
    else:
        glute_val = glute_score

    if pose_type == "back":
        quad_val = None
    else:
        quad_val = quad_score

    return {
        "shoulder_to_waist_ratio": round(_clamp(s2w + np.random.normal(0, 0.03), 1.0, 2.2), 3),
        "shoulder_to_hip_ratio": round(_clamp(s2h + np.random.normal(0, 0.03), 0.8, 2.0), 3),
        "waist_to_hip_ratio": round(_clamp(w2h + np.random.normal(0, 0.02), 0.6, 1.2), 3),
        "chest_development": chest_score,
        "shoulder_roundness": shl_round,
        "shoulder_width": shl_score,
        "arm_thickness": arm_score,
        "forearm_development": forearm_score,
        "trap_development": trap_score,
        "back_width": back_width,
        "abs_definition": abs_score,
        "oblique_development": oblique_score,
        "quad_development": quad_val,
        "calf_development": calf_score,
        "glute_development": glute_val,
        "muscular_separation": separation,
        "vascularity": vascularity,
        "waist_softness": waist_soft,
        "posture_shoulder_alignment": posture_shl,
        "posture_head_position": head_score,
        "spinal_curvature": spine_score,
        "left_right_symmetry": sym_score,
        "v_taper_visibility": vtaper_score,
        "lat_flare": lat_flare,
    }


def _clamp_features(fv: np.ndarray) -> np.ndarray:
    """Hard-clamp features to physically valid ranges."""
    fv = fv.copy()
    # Widths: 0..1 (ratio of image width)
    for i in [0, 1, 6, 7, 9, 10, 27, 28, 29, 33, 34, 37, 38, 40, 41, 43]:
        fv[i] = _clamp(fv[i], 0.01, 0.99)
    # Symmetry metrics: 0..0.5
    for i in [8, 11, 39, 42]:
        fv[i] = _clamp(fv[i], 0.0, 0.5)
    # Angles (degrees): 0..180
    for i in [12, 13, 14]:
        fv[i] = _clamp(fv[i], 0.0, 30.0)
    for i in [17, 18, 20, 21]:
        fv[i] = _clamp(fv[i], 90.0, 180.0)
    for i in [19, 22]:
        fv[i] = _clamp(fv[i], 0.0, 20.0)
    # Visibility: 0..1
    for i in [23, 24, 25]:
        fv[i] = _clamp(fv[i], 0.3, 1.0)
    # Area, ratios, taper: 0..1
    for i in [26, 30, 31, 32, 36]:
        fv[i] = _clamp(fv[i], 0.0, 1.0)
    # Aspect ratio: 1..5
    fv[35] = _clamp(fv[35], 1.0, 5.0)
    # Brightness: 0..1
    for i in [45, 46, 47, 48]:
        fv[i] = _clamp(fv[i], 0.0, 1.0)
    # head_forward_offset, shoulder_height_diff
    fv[15] = _clamp(fv[15], -0.1, 0.3)
    fv[16] = _clamp(fv[16], 0.0, 0.1)
    # pose_type_encoded
    fv[49] = round(_clamp(fv[49], 0.0, 3.0))
    return fv


def generate(n_samples: int, seed: int = 42) -> list[dict]:
    rng = np.random.default_rng(seed)

    # Scale archetypes to hit n_samples
    total_base = sum(n for _, n, _, _ in ARCHETYPES)
    scale = n_samples / total_base

    rows = []
    for name, base_n, pose_type, arch in ARCHETYPES:
        n = max(1, round(base_n * scale))
        means = arch["means"].copy()
        stds = arch["stds"].copy()

        # pose_type_encoded is fixed (not sampled)
        pose_enc_val = means[49]

        for _ in range(n):
            fv = rng.normal(means, stds).astype(np.float32)
            fv[49] = pose_enc_val  # deterministic pose type
            fv = _clamp_features(fv)

            labels = features_to_labels(fv, pose_type)

            # Add realistic metadata (height/weight correlated with archetype)
            sex = "female" if "female" in name else "male"
            if sex == "male":
                height = float(rng.normal(178, 7))
                weight = float(rng.normal(82 if "advanced" in name or "elite" in name
                                          else (95 if "overweight" in name else 74), 9))
                bf = float(rng.normal(
                    8 if "elite" in name else (13 if "advanced" in name
                     else (20 if "intermediate" in name
                           else (30 if "overweight" in name else 15))), 4))
                years = float(rng.normal(
                    8 if "elite" in name else (5 if "advanced" in name
                     else (2 if "intermediate" in name else 0.5)), 2))
            else:
                height = float(rng.normal(165, 6))
                weight = float(rng.normal(62 if "advanced" in name else (72 if "intermediate" in name else 58), 8))
                bf = float(rng.normal(16 if "advanced" in name else 25, 5))
                years = float(rng.normal(4 if "advanced" in name else 1.5, 2))

            row = {
                "image_id": str(uuid.uuid4()),
                "image_paths": [],
                "feature_vector": [round(float(x), 6) for x in fv],
                "pose_type": pose_type,
                "source": "pose_dataset_bootstrap",
                "labels": labels,
                "metadata": {
                    "height_cm": round(_clamp(height, 140, 220), 1),
                    "weight_kg": round(_clamp(weight, 40, 160), 1),
                    "bf_percent": round(_clamp(bf, 3, 45), 1),
                    "sex": sex,
                    "training_years": round(_clamp(years, 0, 30), 1),
                    "competition_level": (
                        "professional" if "elite" in name
                        else "amateur" if "advanced" in name
                        else "none"
                    ),
                },
                "trainer_notes": f"Synthetic sample — archetype: {name}",
            }
            rows.append(row)

    rng.shuffle(rows)
    return rows[:n_samples]


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic training data")
    parser.add_argument("--n-samples", type=int, default=200)
    parser.add_argument("--output", default="data/train.jsonl")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--append", action="store_true",
                        help="Append to existing JSONL instead of overwriting")
    args = parser.parse_args()

    rows = generate(args.n_samples, seed=args.seed)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    mode = "a" if args.append else "w"
    with output.open(mode) as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")

    print(f"[generate_synthetic] Wrote {len(rows)} samples to {output}")
    sources = {}
    poses = {}
    for r in rows:
        sources[r["source"]] = sources.get(r["source"], 0) + 1
        poses[r["pose_type"]] = poses.get(r["pose_type"], 0) + 1
    print(f"  Sources:    {sources}")
    print(f"  Pose types: {poses}")
    print(f"  Sexes:      male={sum(1 for r in rows if r['metadata']['sex']=='male')}, "
          f"female={sum(1 for r in rows if r['metadata']['sex']=='female')}")


if __name__ == "__main__":
    main()
