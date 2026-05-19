"""
Generate synthetic physique training data for XGBoost bootstrapping.

Strategy:
- 20 body-type archetypes × pose types → realistic feature distributions
- Labels derived from features via domain-knowledge formulas (calibrated heuristics)
- Gaussian noise added to both features and labels for diversity
- Covers: elite→sedentary, male→female, front/back/side poses

v2 CHANGE: Produces 56-feature vectors matching the v2 pipeline:
  Indices 49-54 are the new silhouette features
  (neck_width_norm, waist_concavity, hip_drop_norm,
   taper_uniformity, calf_width_mean, conditioning_gradient)
  Index 55 = pose_type_encoded (moved from 49)

Source = "pose_dataset_bootstrap" → weighted 0.5× in training

Usage:
  python -m training.generate_synthetic --n-samples 2000 --output data/train.jsonl
  python -m training.generate_synthetic --n-samples 2000 --output data/train.jsonl --seed 42
"""
from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path
from typing import Any

import numpy as np

# ── Archetype helper ───────────────────────────────────────────────────────────
def _arch(
    shl_w=0.22, hip_w=0.22, torso_h=0.32, leg_h=0.42,
    sil_shl=0.28, sil_wst=0.22, sil_hip=0.24,
    arm_w=0.055, thigh_w=0.08, chest_w=0.24,
    bstd=0.08, edge_u=0.08, edge_l=0.06, contour=0.06,
    shl_tilt=4.0, spine_ang=4.0, head_fwd=0.05,
    vtaper=0.35, pose_enc=0.0, lm_vis=0.88,
    # v2 new features
    neck_w=0.10,
    waist_conc=0.18,
    hip_drop=0.07,
    taper_unif=0.10,
    calf_w=0.065,
    cond_grad=0.02,
    noise=1.0,
) -> dict:
    """Build 56-element archetype mean vector + std array."""
    arm_len = 0.28
    leg_len = 0.40
    means = np.array([
        # ── Pose geometric (indices 0-25) ─────────────────────────────────────
        shl_w,                             # 0  shoulder_width_norm
        hip_w,                             # 1  hip_width_norm
        shl_w / max(hip_w, 0.01),          # 2  shoulder_to_hip_ratio_pose
        torso_h,                           # 3  torso_height_norm
        leg_h,                             # 4  leg_height_norm
        torso_h / max(leg_h, 0.01),        # 5  upper_lower_ratio
        arm_len, arm_len,                  # 6,7  arm lengths
        0.015,                             # 8  arm_length_symmetry
        leg_len, leg_len,                  # 9,10  leg lengths
        0.015,                             # 11 leg_length_symmetry
        shl_tilt, shl_tilt * 0.8,         # 12,13 shoulder/hip tilt
        spine_ang,                         # 14 spine_angle_deg
        head_fwd,                          # 15 head_forward_offset
        0.01,                              # 16 shoulder_height_diff_norm
        155.0, 155.0,                      # 17,18 elbow angles
        3.0,                               # 19 elbow_angle_symmetry
        160.0, 160.0,                      # 20,21 knee angles
        3.0,                               # 22 knee_angle_symmetry
        lm_vis,                            # 23 landmark_visibility_mean
        lm_vis + 0.04,                     # 24 upper_body_visibility
        lm_vis - 0.05,                     # 25 lower_body_visibility
        # ── Segmentation original (indices 26-48) ─────────────────────────────
        sil_shl * sil_shl * 3.5,          # 26 body_mask_area_norm
        sil_shl,                           # 27 silhouette_shoulder_width
        sil_wst,                           # 28 silhouette_waist_width
        sil_hip,                           # 29 silhouette_hip_width
        sil_shl / max(sil_wst, 0.01),     # 30 shoulder_to_waist_sil
        sil_wst / max(sil_hip, 0.01),     # 31 waist_to_hip_sil
        vtaper,                            # 32 v_taper_raw
        (sil_shl + sil_wst) / 2,          # 33 upper_body_width_mean
        (sil_hip + sil_wst) / 2,          # 34 lower_body_width_mean
        2.5,                               # 35 aspect_ratio
        contour,                           # 36 contour_irregularity
        arm_w, arm_w,                      # 37,38 upper_arm_width
        0.005,                             # 39 arm_width_symmetry
        thigh_w, thigh_w,                  # 40,41 thigh_width
        0.005,                             # 42 thigh_width_symmetry
        chest_w,                           # 43 chest_width_norm
        sil_wst / max(chest_w, 0.01),      # 44 waist_to_chest_ratio
        0.55,                              # 45 body_brightness_mean
        bstd,                              # 46 body_brightness_std
        edge_u,                            # 47 edge_density_upper
        edge_l,                            # 48 edge_density_lower
        # ── New v2 silhouette features (indices 49-54) ────────────────────────
        neck_w,                            # 49 neck_width_norm
        waist_conc,                        # 50 waist_concavity
        hip_drop,                          # 51 hip_drop_norm
        taper_unif,                        # 52 taper_uniformity
        calf_w,                            # 53 calf_width_mean
        cond_grad,                         # 54 conditioning_gradient
        # ── Categorical (index 55) ────────────────────────────────────────────
        pose_enc,                          # 55 pose_type_encoded
    ], dtype=np.float64)

    base_std = np.array([
        # pose geometric
        0.03, 0.03, 0.08, 0.03, 0.04, 0.06, 0.02, 0.02, 0.01,
        0.025, 0.025, 0.01, 2.0, 1.5, 2.0, 0.02, 0.01,
        8.0, 8.0, 2.0, 8.0, 8.0, 2.0,
        0.05, 0.05, 0.06,
        # segmentation original
        0.04, 0.03, 0.025, 0.025, 0.10, 0.06, 0.08, 0.03, 0.03,
        0.3, 0.02,
        0.008, 0.008, 0.005, 0.012, 0.012, 0.005,
        0.025, 0.05, 0.06, 0.025, 0.025, 0.02,
        # new v2 features
        0.012,   # neck_width_norm
        0.06,    # waist_concavity
        0.025,   # hip_drop_norm
        0.04,    # taper_uniformity
        0.012,   # calf_width_mean
        0.018,   # conditioning_gradient
        # pose_type_encoded (deterministic)
        0.0,
    ], dtype=np.float64)

    assert len(means) == 56, f"Expected 56 means, got {len(means)}"
    assert len(base_std) == 56, f"Expected 56 stds, got {len(base_std)}"
    return {"means": means, "stds": base_std * noise}


_P = {"front": 0.0, "back": 1.0, "side": 2.0, "mixed": 3.0}

ARCHETYPES: list[tuple[str, int, str, dict]] = [
    # ── Professional / competition ─────────────────────────────────────────────
    ("pro_bodybuilder_front", 10, "front", _arch(
        shl_w=0.33, hip_w=0.19, sil_shl=0.46, sil_wst=0.16, sil_hip=0.24,
        arm_w=0.195, thigh_w=0.135, chest_w=0.40,
        bstd=0.28, edge_u=0.30, edge_l=0.22, contour=0.20,
        shl_tilt=0.8, spine_ang=0.8, head_fwd=0.01,
        vtaper=0.85, pose_enc=_P["front"], lm_vis=0.97,
        neck_w=0.12, waist_conc=0.68, hip_drop=0.10, taper_unif=0.28, calf_w=0.10, cond_grad=0.18,
        noise=0.4,
    )),
    ("pro_bodybuilder_back", 6, "back", _arch(
        shl_w=0.33, hip_w=0.20, sil_shl=0.47, sil_wst=0.17, sil_hip=0.25,
        arm_w=0.185, thigh_w=0.132, chest_w=0.39,
        bstd=0.27, edge_u=0.29, edge_l=0.21, contour=0.19,
        shl_tilt=0.7, spine_ang=0.9, head_fwd=0.01,
        vtaper=0.83, pose_enc=_P["back"], lm_vis=0.95,
        neck_w=0.12, waist_conc=0.65, hip_drop=0.11, taper_unif=0.26, calf_w=0.10, cond_grad=0.17,
        noise=0.4,
    )),

    # ── Elite / competition-level amateur ─────────────────────────────────────
    ("elite_male_front", 14, "front", _arch(
        shl_w=0.31, hip_w=0.20, sil_shl=0.43, sil_wst=0.18, sil_hip=0.25,
        arm_w=0.175, thigh_w=0.125, chest_w=0.37,
        bstd=0.22, edge_u=0.25, edge_l=0.18, contour=0.16,
        shl_tilt=1.2, spine_ang=1.0, head_fwd=0.02,
        vtaper=0.80, pose_enc=_P["front"], lm_vis=0.96,
        neck_w=0.11, waist_conc=0.55, hip_drop=0.08, taper_unif=0.23, calf_w=0.09, cond_grad=0.13,
        noise=0.5,
    )),
    ("elite_male_back", 8, "back", _arch(
        shl_w=0.31, hip_w=0.21, sil_shl=0.44, sil_wst=0.19, sil_hip=0.26,
        arm_w=0.170, thigh_w=0.122, chest_w=0.36,
        bstd=0.21, edge_u=0.24, edge_l=0.17, contour=0.15,
        shl_tilt=1.0, spine_ang=1.2, head_fwd=0.01,
        vtaper=0.78, pose_enc=_P["back"], lm_vis=0.93,
        neck_w=0.11, waist_conc=0.52, hip_drop=0.09, taper_unif=0.22, calf_w=0.09, cond_grad=0.12,
        noise=0.5,
    )),
    ("elite_male_side", 6, "side", _arch(
        shl_w=0.26, hip_w=0.21, sil_shl=0.34, sil_wst=0.17, sil_hip=0.24,
        arm_w=0.130, thigh_w=0.118, chest_w=0.33,
        bstd=0.20, edge_u=0.22, edge_l=0.16, contour=0.14,
        shl_tilt=1.0, spine_ang=1.2, head_fwd=0.02,
        vtaper=0.75, pose_enc=_P["side"], lm_vis=0.92,
        neck_w=0.10, waist_conc=0.50, hip_drop=0.07, taper_unif=0.20, calf_w=0.085, cond_grad=0.11,
        noise=0.5,
    )),

    # ── Advanced lifter ────────────────────────────────────────────────────────
    ("advanced_male_front", 24, "front", _arch(
        shl_w=0.27, hip_w=0.22, sil_shl=0.37, sil_wst=0.20, sil_hip=0.25,
        arm_w=0.140, thigh_w=0.108, chest_w=0.32,
        bstd=0.16, edge_u=0.18, edge_l=0.13, contour=0.11,
        shl_tilt=2.0, spine_ang=2.5, head_fwd=0.04,
        vtaper=0.62, pose_enc=_P["front"], lm_vis=0.93,
        neck_w=0.10, waist_conc=0.40, hip_drop=0.07, taper_unif=0.17, calf_w=0.08, cond_grad=0.09,
        noise=0.8,
    )),
    ("advanced_male_back", 14, "back", _arch(
        shl_w=0.27, hip_w=0.23, sil_shl=0.38, sil_wst=0.21, sil_hip=0.26,
        arm_w=0.135, thigh_w=0.106, chest_w=0.31,
        bstd=0.15, edge_u=0.17, edge_l=0.12, contour=0.10,
        shl_tilt=1.8, spine_ang=2.2, head_fwd=0.03,
        vtaper=0.60, pose_enc=_P["back"], lm_vis=0.91,
        neck_w=0.10, waist_conc=0.38, hip_drop=0.07, taper_unif=0.16, calf_w=0.08, cond_grad=0.09,
        noise=0.8,
    )),
    ("advanced_male_side", 10, "side", _arch(
        shl_w=0.24, hip_w=0.22, sil_shl=0.30, sil_wst=0.19, sil_hip=0.23,
        arm_w=0.110, thigh_w=0.105, chest_w=0.28,
        bstd=0.15, edge_u=0.17, edge_l=0.12, contour=0.10,
        shl_tilt=1.5, spine_ang=2.0, head_fwd=0.04,
        vtaper=0.55, pose_enc=_P["side"], lm_vis=0.90,
        neck_w=0.09, waist_conc=0.35, hip_drop=0.06, taper_unif=0.15, calf_w=0.075, cond_grad=0.08,
        noise=0.9,
    )),

    # ── Intermediate / recreational gym-goer ──────────────────────────────────
    ("intermediate_male_front", 32, "front", _arch(
        shl_w=0.23, hip_w=0.22, sil_shl=0.30, sil_wst=0.23, sil_hip=0.24,
        arm_w=0.110, thigh_w=0.090, chest_w=0.27,
        bstd=0.10, edge_u=0.11, edge_l=0.08, contour=0.07,
        shl_tilt=3.5, spine_ang=4.0, head_fwd=0.06,
        vtaper=0.42, pose_enc=_P["front"], lm_vis=0.89,
        neck_w=0.09, waist_conc=0.20, hip_drop=0.06, taper_unif=0.09, calf_w=0.07, cond_grad=0.04,
        noise=1.0,
    )),
    ("intermediate_male_back", 16, "back", _arch(
        shl_w=0.23, hip_w=0.22, sil_shl=0.31, sil_wst=0.23, sil_hip=0.25,
        arm_w=0.105, thigh_w=0.088, chest_w=0.26,
        bstd=0.09, edge_u=0.10, edge_l=0.08, contour=0.07,
        shl_tilt=3.0, spine_ang=3.5, head_fwd=0.05,
        vtaper=0.38, pose_enc=_P["back"], lm_vis=0.87,
        neck_w=0.09, waist_conc=0.18, hip_drop=0.06, taper_unif=0.08, calf_w=0.065, cond_grad=0.03,
        noise=1.0,
    )),

    # ── Powerlifter (strong, higher body fat) ──────────────────────────────────
    ("powerlifter_front", 14, "front", _arch(
        shl_w=0.29, hip_w=0.26, sil_shl=0.38, sil_wst=0.30, sil_hip=0.32,
        arm_w=0.150, thigh_w=0.128, chest_w=0.36,
        bstd=0.06, edge_u=0.07, edge_l=0.06, contour=0.05,
        shl_tilt=2.5, spine_ang=3.0, head_fwd=0.07,
        vtaper=0.22, pose_enc=_P["front"], lm_vis=0.87,
        neck_w=0.13, waist_conc=0.08, hip_drop=0.12, taper_unif=0.05, calf_w=0.09, cond_grad=0.01,
        noise=0.9,
    )),

    # ── Beginner / untrained (lean) ────────────────────────────────────────────
    ("beginner_lean_front", 20, "front", _arch(
        shl_w=0.20, hip_w=0.20, sil_shl=0.25, sil_wst=0.20, sil_hip=0.22,
        arm_w=0.085, thigh_w=0.070, chest_w=0.22,
        bstd=0.06, edge_u=0.06, edge_l=0.05, contour=0.04,
        shl_tilt=5.0, spine_ang=5.5, head_fwd=0.08,
        vtaper=0.25, pose_enc=_P["front"], lm_vis=0.85,
        neck_w=0.08, waist_conc=0.12, hip_drop=0.04, taper_unif=0.06, calf_w=0.050, cond_grad=0.01,
        noise=1.2,
    )),
    ("beginner_lean_back", 8, "back", _arch(
        shl_w=0.20, hip_w=0.20, sil_shl=0.25, sil_wst=0.21, sil_hip=0.22,
        arm_w=0.082, thigh_w=0.068, chest_w=0.22,
        bstd=0.05, edge_u=0.05, edge_l=0.04, contour=0.03,
        shl_tilt=5.0, spine_ang=5.5, head_fwd=0.08,
        vtaper=0.22, pose_enc=_P["back"], lm_vis=0.83,
        neck_w=0.08, waist_conc=0.10, hip_drop=0.04, taper_unif=0.05, calf_w=0.048, cond_grad=0.01,
        noise=1.2,
    )),

    # ── Overweight / high BF ───────────────────────────────────────────────────
    ("overweight_male_front", 20, "front", _arch(
        shl_w=0.24, hip_w=0.28, sil_shl=0.32, sil_wst=0.30, sil_hip=0.32,
        arm_w=0.105, thigh_w=0.110, chest_w=0.29,
        bstd=0.04, edge_u=0.04, edge_l=0.04, contour=0.03,
        shl_tilt=4.5, spine_ang=6.0, head_fwd=0.10,
        vtaper=0.10, pose_enc=_P["front"], lm_vis=0.82,
        neck_w=0.13, waist_conc=0.03, hip_drop=0.14, taper_unif=0.03, calf_w=0.085, cond_grad=-0.01,
        noise=1.2,
    )),
    ("overweight_male_back", 10, "back", _arch(
        shl_w=0.24, hip_w=0.29, sil_shl=0.33, sil_wst=0.30, sil_hip=0.33,
        arm_w=0.100, thigh_w=0.108, chest_w=0.28,
        bstd=0.04, edge_u=0.04, edge_l=0.03, contour=0.03,
        shl_tilt=4.0, spine_ang=5.5, head_fwd=0.09,
        vtaper=0.08, pose_enc=_P["back"], lm_vis=0.80,
        neck_w=0.13, waist_conc=0.02, hip_drop=0.15, taper_unif=0.03, calf_w=0.082, cond_grad=-0.01,
        noise=1.2,
    )),

    # ── Female archetypes ──────────────────────────────────────────────────────
    ("elite_female_front", 12, "front", _arch(
        shl_w=0.24, hip_w=0.26, sil_shl=0.32, sil_wst=0.16, sil_hip=0.28,
        arm_w=0.115, thigh_w=0.112, chest_w=0.28,
        bstd=0.18, edge_u=0.20, edge_l=0.15, contour=0.14,
        shl_tilt=1.5, spine_ang=2.0, head_fwd=0.03,
        vtaper=0.55, pose_enc=_P["front"], lm_vis=0.94,
        neck_w=0.09, waist_conc=0.52, hip_drop=0.24, taper_unif=0.22, calf_w=0.072, cond_grad=0.12,
        noise=0.6,
    )),
    ("advanced_female_front", 16, "front", _arch(
        shl_w=0.22, hip_w=0.26, sil_shl=0.29, sil_wst=0.19, sil_hip=0.30,
        arm_w=0.105, thigh_w=0.100, chest_w=0.26,
        bstd=0.12, edge_u=0.14, edge_l=0.11, contour=0.09,
        shl_tilt=2.0, spine_ang=2.8, head_fwd=0.04,
        vtaper=0.40, pose_enc=_P["front"], lm_vis=0.92,
        neck_w=0.08, waist_conc=0.38, hip_drop=0.21, taper_unif=0.16, calf_w=0.062, cond_grad=0.07,
        noise=0.9,
    )),
    ("intermediate_female_front", 22, "front", _arch(
        shl_w=0.20, hip_w=0.25, sil_shl=0.26, sil_wst=0.21, sil_hip=0.28,
        arm_w=0.088, thigh_w=0.090, chest_w=0.23,
        bstd=0.08, edge_u=0.09, edge_l=0.07, contour=0.06,
        shl_tilt=3.5, spine_ang=4.0, head_fwd=0.06,
        vtaper=0.30, pose_enc=_P["front"], lm_vis=0.88,
        neck_w=0.08, waist_conc=0.22, hip_drop=0.18, taper_unif=0.10, calf_w=0.056, cond_grad=0.03,
        noise=1.0,
    )),
    ("beginner_female_front", 16, "front", _arch(
        shl_w=0.19, hip_w=0.24, sil_shl=0.24, sil_wst=0.22, sil_hip=0.26,
        arm_w=0.080, thigh_w=0.082, chest_w=0.21,
        bstd=0.05, edge_u=0.05, edge_l=0.04, contour=0.04,
        shl_tilt=4.5, spine_ang=5.0, head_fwd=0.08,
        vtaper=0.18, pose_enc=_P["front"], lm_vis=0.84,
        neck_w=0.07, waist_conc=0.12, hip_drop=0.14, taper_unif=0.07, calf_w=0.048, cond_grad=0.01,
        noise=1.3,
    )),
    ("overweight_female_front", 14, "front", _arch(
        shl_w=0.21, hip_w=0.30, sil_shl=0.27, sil_wst=0.28, sil_hip=0.34,
        arm_w=0.090, thigh_w=0.115, chest_w=0.25,
        bstd=0.04, edge_u=0.04, edge_l=0.03, contour=0.03,
        shl_tilt=4.5, spine_ang=5.5, head_fwd=0.09,
        vtaper=0.05, pose_enc=_P["front"], lm_vis=0.82,
        neck_w=0.10, waist_conc=0.02, hip_drop=0.22, taper_unif=0.03, calf_w=0.075, cond_grad=-0.01,
        noise=1.2,
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
    """Convert 56-feature vector to 24 physique labels via domain-knowledge mapping."""
    # ── Original features (indices 0-48) ──────────────────────────────────────
    shl_w_norm = float(fv[0])
    hip_w_norm = float(fv[1])
    sil_shl    = float(fv[27])
    sil_wst    = float(fv[28])
    sil_hip    = float(fv[29])
    vtaper     = float(fv[32])
    contour    = float(fv[36])
    arm_w_l    = float(fv[37])
    arm_w_r    = float(fv[38])
    arm_sym    = float(fv[39])
    thigh_l    = float(fv[40])
    thigh_r    = float(fv[41])
    thigh_sym  = float(fv[42])
    chest_w    = float(fv[43])
    bstd       = float(fv[46])
    edge_u     = float(fv[47])
    edge_l     = float(fv[48])
    shl_tilt   = float(fv[12])
    spine_ang  = float(fv[14])
    head_fwd   = float(fv[15])
    arm_len_sym = float(fv[8])
    leg_len_sym = float(fv[11])

    # ── New v2 features (indices 49-54) ───────────────────────────────────────
    neck_w      = float(fv[49])   # neck_width_norm
    waist_conc  = float(fv[50])   # waist_concavity (0-1, higher = more cinched)
    hip_drop    = float(fv[51])   # hip_drop_norm
    taper_unif  = float(fv[52])   # taper_uniformity (higher = more defined waist)
    calf_w      = float(fv[53])   # calf_width_mean
    cond_grad   = float(fv[54])   # conditioning_gradient

    sil_wst = max(sil_wst, 0.05)
    sil_hip = max(sil_hip, 0.05)
    chest_w = max(chest_w, 0.05)

    # ── Ratio targets ──────────────────────────────────────────────────────────
    s2w = _clamp(sil_shl / sil_wst, 1.0, 2.2)
    s2h = _clamp(sil_shl / sil_hip, 0.8, 2.0)
    w2h = _clamp(sil_wst / sil_hip, 0.6, 1.2)

    # ── Conditioning proxy — now uses v2 features for better accuracy ──────────
    # Combine bstd, edge_u, contour (original) with waist_conc and cond_grad (v2)
    conditioning = (
        bstd * 0.25
        + edge_u * 0.20
        + contour * 0.15
        + waist_conc * 0.25        # waist_concavity is a strong conditioning signal
        + max(0.0, cond_grad) * 0.15
    ) / 0.12
    conditioning = _clamp(conditioning, 0.0, 1.0)

    # ── Ordinal scores ──────────────────────────────────────────────────────────

    # shoulder_width: mapped from silhouette shoulder width (0.18→0, 0.44→~4.9)
    shl_score_raw = (sil_shl - 0.18) / 0.052
    shl_score = _ord(shl_score_raw, 0, 5, 0.35)

    # shoulder_roundness: cap development + mass
    shl_round = _ord(shl_score_raw * 0.7 + conditioning * 5 * 0.3, 0, 5, 0.4)

    # neck: wider neck = better trap/upper body development
    neck_score_raw = (neck_w - 0.07) / 0.015
    trap_raw = (shl_score_raw * 0.5 + neck_score_raw * 0.25 + edge_u / 0.05 * 0.25)
    trap_score = _ord(_clamp(trap_raw, 0, 5), 0, 5, 0.5)

    # arm_thickness: new range 0.080→0, 0.190→5 (arm protrusion method)
    arm_w_mean = (arm_w_l + arm_w_r) / 2
    arm_score_raw = (arm_w_mean - 0.080) / 0.022
    arm_score = _ord(arm_score_raw, 0, 5, 0.4)

    forearm_score = _ord(arm_score - 0.8, 0, 5, 0.5)

    # chest_development: chest width + conditioning
    chest_raw = (chest_w - 0.18) / 0.038 * 0.6 + conditioning * 5 * 0.4
    chest_score = _ord(_clamp(chest_raw, 0, 5), 0, 5, 0.4)

    # abs_definition: conditioning + waist_concavity + thin waist
    abs_raw = (
        conditioning * 0.45
        + waist_conc * 0.35          # waist_concavity is the best abs proxy
        + (0.28 - sil_wst) / 0.10 * 0.20
    )
    abs_score = _ord(_clamp(abs_raw * 5, 0, 5), 0, 5, 0.5)

    # waist_softness: inverse of abs/waist concavity
    waist_soft_raw = 5.0 - abs_raw * 5
    waist_soft = _ord(_clamp(waist_soft_raw, 0, 5), 0, 5, 0.5)

    # oblique: below abs
    oblique_score = _ord(abs_score - 0.7, 0, 5, 0.5)

    # muscular_separation: conditioning + taper uniformity
    sep_raw = conditioning * 0.65 + taper_unif * 0.25 + edge_u / 0.25 * 0.10
    separation = _ord(_clamp(sep_raw * 5, 0, 5), 0, 5, 0.4)

    # vascularity: only at high conditioning
    vasc_raw = _clamp((conditioning - 0.6) * 5, 0, 5)
    vascularity = _ord(vasc_raw, 0, 5, 0.4)

    # v_taper_visibility: use both raw vtaper and taper_uniformity (v2)
    vtaper_raw_score = vtaper * 5.5
    vtaper_v2_score = taper_unif * 6.0 + waist_conc * 4.0
    vtaper_score = _ord((vtaper_raw_score * 0.5 + vtaper_v2_score * 0.5), 0, 5, 0.35)

    # quad_development: thigh width + conditioning
    thigh_mean = (thigh_l + thigh_r) / 2
    quad_raw = (thigh_mean - 0.05) / 0.016 * 0.7 + conditioning * 5 * 0.3
    quad_score = _ord(_clamp(quad_raw, 0, 5), 0, 5, 0.5)

    # calf_development: now uses actual calf_width_mean (v2 feature)
    calf_raw = (calf_w - 0.03) / 0.016 * 0.7 + conditioning * 5 * 0.3
    calf_score = _ord(_clamp(calf_raw, 0, 5), 0, 5, 0.5)

    # glute: thigh-correlated
    glute_raw = (thigh_mean - 0.04) / 0.016 + hip_drop * 4
    glute_score = _ord(_clamp(glute_raw, 0, 5), 0, 5, 0.5)

    # posture
    posture_shl = _ord(_clamp(5 - shl_tilt / 2.5, 0, 5), 0, 5, 0.4)
    spine_score = _ord(_clamp(5 - spine_ang / 3, 0, 5), 0, 5, 0.4)
    head_score  = _ord(_clamp(5 - head_fwd * 25, 0, 5), 0, 5, 0.4)

    # symmetry
    overall_sym = (arm_len_sym + leg_len_sym + arm_sym + thigh_sym) / 4
    sym_score = _ord(_clamp(5 - overall_sym * 35, 0, 5), 0, 5, 0.4)

    # back_width and lat_flare (back/mixed only)
    back_width = shl_score if pose_type in ("back", "mixed") else None
    lat_flare = (
        _ord(shl_score_raw * 5 * 0.9, 0, 5, 0.4)
        if pose_type in ("back", "mixed") else None
    )

    # Pose-dependent nullability
    glute_val = None if pose_type == "front" else glute_score
    quad_val  = None if pose_type == "back"  else quad_score

    return {
        "shoulder_to_waist_ratio":    round(_clamp(s2w + np.random.normal(0, 0.03), 1.0, 2.2), 3),
        "shoulder_to_hip_ratio":      round(_clamp(s2h + np.random.normal(0, 0.03), 0.8, 2.0), 3),
        "waist_to_hip_ratio":         round(_clamp(w2h + np.random.normal(0, 0.02), 0.6, 1.2), 3),
        "chest_development":          chest_score,
        "shoulder_roundness":         shl_round,
        "shoulder_width":             shl_score,
        "arm_thickness":              arm_score,
        "forearm_development":        forearm_score,
        "trap_development":           trap_score,
        "back_width":                 back_width,
        "abs_definition":             abs_score,
        "oblique_development":        oblique_score,
        "quad_development":           quad_val,
        "calf_development":           calf_score,
        "glute_development":          glute_val,
        "muscular_separation":        separation,
        "vascularity":                vascularity,
        "waist_softness":             waist_soft,
        "posture_shoulder_alignment": posture_shl,
        "posture_head_position":      head_score,
        "spinal_curvature":           spine_score,
        "left_right_symmetry":        sym_score,
        "v_taper_visibility":         vtaper_score,
        "lat_flare":                  lat_flare,
    }


def _clamp_features(fv: np.ndarray) -> np.ndarray:
    """Hard-clamp 56-feature vector to physically valid ranges."""
    fv = fv.copy()
    # Widths: 0..1
    for i in [0, 1, 6, 7, 9, 10, 27, 28, 29, 33, 34, 37, 38, 40, 41, 43]:
        fv[i] = _clamp(fv[i], 0.01, 0.99)
    # Symmetry metrics: 0..0.5
    for i in [8, 11, 39, 42]:
        fv[i] = _clamp(fv[i], 0.0, 0.5)
    # Tilt angles: 0..30 deg
    for i in [12, 13, 14]:
        fv[i] = _clamp(fv[i], 0.0, 30.0)
    # Elbow/knee angles: 90..180 deg
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
    # head/shoulder offsets
    fv[15] = _clamp(fv[15], -0.1, 0.3)
    fv[16] = _clamp(fv[16], 0.0, 0.1)
    # New v2 features (indices 49-54)
    fv[49] = _clamp(fv[49], 0.04, 0.22)   # neck_width_norm
    fv[50] = _clamp(fv[50], 0.0, 0.90)    # waist_concavity
    fv[51] = _clamp(fv[51], 0.0, 0.45)    # hip_drop_norm
    fv[52] = _clamp(fv[52], 0.0, 0.55)    # taper_uniformity
    fv[53] = _clamp(fv[53], 0.02, 0.16)   # calf_width_mean
    fv[54] = _clamp(fv[54], -0.08, 0.30)  # conditioning_gradient
    # pose_type_encoded (index 55, deterministic)
    fv[55] = round(_clamp(fv[55], 0.0, 3.0))
    return fv


def generate(n_samples: int, seed: int = 42) -> list[dict]:
    rng = np.random.default_rng(seed)

    total_base = sum(n for _, n, _, _ in ARCHETYPES)
    scale = n_samples / total_base

    rows = []
    for name, base_n, pose_type, arch in ARCHETYPES:
        n = max(1, round(base_n * scale))
        means = arch["means"].copy()
        stds  = arch["stds"].copy()
        pose_enc_val = means[55]    # pose_type_encoded is at index 55

        for _ in range(n):
            fv = rng.normal(means, stds).astype(np.float32)
            fv[55] = pose_enc_val   # keep pose deterministic
            fv = _clamp_features(fv)

            labels = features_to_labels(fv, pose_type)

            sex = "female" if "female" in name else "male"
            if sex == "male":
                height = float(rng.normal(178, 7))
                if "pro" in name or "elite" in name:
                    weight_mu, bf_mu, years_mu = 88, 7, 10
                elif "advanced" in name:
                    weight_mu, bf_mu, years_mu = 83, 12, 5
                elif "power" in name:
                    weight_mu, bf_mu, years_mu = 108, 20, 6
                elif "overweight" in name:
                    weight_mu, bf_mu, years_mu = 100, 30, 0.5
                elif "intermediate" in name:
                    weight_mu, bf_mu, years_mu = 78, 18, 2
                else:
                    weight_mu, bf_mu, years_mu = 72, 15, 0.5
                weight = float(rng.normal(weight_mu, 10))
                bf     = float(rng.normal(bf_mu, 4))
                years  = float(rng.normal(years_mu, 2))
            else:
                height = float(rng.normal(165, 6))
                if "elite" in name:
                    weight_mu, bf_mu, years_mu = 58, 12, 6
                elif "advanced" in name:
                    weight_mu, bf_mu, years_mu = 60, 18, 4
                elif "overweight" in name:
                    weight_mu, bf_mu, years_mu = 78, 34, 0.5
                elif "intermediate" in name:
                    weight_mu, bf_mu, years_mu = 63, 25, 2
                else:
                    weight_mu, bf_mu, years_mu = 56, 22, 0.5
                weight = float(rng.normal(weight_mu, 8))
                bf     = float(rng.normal(bf_mu, 5))
                years  = float(rng.normal(years_mu, 2))

            row = {
                "image_id":       str(uuid.uuid4()),
                "image_paths":    [],
                "feature_vector": [round(float(x), 6) for x in fv],
                "pose_type":      pose_type,
                "source":         "pose_dataset_bootstrap",
                "labels":         labels,
                "metadata": {
                    "height_cm":        round(_clamp(height, 140, 220), 1),
                    "weight_kg":        round(_clamp(weight, 40, 180), 1),
                    "bf_percent":       round(_clamp(bf, 3, 50), 1),
                    "sex":              sex,
                    "training_years":   round(_clamp(years, 0, 30), 1),
                    "competition_level": (
                        "professional" if "pro" in name
                        else "elite"   if "elite" in name
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
    parser = argparse.ArgumentParser(description="Generate synthetic 56-feature training data")
    parser.add_argument("--n-samples", type=int, default=2000)
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

    print(f"[generate_synthetic] Wrote {len(rows)} samples (56 features each) to {output}")
    sources, poses, sexes = {}, {}, {"male": 0, "female": 0}
    for r in rows:
        sources[r["source"]] = sources.get(r["source"], 0) + 1
        poses[r["pose_type"]] = poses.get(r["pose_type"], 0) + 1
        sexes[r["metadata"]["sex"]] += 1
    print(f"  Sources:    {sources}")
    print(f"  Pose types: {poses}")
    print(f"  Sexes:      {sexes}")
    fv_len = len(rows[0]["feature_vector"]) if rows else 0
    print(f"  Feature vector length: {fv_len}")


if __name__ == "__main__":
    main()
