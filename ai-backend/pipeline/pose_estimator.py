"""
MediaPipe Pose landmark extraction + derived geometric features.

Landmark indices: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
"""
from __future__ import annotations
import math
import numpy as np
import mediapipe as mp
from dataclasses import dataclass, field
from typing import Optional

mp_pose = mp.solutions.pose

# Landmark index constants
NOSE = 0
LEFT_EAR, RIGHT_EAR = 7, 8
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26
LEFT_ANKLE, RIGHT_ANKLE = 27, 28

UPPER_BODY_LM = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW,
                 LEFT_WRIST, RIGHT_WRIST]
LOWER_BODY_LM = [LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE]


@dataclass
class PoseFeatures:
    # Raw normalized coords (0-1 within image)
    landmarks: list = field(default_factory=list)
    visibility: list = field(default_factory=list)

    # Derived geometric features
    shoulder_width_norm: float = 0.0
    hip_width_norm: float = 0.0
    shoulder_to_hip_ratio: float = 0.0
    torso_height_norm: float = 0.0
    leg_height_norm: float = 0.0
    upper_lower_ratio: float = 0.0
    left_arm_length_norm: float = 0.0
    right_arm_length_norm: float = 0.0
    arm_length_symmetry: float = 0.0
    left_leg_length_norm: float = 0.0
    right_leg_length_norm: float = 0.0
    leg_length_symmetry: float = 0.0
    shoulder_tilt_deg: float = 0.0
    hip_tilt_deg: float = 0.0
    spine_angle_deg: float = 0.0
    head_forward_offset: float = 0.0
    shoulder_height_diff_norm: float = 0.0
    left_elbow_angle: float = 0.0
    right_elbow_angle: float = 0.0
    elbow_angle_symmetry: float = 0.0
    left_knee_angle: float = 0.0
    right_knee_angle: float = 0.0
    knee_angle_symmetry: float = 0.0
    landmark_visibility_mean: float = 0.0
    upper_body_visibility: float = 0.0
    lower_body_visibility: float = 0.0
    pose_type: str = "front"
    detected: bool = False


def _dist(a: list, b: list) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def _angle_deg(a: list, vertex: list, b: list) -> float:
    """Angle at vertex formed by rays vertex→a and vertex→b, in degrees."""
    v1 = [a[0] - vertex[0], a[1] - vertex[1]]
    v2 = [b[0] - vertex[0], b[1] - vertex[1]]
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0] ** 2 + v1[1] ** 2) + 1e-9
    mag2 = math.sqrt(v2[0] ** 2 + v2[1] ** 2) + 1e-9
    cos_a = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_a))


def _line_angle_from_horizontal(a: list, b: list) -> float:
    """Signed angle of segment a→b from horizontal, in degrees."""
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    return math.degrees(math.atan2(dy, dx))


def _classify_pose_type(lm: list, vis: list) -> str:
    """
    Classify front/back/side from visibility patterns of key landmarks.

    Front indicators: nose visible, left AND right shoulder visible at similar depth.
    Back indicators: nose NOT visible, left/right shoulders visible.
    Side indicators: one shoulder significantly deeper / less visible than the other.
    """
    nose_vis = vis[NOSE]
    ls_vis = vis[LEFT_SHOULDER]
    rs_vis = vis[RIGHT_SHOULDER]

    if nose_vis < 0.5:
        return "back"

    # If one shoulder is significantly less visible → side pose
    shoulder_vis_diff = abs(ls_vis - rs_vis)
    if shoulder_vis_diff > 0.35 and min(ls_vis, rs_vis) < 0.5:
        return "side"

    return "front"


_pose_detector = None


def get_pose_detector() -> mp.solutions.pose.Pose:
    global _pose_detector
    if _pose_detector is None:
        _pose_detector = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,        # Most accurate
            enable_segmentation=False,
            min_detection_confidence=0.5,
        )
    return _pose_detector


def extract_pose_features(img_bgr: np.ndarray) -> PoseFeatures:
    """Run MediaPipe on one BGR image, return geometric features."""
    feats = PoseFeatures()
    detector = get_pose_detector()

    img_rgb = img_bgr[:, :, ::-1]
    result = detector.process(img_rgb)

    if not result.pose_landmarks:
        return feats

    feats.detected = True
    h, w = img_bgr.shape[:2]

    lm_raw = result.pose_landmarks.landmark
    lm = [[l.x, l.y] for l in lm_raw]
    vis = [l.visibility for l in lm_raw]

    feats.landmarks = lm
    feats.visibility = vis

    # ── Visibility stats ──────────────────────────────────────────────────────
    feats.landmark_visibility_mean = float(np.mean(vis))
    feats.upper_body_visibility = float(np.mean([vis[i] for i in UPPER_BODY_LM]))
    feats.lower_body_visibility = float(np.mean([vis[i] for i in LOWER_BODY_LM]))

    # ── Pose classification ────────────────────────────────────────────────────
    feats.pose_type = _classify_pose_type(lm, vis)

    # ── Body height reference (shoulder midpoint → ankle midpoint) ─────────────
    mid_shoulder = [(lm[LEFT_SHOULDER][0] + lm[RIGHT_SHOULDER][0]) / 2,
                    (lm[LEFT_SHOULDER][1] + lm[RIGHT_SHOULDER][1]) / 2]
    mid_hip = [(lm[LEFT_HIP][0] + lm[RIGHT_HIP][0]) / 2,
               (lm[LEFT_HIP][1] + lm[RIGHT_HIP][1]) / 2]
    mid_ankle = [(lm[LEFT_ANKLE][0] + lm[RIGHT_ANKLE][0]) / 2,
                 (lm[LEFT_ANKLE][1] + lm[RIGHT_ANKLE][1]) / 2]

    body_height = _dist(mid_shoulder, mid_ankle) + 1e-9

    # ── Widths ────────────────────────────────────────────────────────────────
    feats.shoulder_width_norm = _dist(lm[LEFT_SHOULDER], lm[RIGHT_SHOULDER]) / body_height
    feats.hip_width_norm = _dist(lm[LEFT_HIP], lm[RIGHT_HIP]) / body_height
    feats.shoulder_to_hip_ratio = (feats.shoulder_width_norm /
                                   max(feats.hip_width_norm, 1e-9))

    # ── Lengths ───────────────────────────────────────────────────────────────
    feats.torso_height_norm = _dist(mid_shoulder, mid_hip) / body_height
    feats.leg_height_norm = _dist(mid_hip, mid_ankle) / body_height
    feats.upper_lower_ratio = feats.torso_height_norm / max(feats.leg_height_norm, 1e-9)

    l_arm = (_dist(lm[LEFT_SHOULDER], lm[LEFT_ELBOW]) +
             _dist(lm[LEFT_ELBOW], lm[LEFT_WRIST]))
    r_arm = (_dist(lm[RIGHT_SHOULDER], lm[RIGHT_ELBOW]) +
             _dist(lm[RIGHT_ELBOW], lm[RIGHT_WRIST]))
    feats.left_arm_length_norm = l_arm / body_height
    feats.right_arm_length_norm = r_arm / body_height
    avg_arm = (l_arm + r_arm) / 2 + 1e-9
    feats.arm_length_symmetry = abs(l_arm - r_arm) / avg_arm

    l_leg = (_dist(lm[LEFT_HIP], lm[LEFT_KNEE]) +
             _dist(lm[LEFT_KNEE], lm[LEFT_ANKLE]))
    r_leg = (_dist(lm[RIGHT_HIP], lm[RIGHT_KNEE]) +
             _dist(lm[RIGHT_KNEE], lm[RIGHT_ANKLE]))
    feats.left_leg_length_norm = l_leg / body_height
    feats.right_leg_length_norm = r_leg / body_height
    avg_leg = (l_leg + r_leg) / 2 + 1e-9
    feats.leg_length_symmetry = abs(l_leg - r_leg) / avg_leg

    # ── Posture angles ────────────────────────────────────────────────────────
    feats.shoulder_tilt_deg = abs(_line_angle_from_horizontal(
        lm[LEFT_SHOULDER], lm[RIGHT_SHOULDER]))
    feats.hip_tilt_deg = abs(_line_angle_from_horizontal(
        lm[LEFT_HIP], lm[RIGHT_HIP]))
    feats.spine_angle_deg = abs(_line_angle_from_horizontal(mid_shoulder, mid_hip) - 90)
    feats.shoulder_height_diff_norm = abs(
        lm[LEFT_SHOULDER][1] - lm[RIGHT_SHOULDER][1]) / body_height

    # Head forward = horizontal offset of nose vs mid_shoulder
    nose = lm[NOSE]
    feats.head_forward_offset = (nose[0] - mid_shoulder[0]) / feats.shoulder_width_norm \
                                 if feats.shoulder_width_norm > 0 else 0.0

    # ── Joint angles ──────────────────────────────────────────────────────────
    feats.left_elbow_angle = _angle_deg(
        lm[LEFT_SHOULDER], lm[LEFT_ELBOW], lm[LEFT_WRIST])
    feats.right_elbow_angle = _angle_deg(
        lm[RIGHT_SHOULDER], lm[RIGHT_ELBOW], lm[RIGHT_WRIST])
    feats.elbow_angle_symmetry = abs(feats.left_elbow_angle - feats.right_elbow_angle)

    feats.left_knee_angle = _angle_deg(
        lm[LEFT_HIP], lm[LEFT_KNEE], lm[LEFT_ANKLE])
    feats.right_knee_angle = _angle_deg(
        lm[RIGHT_HIP], lm[RIGHT_KNEE], lm[RIGHT_ANKLE])
    feats.knee_angle_symmetry = abs(feats.left_knee_angle - feats.right_knee_angle)

    return feats
