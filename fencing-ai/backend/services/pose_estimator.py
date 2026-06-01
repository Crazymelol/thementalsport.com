import asyncio
import base64
from pathlib import Path
from typing import Optional
import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose


KEYPOINT_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb",
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index",
]


class PoseEstimator:
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
        )

    def estimate(self, image_path: str) -> Optional[dict]:
        image = cv2.imread(image_path)
        if image is None:
            return None

        h, w = image.shape[:2]
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        if not results.pose_landmarks:
            return None

        keypoints = {}
        for i, lm in enumerate(results.pose_landmarks.landmark):
            keypoints[KEYPOINT_NAMES[i]] = {
                "x": round(lm.x * w, 1),
                "y": round(lm.y * h, 1),
                "z": round(lm.z, 3),
                "visibility": round(lm.visibility, 3),
            }

        metrics = self._compute_fencing_metrics(keypoints, w, h)
        return {"keypoints": keypoints, "metrics": metrics}

    def _compute_fencing_metrics(self, kp: dict, w: int, h: int) -> dict:
        def pt(name):
            k = kp.get(name)
            return np.array([k["x"], k["y"]]) if k else None

        metrics = {}

        # Knee bend angle (lunge depth)
        hip, knee, ankle = pt("right_hip"), pt("right_knee"), pt("right_ankle")
        if hip is not None and knee is not None and ankle is not None:
            metrics["right_knee_angle"] = _angle(hip, knee, ankle)

        hip, knee, ankle = pt("left_hip"), pt("left_knee"), pt("left_ankle")
        if hip is not None and knee is not None and ankle is not None:
            metrics["left_knee_angle"] = _angle(hip, knee, ankle)

        # Sword arm extension (shoulder → elbow → wrist)
        sh, el, wr = pt("right_shoulder"), pt("right_elbow"), pt("right_wrist")
        if sh is not None and el is not None and wr is not None:
            metrics["sword_arm_angle"] = _angle(sh, el, wr)

        # Torso lean (shoulder midpoint vs hip midpoint)
        ls, rs = pt("left_shoulder"), pt("right_shoulder")
        lh, rh = pt("left_hip"), pt("right_hip")
        if ls is not None and rs is not None and lh is not None and rh is not None:
            shoulder_mid = (ls + rs) / 2
            hip_mid = (lh + rh) / 2
            delta = shoulder_mid - hip_mid
            metrics["torso_lean_deg"] = round(
                float(np.degrees(np.arctan2(-delta[1], delta[0]))), 1
            )

        # Footwork stance width (normalized to image width)
        la, ra = pt("left_ankle"), pt("right_ankle")
        if la is not None and ra is not None:
            metrics["stance_width_pct"] = round(abs(float(la[0] - ra[0])) / w * 100, 1)

        return metrics


def _angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    ba = a - b
    bc = c - b
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return round(float(np.degrees(np.arccos(np.clip(cos, -1, 1)))), 1)
