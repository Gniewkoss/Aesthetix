"""
Fetch physique posts from Reddit for training data collection.

Prerequisites (Faza 1 — nie commituj kluczy):
  export REDDIT_CLIENT_ID=<your_app_id>
  export REDDIT_CLIENT_SECRET=<your_app_secret>
  export REDDIT_USER_AGENT="PhysiqueMax/1.0 by <your_username>"
  export OPENAI_API_KEY=<for GPT bootstrap labels>

Create a Reddit app at: https://www.reddit.com/prefs/apps
  Type: script
  Redirect URI: http://localhost:8080

Subreddits: r/BulkOrCut, r/progresspics, r/bodybuilding, r/Brogress,
            r/GregDoucette, r/nattyorjuice

Usage:
  python -m training.fetch_reddit \\
    --subreddits BulkOrCut progresspics Brogress \\
    --limit 50 \\
    --output data/train.jsonl \\
    --images-dir data/images \\
    --bootstrap-labels          # calls GPT-4o for labels
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

# NLP label mapping (must be importable without PRAW)
from training.nlp_labels_from_text import extract_metadata_from_text, map_comments_to_labels

TARGET_SUBREDDITS = [
    "BulkOrCut",
    "progresspics",
    "bodybuilding",
    "Brogress",
    "GregDoucette",
    "nattyorjuice",
]

IMAGE_DOMAINS = {"i.redd.it", "i.imgur.com", "imgur.com"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# ── Regex patterns for metadata extraction ────────────────────────────────────
HEIGHT_RE = re.compile(
    r"(?:height|ht|h)[:\s]?\s*"
    r"(?:(\d{1,3})\s*cm|"         # 180cm
    r"(\d+)\s*['']\s*(\d+)\s*[\"\"]?)",  # 5'11"
    re.IGNORECASE,
)
WEIGHT_RE = re.compile(
    r"(?:weight|wt|w)[:\s]?\s*"
    r"(?:(\d+\.?\d*)\s*(?:kg|kgs)|"       # 80kg
    r"(\d+\.?\d*)\s*(?:lbs?|pounds?))",    # 175lbs
    re.IGNORECASE,
)
BF_RE = re.compile(r"(\d+\.?\d*)\s*%?\s*(?:bf|body\s*fat)", re.IGNORECASE)
YEARS_RE = re.compile(
    r"(\d+\.?\d*)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:lifting|training|gym)",
    re.IGNORECASE,
)
SEX_RE = re.compile(r"\b(male|female|[mf])\b", re.IGNORECASE)


def _is_image_url(url: str) -> bool:
    parsed = urlparse(url)
    return (
        parsed.netloc in IMAGE_DOMAINS
        or any(parsed.path.lower().endswith(ext) for ext in IMAGE_EXTS)
    )


def _download_image(url: str, dest: Path, session) -> Optional[Path]:
    """Download image to dest, return path or None on failure."""
    try:
        ext = Path(urlparse(url).path).suffix.lower() or ".jpg"
        if ext not in IMAGE_EXTS:
            ext = ".jpg"
        dest.parent.mkdir(parents=True, exist_ok=True)
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
        dest_file = dest.with_suffix(ext)
        dest_file.write_bytes(resp.content)
        return dest_file
    except Exception as e:
        print(f"  Download failed {url}: {e}")
        return None


def collect_post(submission, images_dir: Path, session) -> Optional[dict]:
    """Process one Reddit submission → session dict (without labels)."""
    post_text = f"{submission.title}\n{submission.selftext}"

    # Find image URLs
    image_urls = []
    if _is_image_url(submission.url):
        image_urls.append(submission.url)
    if hasattr(submission, "media_metadata"):
        for item in submission.media_metadata.values():
            try:
                url = item["s"]["u"]
                if _is_image_url(url):
                    image_urls.append(url)
            except (KeyError, TypeError):
                pass
    if hasattr(submission, "gallery_data"):
        for item in submission.gallery_data.get("items", []):
            media_id = item.get("media_id", "")
            if media_id and hasattr(submission, "media_metadata"):
                try:
                    url = submission.media_metadata[media_id]["s"]["u"]
                    if _is_image_url(url):
                        image_urls.append(url)
                except (KeyError, TypeError):
                    pass

    if not image_urls:
        return None

    # Collect top comments (max 10) for NLP
    top_comments = []
    try:
        submission.comments.replace_more(limit=0)
        for c in list(submission.comments)[:10]:
            if len(c.body) > 10:
                top_comments.append(c.body)
    except Exception:
        pass

    full_text = post_text + "\n" + "\n".join(top_comments)

    # NLP: extract metadata + weak-label hints
    metadata = extract_metadata_from_text(post_text)
    nlp_label_hints = map_comments_to_labels("\n".join(top_comments))

    # Download images
    session_id = f"reddit_{submission.id}"
    session_dir = images_dir / session_id
    downloaded = []
    for i, url in enumerate(image_urls[:4]):
        dest = session_dir / f"img_{i:02d}"
        fpath = _download_image(url, dest, session)
        if fpath:
            downloaded.append(str(fpath.relative_to(images_dir.parent)))

    if not downloaded:
        return None

    # Determine pose_type from title heuristics
    title_lower = submission.title.lower()
    if "back" in title_lower and "front" in title_lower:
        pose_type = "mixed"
    elif "back" in title_lower:
        pose_type = "back"
    elif "side" in title_lower:
        pose_type = "side"
    else:
        pose_type = "front"

    return {
        "image_id": session_id,
        "image_paths": downloaded,
        "pose_type": pose_type,
        "source": "gpt4o_bootstrap",
        "metadata": metadata,
        "trainer_notes": f"r/{submission.subreddit.display_name} — {submission.title[:120]}",
        "_nlp_label_hints": nlp_label_hints,
        "_post_text": post_text[:500],  # kept for audit; not in schema
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Reddit physique posts")
    parser.add_argument("--subreddits", nargs="+",
                        default=["BulkOrCut", "progresspics", "Brogress"])
    parser.add_argument("--limit", type=int, default=50,
                        help="Posts per subreddit")
    parser.add_argument("--sort", default="top", choices=["top", "hot", "new"])
    parser.add_argument("--time-filter", default="year",
                        choices=["day", "week", "month", "year", "all"])
    parser.add_argument("--output", default="data/train.jsonl")
    parser.add_argument("--images-dir", default="data/images")
    parser.add_argument("--bootstrap-labels", action="store_true",
                        help="Run GPT-4o bootstrap on downloaded images")
    parser.add_argument("--delay", type=float, default=1.0,
                        help="Seconds between requests")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    # Check Reddit credentials
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "PhysiqueMax/1.0")

    if not client_id or not client_secret:
        print("ERROR: Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET", file=sys.stderr)
        print("  Create an app at https://www.reddit.com/prefs/apps", file=sys.stderr)
        sys.exit(1)

    try:
        import praw
        import requests
    except ImportError:
        print("ERROR: pip install praw requests", file=sys.stderr)
        sys.exit(1)

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        # read-only; no username/password needed for public posts
    )
    session = requests.Session()
    session.headers["User-Agent"] = user_agent

    images_dir = Path(args.images_dir)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    # Load existing IDs for resume
    existing_ids: set[str] = set()
    if args.resume and output.exists():
        with output.open() as f:
            for line in f:
                line = line.strip()
                if line:
                    existing_ids.add(json.loads(line).get("image_id", ""))

    # Bootstrap labels setup
    bootstrap_client = None
    if args.bootstrap_labels:
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            print("WARNING: OPENAI_API_KEY not set — skipping GPT bootstrap", file=sys.stderr)
        else:
            from openai import OpenAI
            from training.bootstrap_labels import label_session
            bootstrap_client = OpenAI(api_key=openai_key)

    written = 0

    for sub_name in args.subreddits:
        print(f"\n[reddit] Fetching r/{sub_name} ({args.sort}/{args.time_filter})...")
        try:
            subreddit = reddit.subreddit(sub_name)
            if args.sort == "top":
                posts = subreddit.top(time_filter=args.time_filter, limit=args.limit)
            elif args.sort == "hot":
                posts = subreddit.hot(limit=args.limit)
            else:
                posts = subreddit.new(limit=args.limit)
        except Exception as e:
            print(f"  ERROR accessing r/{sub_name}: {e}", file=sys.stderr)
            continue

        for submission in posts:
            session_id = f"reddit_{submission.id}"
            if args.resume and session_id in existing_ids:
                continue

            row = collect_post(submission, images_dir, session)
            if row is None:
                continue

            # GPT-4o bootstrap labels
            if bootstrap_client and row.get("image_paths"):
                try:
                    from training.bootstrap_labels import label_session, extract_labels
                    abs_paths = [
                        Path("data") / p if not Path(p).is_absolute() else Path(p)
                        for p in row["image_paths"]
                    ]
                    existing_files = [p for p in abs_paths if p.exists()]
                    if existing_files:
                        raw = label_session(bootstrap_client, existing_files)
                        row["labels"] = extract_labels(raw)
                        row["pose_type"] = raw.get("pose_type", row["pose_type"])
                        # Merge NLP hints into labels (where GPT label is 0 or null)
                        hints = row.pop("_nlp_label_hints", {})
                        for k, v in hints.items():
                            if k in row["labels"] and row["labels"][k] in (None, 0):
                                row["labels"][k] = v
                except Exception as e:
                    print(f"  GPT bootstrap failed: {e}")

            # Remove internal fields before writing
            row.pop("_nlp_label_hints", None)
            row.pop("_post_text", None)

            # Skip rows without labels (need manual labeling or bootstrap)
            if "labels" not in row:
                print(f"  [skip] {session_id} — no labels (run with --bootstrap-labels)")
                continue

            with output.open("a") as f:
                f.write(json.dumps(row) + "\n")
            written += 1
            print(f"  [ok] {session_id} → {len(row['image_paths'])} images, "
                  f"pose={row['pose_type']}")

            time.sleep(args.delay)

    print(f"\n[reddit] Done. Written {written} sessions to {output}")
    if written < 50:
        print("TIP: Run with more subreddits or higher --limit to collect 150+ sessions.")


if __name__ == "__main__":
    main()
