"""
Label physique images with GPT-4o and append to train.jsonl.

Folder layout (recommended):
  data/images/session_001/front.jpg
  data/images/session_001/back.jpg
  data/images/session_002/front.jpg

Usage (inside Docker or local venv with OPENAI_API_KEY):
  python -m training.bootstrap_labels \\
    --images-dir data/images \\
    --output data/train.jsonl \\
    --delay 2

Resume after interruption:
  python -m training.bootstrap_labels --images-dir data/images --output data/train.jsonl --resume
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import uuid
from pathlib import Path

from models.measurement_model import TARGET_NAMES
from training.prompts import VISUAL_MEASUREMENT_PROMPT

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def extract_labels(raw: dict) -> dict:
    return {name: raw.get(name) for name in TARGET_NAMES}


def discover_sessions(images_dir: Path, flat: bool) -> list[tuple[str, list[Path]]]:
    if flat:
        files = sorted(p for p in images_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS)
        return [(p.stem, [p]) for p in files]

    subdirs = sorted(d for d in images_dir.iterdir() if d.is_dir())
    if subdirs:
        sessions = []
        for d in subdirs:
            files = sorted(p for p in d.iterdir() if p.suffix.lower() in IMAGE_EXTS)
            if files:
                sessions.append((d.name, files))
        return sessions

    files = sorted(p for p in images_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    return [(p.stem, [p]) for p in files]


def to_data_relative(path: Path, data_root: Path) -> str:
    try:
        return str(path.relative_to(data_root))
    except ValueError:
        return str(path)


def load_existing_ids(output_path: Path) -> set[str]:
    if not output_path.exists():
        return set()
    ids: set[str] = set()
    with output_path.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            ids.add(row["image_id"])
    return ids


def label_session(client, image_paths: list[Path]) -> dict:
    contents = []
    for path in image_paths:
        b64 = base64.b64encode(path.read_bytes()).decode()
        mime = "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"
        contents.append({
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"},
        })
    contents.append({"type": "text", "text": VISUAL_MEASUREMENT_PROMPT})

    resp = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=1024,
        messages=[{"role": "user", "content": contents}],
        response_format={"type": "json_object"},
    )
    return json.loads(resp.choices[0].message.content)


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap training labels with GPT-4o")
    parser.add_argument("--images-dir", default="data/images")
    parser.add_argument("--output", default="data/train.jsonl")
    parser.add_argument("--data-root", default="data", help="Root for relative image_paths in JSONL")
    parser.add_argument("--source", default="gpt4o_bootstrap")
    parser.add_argument("--flat", action="store_true", help="Each file = one session")
    parser.add_argument("--resume", action="store_true", help="Skip sessions already in output")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds between API calls")
    parser.add_argument("--max-sessions", type=int, default=None)
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: Set OPENAI_API_KEY (Supabase secret or export in shell).", file=sys.stderr)
        sys.exit(1)

    from openai import OpenAI

    images_dir = Path(args.images_dir)
    data_root = Path(args.data_root)
    output_path = Path(args.output)

    if not images_dir.exists():
        print(f"ERROR: {images_dir} does not exist.", file=sys.stderr)
        print("Create folders like data/images/session_001/front.jpg", file=sys.stderr)
        sys.exit(1)

    sessions = discover_sessions(images_dir, args.flat)
    if not sessions:
        print(f"ERROR: No images found in {images_dir}", file=sys.stderr)
        sys.exit(1)

    existing_ids = load_existing_ids(output_path) if args.resume else set()
    client = OpenAI(api_key=api_key)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    skipped = 0

    for i, (session_name, files) in enumerate(sessions):
        if args.max_sessions and written >= args.max_sessions:
            break

        image_id = session_name if session_name else str(uuid.uuid4())
        if args.resume and image_id in existing_ids:
            skipped += 1
            continue

        rel_paths = [to_data_relative(p, data_root) for p in files]
        print(f"[{i + 1}/{len(sessions)}] Labeling {image_id} ({len(files)} image(s))...")

        try:
            raw = label_session(client, files)
        except Exception as e:
            print(f"  FAILED: {e}")
            continue

        row = {
            "image_id": image_id,
            "image_paths": rel_paths,
            "pose_type": raw.get("pose_type", "front"),
            "source": args.source,
            "labels": extract_labels(raw),
        }

        with output_path.open("a") as f:
            f.write(json.dumps(row) + "\n")

        written += 1
        print(f"  OK pose={row['pose_type']}")
        if args.delay > 0:
            time.sleep(args.delay)

    print(f"\nDone. Wrote {written} samples to {output_path} (skipped {skipped}).")
    if written < 50:
        print("WARNING: <50 samples — train anyway, but aim for 200+ for solid quality.")


if __name__ == "__main__":
    main()
