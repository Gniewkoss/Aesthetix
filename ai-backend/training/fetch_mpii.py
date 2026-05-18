"""
Download MPII Human Pose dataset and convert keypoints → feature vectors.

Status: MPII requires accepting a license at http://human-pose.mpi-inf.mpg.de/
        Run this script AFTER downloading images manually to --mpii-images-dir.

Two-step process:
  Step 1 (manual): Download from http://human-pose.mpi-inf.mpg.de/#download
    - Images:      images.tar.gz  (~12 GB)
    - Annotations: mpii_human_pose_v1_u12_2.zip

  Step 2 (automatic, this script):
    python -m training.fetch_mpii \\
      --annotations mpii_human_pose_v1_u12_2/mpii_human_pose_v1_u12_1.mat \\
      --mpii-images-dir /path/to/mpii/images \\
      --output data/train.jsonl \\
      --max-samples 500 \\
      --bootstrap-labels   # GPT-4o labeling (needs OPENAI_API_KEY)

Leeds Sports Pose (LSP) — smaller, 2000 images, easier to use:
  Download: https://sam.johnson.io/research/lsp_dataset_original.tar.gz (no registration needed)
  Run with --format lsp

H3WB — 133-keypoint whole-body (requires institutional access):
  https://github.com/wholebody3d/wholebody3d
  License: CC BY-NC 4.0 (non-commercial only — DO NOT use in commercial product)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Optional

# ── Leeds Sports Pose (LSP) downloader ────────────────────────────────────────

LSP_URL = "https://sam.johnson.io/research/lsp_dataset_original.tar.gz"
LSP_JOINTS = [
    "R_ankle", "R_knee", "R_hip", "L_hip", "L_knee", "L_ankle",
    "R_wrist", "R_elbow", "R_shoulder", "L_shoulder", "L_elbow", "L_wrist",
    "Neck", "Head_top",
]


def download_lsp(dest_dir: Path) -> Path:
    """Download Leeds Sports Pose dataset (no registration needed, ~1GB)."""
    import tarfile
    import urllib.request

    dest_dir.mkdir(parents=True, exist_ok=True)
    tar_path = dest_dir / "lsp_dataset_original.tar.gz"

    if not tar_path.exists():
        print(f"[lsp] Downloading {LSP_URL} → {tar_path}")
        print("      This may take a while (~1 GB)...")
        try:
            urllib.request.urlretrieve(LSP_URL, tar_path,
                                       reporthook=lambda b, bs, t: print(
                                           f"\r  {min(100, int(b*bs/t*100))}%",
                                           end="", flush=True) if t > 0 else None)
            print()
        except Exception as e:
            print(f"ERROR downloading LSP: {e}", file=sys.stderr)
            print("Manual download: curl -L -o lsp.tar.gz " + LSP_URL, file=sys.stderr)
            return None
    else:
        print(f"[lsp] Archive exists: {tar_path}")

    extract_dir = dest_dir / "lsp_dataset_original"
    if not extract_dir.exists():
        print(f"[lsp] Extracting to {extract_dir}...")
        with tarfile.open(tar_path) as tf:
            tf.extractall(dest_dir)
    return extract_dir


def _joints_for_height(joints: list) -> list:
    """Pick joints for normalizing heights (HF LSP often has vis=0 but valid x,y)."""
    visible = [j for j in joints if j[2] > 0]
    if len(visible) >= 4:
        return visible
    placed = [j for j in joints if abs(j[0]) > 1e-3 or abs(j[1]) > 1e-3]
    return placed if len(placed) >= 4 else joints


def lsp_joints_to_features(joints: list) -> Optional[dict]:
    """
    Convert 14 LSP keypoints → approximate feature vector dict.
    joints: list of [x, y, visible] per joint
    Returns partial feature dict (only pose-derived features; silhouette = zeros).
    """
    if len(joints) < 14:
        return None

    def kp(idx: int):
        return joints[idx][0], joints[idx][1]

    def dist(a, b):
        return ((a[0] - b[0])**2 + (a[1] - b[1])**2) ** 0.5

    try:
        height_joints = _joints_for_height(joints)
        ys = [j[1] for j in height_joints]
        if not ys:
            return None
        img_h = max(ys) - min(ys)
        if img_h < 1:
            img_h = 1.0

        r_shl, l_shl = kp(8), kp(9)
        r_hip, l_hip = kp(2), kp(3)
        r_knee, l_knee = kp(1), kp(4)
        r_ank, l_ank = kp(0), kp(5)
        r_elb, l_elb = kp(7), kp(10)
        r_wst, l_wst = kp(6), kp(11)
        neck = kp(12)

        shl_w = dist(r_shl, l_shl) / img_h
        hip_w = dist(r_hip, l_hip) / img_h
        torso_h = dist(neck, ((r_hip[0]+l_hip[0])/2, (r_hip[1]+l_hip[1])/2)) / img_h
        leg_h = dist(r_hip, r_ank) / img_h

        l_arm = dist(l_shl, l_wst) / img_h
        r_arm = dist(r_shl, r_wst) / img_h
        l_leg = dist(l_hip, l_ank) / img_h
        r_leg = dist(r_hip, r_ank) / img_h

        shl_cx = (r_shl[0] + l_shl[0]) / 2
        hip_cx = (r_hip[0] + l_hip[0]) / 2
        spine_dx = abs(shl_cx - hip_cx) / img_h * 90
        shl_tilt = abs(r_shl[1] - l_shl[1]) / img_h * 90
        hip_tilt = abs(r_hip[1] - l_hip[1]) / img_h * 90

        return {
            "shoulder_width_norm": min(1.0, shl_w),
            "hip_width_norm": min(1.0, hip_w),
            "torso_height_norm": min(1.0, torso_h),
            "leg_height_norm": min(1.0, leg_h),
            "upper_lower_ratio": min(2.0, torso_h / max(leg_h, 0.01)),
            "left_arm_length_norm": min(1.0, l_arm),
            "right_arm_length_norm": min(1.0, r_arm),
            "arm_length_symmetry": min(0.5, abs(l_arm - r_arm) / max((l_arm + r_arm)/2, 0.01)),
            "left_leg_length_norm": min(1.0, l_leg),
            "right_leg_length_norm": min(1.0, r_leg),
            "leg_length_symmetry": min(0.5, abs(l_leg - r_leg) / max((l_leg + r_leg)/2, 0.01)),
            "shoulder_tilt_deg": min(30.0, shl_tilt),
            "hip_tilt_deg": min(30.0, hip_tilt),
            "spine_angle_deg": min(30.0, spine_dx),
            "shoulder_to_hip_ratio_pose": min(3.0, shl_w / max(hip_w, 0.01)),
        }
    except (ZeroDivisionError, IndexError):
        return None


def process_lsp_dataset(
    lsp_dir: Path,
    output: Path,
    max_samples: int = 500,
    bootstrap_client=None,
    data_root: Path = Path("data"),
) -> int:
    """Process LSP dataset → train.jsonl entries."""
    try:
        import scipy.io
    except ImportError:
        print("ERROR: pip install scipy (for LSP .mat files)", file=sys.stderr)
        return 0

    joints_file = lsp_dir / "joints.mat"
    images_dir = lsp_dir / "images"

    if not joints_file.exists():
        print(f"ERROR: {joints_file} not found", file=sys.stderr)
        return 0

    mat = scipy.io.loadmat(str(joints_file))
    joints_data = mat["joints"]  # (3, 14, N)

    image_files = sorted(images_dir.glob("im*.jpg"))
    n = min(max_samples, len(image_files), joints_data.shape[2])

    written = 0
    output.parent.mkdir(parents=True, exist_ok=True)

    for i in range(n):
        img_path = image_files[i] if i < len(image_files) else None
        if img_path is None or not img_path.exists():
            continue

        # joints_data: (3=x/y/vis, 14_joints, N_samples)
        joints = [(joints_data[0, j, i], joints_data[1, j, i], joints_data[2, j, i])
                  for j in range(14)]

        pose_feats = lsp_joints_to_features(joints)
        if pose_feats is None:
            continue

        # Build full 50-feature vector (pose-derived + zero silhouette features)
        fv_dict = {
            "shoulder_width_norm": pose_feats.get("shoulder_width_norm", 0.22),
            "hip_width_norm": pose_feats.get("hip_width_norm", 0.22),
            "shoulder_to_hip_ratio_pose": pose_feats.get("shoulder_to_hip_ratio_pose", 1.0),
            "torso_height_norm": pose_feats.get("torso_height_norm", 0.32),
            "leg_height_norm": pose_feats.get("leg_height_norm", 0.42),
            "upper_lower_ratio": pose_feats.get("upper_lower_ratio", 0.76),
            "left_arm_length_norm": pose_feats.get("left_arm_length_norm", 0.28),
            "right_arm_length_norm": pose_feats.get("right_arm_length_norm", 0.28),
            "arm_length_symmetry": pose_feats.get("arm_length_symmetry", 0.01),
            "left_leg_length_norm": pose_feats.get("left_leg_length_norm", 0.40),
            "right_leg_length_norm": pose_feats.get("right_leg_length_norm", 0.40),
            "leg_length_symmetry": pose_feats.get("leg_length_symmetry", 0.01),
            "shoulder_tilt_deg": pose_feats.get("shoulder_tilt_deg", 3.0),
            "hip_tilt_deg": pose_feats.get("hip_tilt_deg", 2.0),
            "spine_angle_deg": pose_feats.get("spine_angle_deg", 3.0),
            "head_forward_offset": 0.05,
            "shoulder_height_diff_norm": pose_feats.get("shoulder_tilt_deg", 3.0) / 300,
            "left_elbow_angle": 155.0,
            "right_elbow_angle": 155.0,
            "elbow_angle_symmetry": 3.0,
            "left_knee_angle": 165.0,
            "right_knee_angle": 165.0,
            "knee_angle_symmetry": 3.0,
            "landmark_visibility_mean": 0.85,
            "upper_body_visibility": 0.90,
            "lower_body_visibility": 0.80,
            "body_mask_area_norm": 0.35,
            "silhouette_shoulder_width": pose_feats.get("shoulder_width_norm", 0.22) * 1.1,
            "silhouette_waist_width": pose_feats.get("hip_width_norm", 0.22) * 0.85,
            "silhouette_hip_width": pose_feats.get("hip_width_norm", 0.22),
            "shoulder_to_waist_sil": pose_feats.get("shoulder_to_hip_ratio_pose", 1.1),
            "waist_to_hip_sil": 0.85,
            "v_taper_raw": max(0, pose_feats.get("shoulder_to_hip_ratio_pose", 1.0) - 1.0) / 1.5,
            "upper_body_width_mean": pose_feats.get("shoulder_width_norm", 0.22) * 0.95,
            "lower_body_width_mean": pose_feats.get("hip_width_norm", 0.22) * 0.95,
            "aspect_ratio": 2.5,
            "contour_irregularity": 0.06,
            "upper_arm_width_left": 0.055,
            "upper_arm_width_right": 0.055,
            "arm_width_symmetry": 0.005,
            "thigh_width_left": 0.085,
            "thigh_width_right": 0.085,
            "thigh_width_symmetry": 0.005,
            "chest_width_norm": pose_feats.get("shoulder_width_norm", 0.22) * 1.1,
            "waist_to_chest_ratio": 0.82,
            "body_brightness_mean": 0.55,
            "body_brightness_std": 0.08,
            "edge_density_upper": 0.08,
            "edge_density_lower": 0.06,
            "pose_type_encoded": 0.0,
        }

        from pipeline.feature_extractor import FEATURE_NAMES
        fv = [fv_dict.get(name, 0.0) for name in FEATURE_NAMES]

        # Get GPT-4o labels if available
        labels = None
        if bootstrap_client is not None:
            try:
                from training.bootstrap_labels import label_session, extract_labels
                raw = label_session(bootstrap_client, [img_path])
                labels = extract_labels(raw)
            except Exception as e:
                print(f"  GPT failed for {img_path.name}: {e}")

        if labels is None:
            # Heuristic labels from feature vector
            from training.generate_synthetic import features_to_labels
            import numpy as np
            labels = features_to_labels(np.array(fv, dtype=np.float32), "front")

        try:
            rel_path = str(img_path.relative_to(data_root))
        except ValueError:
            rel_path = str(img_path)

        row = {
            "image_id": f"lsp_{i:04d}",
            "image_paths": [rel_path],
            "feature_vector": [round(float(x), 6) for x in fv],
            "pose_type": "front",
            "source": "pose_dataset_bootstrap",
            "labels": labels,
            "trainer_notes": f"Leeds Sports Pose #{i:04d}",
        }

        with output.open("a") as f:
            f.write(json.dumps(row) + "\n")
        written += 1

        if written % 50 == 0:
            print(f"  [lsp] {written}/{n} processed")

    return written


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import MPII / LSP pose datasets into train.jsonl")
    parser.add_argument("--format", default="lsp", choices=["lsp", "mpii"],
                        help="lsp: Leeds Sports Pose; mpii: MPII Human Pose")
    parser.add_argument("--lsp-dir", default="datasets/lsp",
                        help="Where to download/look for LSP dataset")
    parser.add_argument("--annotations", default=None,
                        help="MPII: path to .mat annotations file")
    parser.add_argument("--mpii-images-dir", default=None)
    parser.add_argument("--output", default="data/train.jsonl")
    parser.add_argument("--max-samples", type=int, default=500)
    parser.add_argument("--bootstrap-labels", action="store_true")
    parser.add_argument("--data-root", default="data")
    args = parser.parse_args()

    output = Path(args.output)

    bootstrap_client = None
    if args.bootstrap_labels:
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            from openai import OpenAI
            bootstrap_client = OpenAI(api_key=openai_key)
        else:
            print("WARNING: OPENAI_API_KEY not set — using heuristic labels", file=sys.stderr)

    if args.format == "lsp":
        lsp_dir = Path(args.lsp_dir)
        if not (lsp_dir / "lsp_dataset_original").exists():
            extracted = download_lsp(lsp_dir)
        else:
            extracted = lsp_dir / "lsp_dataset_original"

        if extracted is None:
            sys.exit(1)

        n = process_lsp_dataset(
            extracted, output,
            max_samples=args.max_samples,
            bootstrap_client=bootstrap_client,
            data_root=Path(args.data_root),
        )
        print(f"[lsp] Wrote {n} samples to {output}")

    elif args.format == "mpii":
        if not args.annotations or not args.mpii_images_dir:
            print("ERROR: --annotations and --mpii-images-dir required for MPII", file=sys.stderr)
            print("Download from: http://human-pose.mpi-inf.mpg.de/#download", file=sys.stderr)
            sys.exit(1)
        print("MPII processing not yet implemented — use --format lsp for now.")


if __name__ == "__main__":
    main()
