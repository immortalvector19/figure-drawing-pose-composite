#!/usr/bin/env python3
"""
Pose Shape Composite: Deterministic 2D Mannequin Assembly Pipeline
------------------------------------------------------------------
Takes a reference photo and a folder of pre-cut transparent PNG body part assets,
detects 33 body landmarks via MediaPipe Pose (100% local, no external APIs),
calculates segment lengths, angles, and midpoints, anchors and transforms each
shape asset, layers them in anatomical z-order, and renders a side-by-side
composite comparison image on a white background with a divider line.
"""

import os
import sys
import math
import argparse
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import mediapipe as mp


# ---------------------------------------------------------------------------
# Data Structures & Constants
# ---------------------------------------------------------------------------

@dataclass
class Joint:
    name: str
    index: int
    x: float  # Pixel coordinates
    y: float
    z: float
    visibility: float


@dataclass
class SegmentDef:
    name: str
    asset_keys: List[str]      # Filename patterns to look for
    joint_a: int              # MediaPipe landmark index for top/proximal joint
    joint_b: int              # MediaPipe landmark index for bottom/distal joint
    z_index: int              # Layering order (lower = drawn behind)
    anchor_ratio: float = 0.0 # 0.0 = top of asset, 0.5 = midpoint, 1.0 = bottom
    flip_horizontal: bool = False
    width_scale: float = 1.0  # Optional width adjustment relative to segment length


# MediaPipe 33 Landmark Indices
L_NOSE = 0
L_LEFT_EYE = 2
L_RIGHT_EYE = 5
L_LEFT_EAR = 7
L_RIGHT_EAR = 8
L_LEFT_SHOULDER = 11
L_RIGHT_SHOULDER = 12
L_LEFT_ELBOW = 13
L_RIGHT_ELBOW = 14
L_LEFT_WRIST = 15
L_RIGHT_WRIST = 16
L_LEFT_PINKY = 17
L_RIGHT_PINKY = 18
L_LEFT_INDEX = 19
L_RIGHT_INDEX = 20
L_LEFT_HIP = 23
L_RIGHT_HIP = 24
L_LEFT_KNEE = 25
L_RIGHT_KNEE = 26
L_LEFT_ANKLE = 27
L_RIGHT_ANKLE = 28
L_LEFT_HEEL = 29
L_RIGHT_HEEL = 30
L_LEFT_FOOT_INDEX = 31
L_RIGHT_FOOT_INDEX = 32

# Virtual joint indices for composite body centers
V_NECK = 101
V_CROWN = 102
V_TORSO_BOTTOM = 103
V_PELVIS_BOTTOM = 104
V_LEFT_HAND = 105
V_RIGHT_HAND = 106


# ---------------------------------------------------------------------------
# Anatomical Segments Definition
# ---------------------------------------------------------------------------

def get_anatomical_segments() -> List[SegmentDef]:
    """
    Defines the anatomical hierarchy, asset name patterns, joint anchors,
    and rendering z-order (back to front).
    """
    return [
        # 1. Back/Base structures
        SegmentDef("neck", ["neck"], V_NECK, V_CROWN, z_index=10, anchor_ratio=0.8),
        SegmentDef("pelvis", ["pelvis", "hip", "hips"], V_TORSO_BOTTOM, V_PELVIS_BOTTOM, z_index=20, anchor_ratio=0.1),
        SegmentDef("torso", ["torso", "chest", "ribcage"], V_NECK, V_TORSO_BOTTOM, z_index=30, anchor_ratio=0.1),

        # 2. Legs (Thighs -> Shins -> Feet)
        SegmentDef("thigh_left", ["thigh_left", "upper_leg_left", "thigh", "upper_leg"], L_LEFT_HIP, L_LEFT_KNEE, z_index=40, anchor_ratio=0.0),
        SegmentDef("thigh_right", ["thigh_right", "upper_leg_right", "thigh", "upper_leg"], L_RIGHT_HIP, L_RIGHT_KNEE, z_index=41, anchor_ratio=0.0, flip_horizontal=True),
        SegmentDef("shin_left", ["shin_left", "calf_left", "lower_leg_left", "shin", "calf"], L_LEFT_KNEE, L_LEFT_ANKLE, z_index=50, anchor_ratio=0.0),
        SegmentDef("shin_right", ["shin_right", "calf_right", "lower_leg_right", "shin", "calf"], L_RIGHT_KNEE, L_RIGHT_ANKLE, z_index=51, anchor_ratio=0.0, flip_horizontal=True),
        SegmentDef("foot_left", ["foot_left", "feet_left", "foot"], L_LEFT_ANKLE, L_LEFT_FOOT_INDEX, z_index=60, anchor_ratio=0.15),
        SegmentDef("foot_right", ["foot_right", "feet_right", "foot"], L_RIGHT_ANKLE, L_RIGHT_FOOT_INDEX, z_index=61, anchor_ratio=0.15, flip_horizontal=True),

        # 3. Head (in front of neck/torso top)
        SegmentDef("head", ["head", "cranium", "face"], V_NECK, V_CROWN, z_index=70, anchor_ratio=0.85),

        # 4. Arms (Upper Arms -> Forearms -> Hands)
        SegmentDef("upper_arm_left", ["upper_arm_left", "bicep_left", "upper_arm", "bicep"], L_LEFT_SHOULDER, L_LEFT_ELBOW, z_index=80, anchor_ratio=0.0),
        SegmentDef("upper_arm_right", ["upper_arm_right", "bicep_right", "upper_arm", "bicep"], L_RIGHT_SHOULDER, L_RIGHT_ELBOW, z_index=81, anchor_ratio=0.0, flip_horizontal=True),
        SegmentDef("forearm_left", ["forearm_left", "lower_arm_left", "forearm"], L_LEFT_ELBOW, L_LEFT_WRIST, z_index=90, anchor_ratio=0.0),
        SegmentDef("forearm_right", ["forearm_right", "lower_arm_right", "forearm"], L_RIGHT_ELBOW, L_RIGHT_WRIST, z_index=91, anchor_ratio=0.0, flip_horizontal=True),
        SegmentDef("hand_left", ["hand_left", "palm_left", "hand"], L_LEFT_WRIST, V_LEFT_HAND, z_index=100, anchor_ratio=0.05),
        SegmentDef("hand_right", ["hand_right", "palm_right", "hand"], L_RIGHT_WRIST, V_RIGHT_HAND, z_index=101, anchor_ratio=0.05, flip_horizontal=True),
    ]


# ---------------------------------------------------------------------------
# Pose Detection via MediaPipe
# ---------------------------------------------------------------------------

class LocalPoseDetector:
    """Runs MediaPipe Pose entirely on local hardware with zero external API calls."""

    def __init__(self, min_detection_confidence: float = 0.45):
        self.min_confidence = min_detection_confidence
        self.tasks_detector = None
        self.legacy_pose = None
        self.api_mode = "tasks"

        try:
            # Modern MediaPipe 1.0+ Tasks API
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision

            model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, "pose_landmarker_full.task")

            if not os.path.exists(model_path):
                import urllib.request
                import urllib.error
                print(f"[Model] Downloading local MediaPipe model to: {model_path} ...")
                url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
                try:
                    urllib.request.urlretrieve(url, model_path)
                    print("[Model] Download complete. Running 100% locally on local hardware.")
                except (urllib.error.URLError, TimeoutError, OSError) as dl_err:
                    print(
                        f"\n[Error] Unable to download MediaPipe pose model from Google Cloud Storage:\n"
                        f"        {url}\n"
                        f"        Reason: {dl_err}\n\n"
                        f"        An active internet connection is required on first launch to cache the model file.\n"
                        f"        Once downloaded to '{model_path}', all future runs operate 100% offline.\n"
                        f"        Alternatively, manually place 'pose_landmarker_full.task' into the '{model_dir}' directory.\n",
                        file=sys.stderr
                    )
                    sys.exit(1)

            base_options = python.BaseOptions(model_asset_path=model_path)
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                output_segmentation_masks=False,
                min_pose_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_detection_confidence,
            )
            self.tasks_detector = vision.PoseLandmarker.create_from_options(options)
            self.api_mode = "tasks"
        except Exception:
            # Legacy MediaPipe solutions API fallback (< 1.0)
            try:
                mp_pose = getattr(mp, "solutions", None)
                if mp_pose and hasattr(mp_pose, "pose"):
                    self.legacy_pose = mp_pose.pose.Pose(
                        static_image_mode=True,
                        model_complexity=2,
                        min_detection_confidence=min_detection_confidence,
                    )
                    self.api_mode = "legacy"
                else:
                    raise RuntimeError("MediaPipe tasks or solutions not available.")
            except Exception as e:
                raise RuntimeError(f"Failed to initialize MediaPipe Pose: {e}")

    def detect(self, bgr_image: np.ndarray) -> Tuple[Dict[int, Joint], List[str]]:
        """
        Processes an image and returns:
          1. Dict of Joint objects by index (including synthesized virtual joints)
          2. List of warning strings for low-confidence or occluded landmarks
        """
        h, w = bgr_image.shape[:2]
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        joints: Dict[int, Joint] = {}
        warnings: List[str] = []

        if self.api_mode == "tasks":
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            res = self.tasks_detector.detect(mp_img)
            if not res.pose_landmarks or len(res.pose_landmarks) == 0:
                warnings.append("No human pose detected in the reference photo.")
                return joints, warnings
            raw_landmarks = res.pose_landmarks[0]
        else:
            res = self.legacy_pose.process(rgb)
            if not res.pose_landmarks:
                warnings.append("No human pose detected in the reference photo.")
                return joints, warnings
            raw_landmarks = res.pose_landmarks.landmark

        for idx, lm in enumerate(raw_landmarks):
            vis = getattr(lm, "visibility", 1.0)
            joints[idx] = Joint(
                name=f"landmark_{idx}",
                index=idx,
                x=lm.x * w,
                y=lm.y * h,
                z=getattr(lm, "z", 0.0) * w,
                visibility=vis,
            )

        # Synthesize anatomical midpoints and anchors:
        sh_l = joints.get(L_LEFT_SHOULDER)
        sh_r = joints.get(L_RIGHT_SHOULDER)
        hip_l = joints.get(L_LEFT_HIP)
        hip_r = joints.get(L_RIGHT_HIP)
        nose = joints.get(L_NOSE)

        if sh_l and sh_r:
            # Suprasternal notch / neck base
            neck_x = (sh_l.x + sh_r.x) / 2.0
            neck_y = (sh_l.y + sh_r.y) / 2.0
            neck_vis = min(sh_l.visibility, sh_r.visibility)
            joints[V_NECK] = Joint("v_neck", V_NECK, neck_x, neck_y, (sh_l.z + sh_r.z) / 2.0, neck_vis)

            # Crown of head (projected up through nose/ears)
            head_h = np.linalg.norm(np.array([sh_l.x, sh_l.y]) - np.array([sh_r.x, sh_r.y])) * 0.8
            crown_y = max(0.0, neck_y - head_h * 1.3)
            crown_x = nose.x if (nose and nose.visibility > 0.4) else neck_x
            joints[V_CROWN] = Joint("v_crown", V_CROWN, crown_x, crown_y, 0.0, neck_vis)

        if hip_l and hip_r:
            # Mid-hip / pelvis center
            hip_mid_x = (hip_l.x + hip_r.x) / 2.0
            hip_mid_y = (hip_l.y + hip_r.y) / 2.0
            hip_vis = min(hip_l.visibility, hip_r.visibility)
            joints[V_TORSO_BOTTOM] = Joint("v_torso_bottom", V_TORSO_BOTTOM, hip_mid_x, hip_mid_y, (hip_l.z + hip_r.z) / 2.0, hip_vis)

            # Pelvic base / crotch
            pelvis_drop = np.linalg.norm(np.array([hip_l.x, hip_l.y]) - np.array([hip_r.x, hip_r.y])) * 0.45
            joints[V_PELVIS_BOTTOM] = Joint("v_pelvis_bottom", V_PELVIS_BOTTOM, hip_mid_x, hip_mid_y + pelvis_drop, (hip_l.z + hip_r.z) / 2.0, hip_vis)

        # Hands (wrist to finger midpoint)
        for side, wrist_idx, p_idx, i_idx, v_idx in [
            ("left", L_LEFT_WRIST, L_LEFT_PINKY, L_LEFT_INDEX, V_LEFT_HAND),
            ("right", L_RIGHT_WRIST, L_RIGHT_PINKY, L_RIGHT_INDEX, V_RIGHT_HAND),
        ]:
            wrist = joints.get(wrist_idx)
            pinky = joints.get(p_idx)
            index = joints.get(i_idx)
            if wrist and (pinky or index):
                hand_x = (pinky.x + index.x) / 2.0 if (pinky and index) else (pinky.x if pinky else index.x)
                hand_y = (pinky.y + index.y) / 2.0 if (pinky and index) else (pinky.y if pinky else index.y)
                vis = min(wrist.visibility, 0.8)
                joints[v_idx] = Joint(f"v_hand_{side}", v_idx, hand_x, hand_y, wrist.z, vis)

        return joints, warnings


# ---------------------------------------------------------------------------
# Shape Asset Manager & Gender Detection
# ---------------------------------------------------------------------------

class AssetManager:
    """Loads, categorizes, and provides pre-cut transparent PNG shape assets."""

    def __init__(self, asset_dir: str, gender: str = "auto", joints: Optional[Dict[int, Joint]] = None):
        self.base_dir = asset_dir
        self.resolved_dir, self.gender = self._resolve_gender_dir(asset_dir, gender, joints)
        self.assets: Dict[str, Image.Image] = {}
        self._load_assets()

    def _resolve_gender_dir(self, path: str, gender: str, joints: Optional[Dict[int, Joint]]) -> Tuple[str, str]:
        path_lower = path.lower().replace("\\", "/")

        if gender in ["male", "female"]:
            target_gender = gender
        elif "female" in path_lower or "woman" in path_lower:
            target_gender = "female"
        elif "male" in path_lower or "man" in path_lower:
            target_gender = "male"
        else:
            # Proportion-based auto-detection: shoulder vs. hip ratio
            if joints and L_LEFT_SHOULDER in joints and L_LEFT_HIP in joints:
                sh_w = abs(joints[L_LEFT_SHOULDER].x - joints[L_RIGHT_SHOULDER].x)
                hip_w = abs(joints[L_LEFT_HIP].x - joints[L_RIGHT_HIP].x)
                ratio = (sh_w / hip_w) if hip_w > 0 else 1.2
                target_gender = "male" if ratio > 1.28 else "female"
            else:
                target_gender = "male"

        # Check if subfolder exists for detected gender
        sub = os.path.join(path, target_gender)
        if os.path.isdir(sub):
            return sub, target_gender

        return path, target_gender

    def _load_assets(self):
        if not os.path.isdir(self.resolved_dir):
            return

        for fname in os.listdir(self.resolved_dir):
            if fname.lower().endswith(".png"):
                stem = os.path.splitext(fname)[0].lower()
                full_path = os.path.join(self.resolved_dir, fname)
                try:
                    img = Image.open(full_path).convert("RGBA")
                    self.assets[stem] = img
                except Exception as e:
                    print(f"[Warning] Failed to load asset '{full_path}': {e}", file=sys.stderr)

    def find_asset(self, candidate_keys: List[str]) -> Optional[Tuple[str, Image.Image]]:
        for key in candidate_keys:
            key_lower = key.lower()
            if key_lower in self.assets:
                return key_lower, self.assets[key_lower]
        return None


# ---------------------------------------------------------------------------
# Mathematical Geometry & Transform Engine
# ---------------------------------------------------------------------------

def calculate_segment_geometry(
    j_a: Joint,
    j_b: Joint
) -> Tuple[Tuple[float, float], float, float]:
    """
    Computes:
      1. Midpoint (x, y) between joint A and joint B
      2. Angle in degrees relative to vertical (downward +Y vector [0, 1])
      3. Length of segment in pixels
    """
    dx = j_b.x - j_a.x
    dy = j_b.y - j_a.y

    length = float(np.hypot(dx, dy))
    midpoint = ((j_a.x + j_b.x) / 2.0, (j_a.y + j_b.y) / 2.0)

    # Angle relative to vertical downward axis [0, 1]:
    # Positive angle = clockwise tilt, negative = counter-clockwise
    angle_rad = math.atan2(dx, dy)
    angle_deg = math.degrees(angle_rad)

    return midpoint, angle_deg, length


def transform_and_place_asset(
    asset_img: Image.Image,
    target_length: float,
    angle_deg: float,
    anchor_joint: Tuple[float, float],
    anchor_ratio: float = 0.0,
    flip_h: bool = False
) -> Tuple[Image.Image, Tuple[int, int]]:
    """
    Deterministic affine geometry:
    1. Scales asset so height matches target segment length.
    2. Rotates asset by angle_deg.
    3. Calculates exact top-left canvas coordinate so asset's anchor connects
       flush to the anchor joint with zero floating gap.
    """
    src = asset_img.copy()
    if flip_h:
        src = src.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    w_orig, h_orig = src.size
    if h_orig <= 0 or target_length <= 0:
        return src, (0, 0)

    scale = target_length / float(h_orig)
    new_w = max(2, int(round(w_orig * scale)))
    new_h = max(2, int(round(target_length)))

    # 1. Resize asset using high-quality Lanczos resampling
    resized = src.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)

    # 2. Define anchor point in resized asset coordinate space
    # (anchor_ratio: 0.0 = top center, 0.5 = center, 1.0 = bottom center)
    anchor_local_x = new_w / 2.0
    anchor_local_y = new_h * anchor_ratio

    # 3. Rotate asset around its center (expand=True accommodates full bounds)
    # PIL rotates counterclockwise for positive angle, so use -angle_deg
    rotated = resized.rotate(-angle_deg, expand=True, resample=Image.Resampling.BICUBIC)
    w_rot, h_rot = rotated.size

    # 4. Compute anchor position inside the expanded rotated bounding box
    center_x = new_w / 2.0
    center_y = new_h / 2.0
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)

    # Offset from unrotated center to unrotated anchor
    ox = anchor_local_x - center_x
    oy = anchor_local_y - center_y

    # Rotate offset vector clockwise by angle_deg
    rot_ox = ox * cos_a - oy * sin_a
    rot_oy = ox * sin_a + oy * cos_a

    # Anchor coordinates within the rotated image
    rot_anchor_x = (w_rot / 2.0) + rot_ox
    rot_anchor_y = (h_rot / 2.0) + rot_oy

    # 5. Determine destination top-left on canvas so anchor aligns with anchor_joint
    dest_x = int(round(anchor_joint[0] - rot_anchor_x))
    dest_y = int(round(anchor_joint[1] - rot_anchor_y))

    return rotated, (dest_x, dest_y)


# ---------------------------------------------------------------------------
# Procedural Shape Asset Generator (Self-Contained Fallback & Presets)
# ---------------------------------------------------------------------------

def generate_sample_assets(output_dir: str):
    """
    Creates a full set of clean, pre-cut transparent PNG shape assets for
    both male and female templates, allowing immediate testing without external files.
    """
    for gender in ["male", "female"]:
        target_dir = os.path.join(output_dir, gender)
        os.makedirs(target_dir, exist_ok=True)

        is_female = gender == "female"

        # Color palette: elegant warm construction palette with clean dark stroke
        fill_color = (251, 191, 36, 230) if not is_female else (244, 114, 182, 230) # Amber / Rose
        stroke_color = (15, 23, 42, 255) # Deep slate stroke

        # 1. Head (Egg / Oval)
        im = Image.new("RGBA", (140, 180), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.ellipse([10, 10, 130, 170], fill=fill_color, outline=stroke_color, width=4)
        # Facial line
        d.line([70, 40, 70, 140], fill=stroke_color, width=2)
        im.save(os.path.join(target_dir, "head.png"))

        # 2. Neck
        im = Image.new("RGBA", (70, 90), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([12, 10, 58, 80], radius=15, fill=fill_color, outline=stroke_color, width=3)
        im.save(os.path.join(target_dir, "neck.png"))

        # 3. Torso / Ribcage
        torso_w = 200 if not is_female else 170
        im = Image.new("RGBA", (torso_w, 240), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([15, 15, torso_w - 15, 225], radius=35, fill=fill_color, outline=stroke_color, width=4)
        # Center sternum guide
        d.line([torso_w // 2, 40, torso_w // 2, 180], fill=stroke_color, width=2)
        im.save(os.path.join(target_dir, "torso.png"))

        # 4. Pelvis / Hips
        pelvis_w = 170 if not is_female else 200  # Wider hips for female template
        im = Image.new("RGBA", (pelvis_w, 140), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([15, 10, pelvis_w - 15, 130], radius=25, fill=fill_color, outline=stroke_color, width=4)
        im.save(os.path.join(target_dir, "pelvis.png"))

        # 5. Upper Arm (Cylinder / Capsule)
        arm_w = 70 if not is_female else 55
        im = Image.new("RGBA", (arm_w, 190), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([8, 8, arm_w - 8, 182], radius=arm_w // 2, fill=fill_color, outline=stroke_color, width=4)
        im.save(os.path.join(target_dir, "upper_arm.png"))

        # 6. Forearm (Tapered Capsule)
        im = Image.new("RGBA", (60, 180), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([10, 8, 50, 172], radius=22, fill=fill_color, outline=stroke_color, width=3)
        im.save(os.path.join(target_dir, "forearm.png"))

        # 7. Hand (Mitten / Wedge)
        im = Image.new("RGBA", (60, 90), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([10, 8, 50, 82], radius=18, fill=fill_color, outline=stroke_color, width=3)
        im.save(os.path.join(target_dir, "hand.png"))

        # 8. Thigh (Upper Leg)
        thigh_w = 90 if not is_female else 85
        im = Image.new("RGBA", (thigh_w, 260), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([10, 10, thigh_w - 10, 250], radius=thigh_w // 2, fill=fill_color, outline=stroke_color, width=4)
        im.save(os.path.join(target_dir, "thigh.png"))

        # 9. Shin (Lower Leg)
        im = Image.new("RGBA", (70, 240), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([12, 10, 58, 230], radius=25, fill=fill_color, outline=stroke_color, width=4)
        im.save(os.path.join(target_dir, "shin.png"))

        # 10. Foot (Wedge)
        im = Image.new("RGBA", (70, 100), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([10, 10, 60, 90], radius=20, fill=fill_color, outline=stroke_color, width=3)
        im.save(os.path.join(target_dir, "foot.png"))

    print(f"[Assets] Generated sample male and female shape assets in: {output_dir}")


# ---------------------------------------------------------------------------
# Composite Pipeline Execution
# ---------------------------------------------------------------------------

class PoseShapeCompositePipeline:
    """Executes the full deterministic pose detection, transformation, and compositing pipeline."""

    def __init__(
        self,
        asset_dir: str,
        gender: str = "auto",
        min_confidence: float = 0.5,
        bg_color: Tuple[int, int, int, int] = (255, 255, 255, 255)
    ):
        self.asset_dir = asset_dir
        self.gender = gender
        self.min_confidence = min_confidence
        self.bg_color = bg_color
        self.detector = LocalPoseDetector(min_detection_confidence=min_confidence)

    def process(self, reference_path: str, output_path: str) -> bool:
        if not os.path.exists(reference_path):
            print(f"[Error] Reference photo not found: {reference_path}", file=sys.stderr)
            return False

        # Load reference photo using OpenCV
        bgr = cv2.imread(reference_path)
        if bgr is None:
            print(f"[Error] Could not read image file: {reference_path}", file=sys.stderr)
            return False

        h, w = bgr.shape[:2]
        print(f"\n[PoseComposite] Processing: {reference_path} ({w}x{h} px)")

        # 1. Detect 33 body landmarks
        joints, warnings = self.detector.detect(bgr)
        for warn in warnings:
            print(f"  [Warning] {warn}")

        if not joints:
            print("[Error] Landmark extraction failed. Cannot assemble shape mannequin.", file=sys.stderr)
            return False

        # 2. Initialize Asset Manager
        asset_mgr = AssetManager(self.asset_dir, self.gender, joints)
        print(f"  [Template] Active Template Set: {asset_mgr.gender.upper()} ({asset_mgr.resolved_dir})")
        print(f"  [Assets] Loaded {len(asset_mgr.assets)} shape assets.")

        if len(asset_mgr.assets) == 0:
            print(f"[Error] No PNG assets found in '{asset_mgr.resolved_dir}'.", file=sys.stderr)
            print("         Run with '--create-sample-assets' to generate default template shapes.", file=sys.stderr)
            return False

        # 3. Create mannequin canvas matching reference dimensions
        mannequin_canvas = Image.new("RGBA", (w, h), self.bg_color)
        occluded_segments: List[str] = []
        assembled_count = 0

        # Sort segments by anatomical z-index
        segments = sorted(get_anatomical_segments(), key=lambda s: s.z_index)

        print("\n  Segment Geometry & Assembly:")
        print(f"  {'Segment':<18} | {'Length':<8} | {'Angle':<8} | {'Status':<15}")
        print("  " + "-" * 56)

        # 4. Transform and layer each body part asset
        for seg in segments:
            j_a = joints.get(seg.joint_a)
            j_b = joints.get(seg.joint_b)

            if not j_a or not j_b:
                print(f"  {seg.name:<18} | {'-':<8} | {'-':<8} | Missing Joint")
                occluded_segments.append(seg.name)
                continue

            # Confidence check for occlusion handling: flag rather than guess
            if j_a.visibility < self.min_confidence or j_b.visibility < self.min_confidence:
                status = f"Occluded ({min(j_a.visibility, j_b.visibility):.2f})"
                print(f"  {seg.name:<18} | {'-':<8} | {'-':<8} | {status}")
                occluded_segments.append(seg.name)
                continue

            # Calculate geometry: midpoint, angle, length
            midpoint, angle_deg, length = calculate_segment_geometry(j_a, j_b)

            if length < 8.0:
                print(f"  {seg.name:<18} | {length:<8.1f} | {'-':<8} | Too Small (<8px)")
                continue

            # Find matching shape asset
            asset_match = asset_mgr.find_asset(seg.asset_keys)
            if not asset_match:
                print(f"  {seg.name:<18} | {length:<8.1f} | {angle_deg:<7.1f} deg | No Asset Found")
                continue

            asset_key, asset_img = asset_match

            # Determine anchor coordinate (joint A is the primary connecting joint)
            anchor_coord = (j_a.x, j_a.y) if seg.anchor_ratio <= 0.2 else (
                midpoint if seg.anchor_ratio == 0.5 else (j_b.x, j_b.y)
            )

            # Deterministic resize and rotation around anchor
            transformed_img, (dest_x, dest_y) = transform_and_place_asset(
                asset_img,
                target_length=length,
                angle_deg=angle_deg,
                anchor_joint=anchor_coord,
                anchor_ratio=seg.anchor_ratio,
                flip_h=seg.flip_horizontal
            )

            # Paste onto mannequin canvas using alpha mask
            mannequin_canvas.paste(transformed_img, (dest_x, dest_y), mask=transformed_img)
            assembled_count += 1
            print(f"  {seg.name:<18} | {length:<8.1f} | {angle_deg:<7.1f} deg | Assembled ({asset_key})")

        print("  " + "-" * 56)
        print(f"  Assembled {assembled_count}/{len(segments)} segments successfully.")

        # 5. Composite side-by-side with original reference photo
        ref_pil = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        divider_width = 4
        comp_w = w * 2 + divider_width
        comp_h = h

        composite = Image.new("RGB", (comp_w, comp_h), (255, 255, 255))

        # Paste reference photo on the left
        composite.paste(ref_pil, (0, 0))

        # Draw thin divider line
        draw = ImageDraw.Draw(composite)
        div_x = w
        draw.rectangle([div_x, 0, div_x + divider_width, comp_h], fill=(215, 220, 228))

        # Paste rendered mannequin on the right
        # Convert transparent mannequin canvas to RGB on white
        white_bg = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        mannequin_flattened = Image.alpha_composite(white_bg, mannequin_canvas).convert("RGB")
        composite.paste(mannequin_flattened, (div_x + divider_width, 0))

        # 6. Add modern informative banner badges
        self._render_header_badges(composite, w, h, divider_width, asset_mgr.gender, occluded_segments)

        # 7. Save final single PNG output
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        composite.save(output_path, format="PNG", quality=95)
        print(f"\n[Success] Saved side-by-side composite: {output_path}")

        return True

    def _render_header_badges(
        self,
        image: Image.Image,
        panel_w: int,
        panel_h: int,
        divider_w: int,
        gender: str,
        occluded: List[str]
    ):
        draw = ImageDraw.Draw(image)

        # Badge pill 1: Reference Photo
        draw.rounded_rectangle([16, 16, 170, 48], radius=8, fill=(15, 23, 42, 220))
        draw.text((28, 24), "REFERENCE POSE", fill=(248, 250, 252))

        # Badge pill 2: Shape Mannequin Template
        pill_text = f"SHAPE MANNEQUIN ({gender.upper()})"
        draw.rounded_rectangle([panel_w + divider_w + 16, 16, panel_w + divider_w + 260, 48], radius=8, fill=(15, 23, 42, 220))
        draw.text((panel_w + divider_w + 28, 24), pill_text, fill=(56, 189, 248))

        # Occlusion alert badge if any limbs were omitted
        if occluded:
            alert_text = f"Occluded/Skipped ({len(occluded)}): " + ", ".join(occluded[:3])
            if len(occluded) > 3:
                alert_text += "..."
            alert_w = min(420, panel_w - 40)
            draw.rounded_rectangle(
                [panel_w + divider_w + 16, panel_h - 44, panel_w + divider_w + 16 + alert_w, panel_h - 16],
                radius=6,
                fill=(239, 68, 68, 220)
            )
            draw.text((panel_w + divider_w + 26, panel_h - 36), alert_text, fill=(255, 255, 255))


# ---------------------------------------------------------------------------
# CLI Argument Parser & Entry Point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Local MediaPipe Pose Shape Mannequin Composite Pipeline"
    )
    parser.add_argument(
        "reference",
        nargs="?",
        default=None,
        help="Path to reference photo (e.g. reference.jpg)"
    )
    parser.add_argument(
        "assets",
        nargs="?",
        default="assets",
        help="Path to folder of pre-cut transparent PNG shape assets (default: assets/)"
    )
    parser.add_argument(
        "-o", "--output",
        default=None,
        help="Output path for the composite PNG image (default: <reference>_composite.png)"
    )
    parser.add_argument(
        "--gender",
        choices=["male", "female", "auto"],
        default="auto",
        help="Gender template set to use: male, female, or auto (default: auto)"
    )
    parser.add_argument(
        "--confidence",
        type=float,
        default=0.45,
        help="Minimum landmark visibility confidence threshold (default: 0.45)"
    )
    parser.add_argument(
        "--create-sample-assets",
        action="store_true",
        help="Generate a complete set of transparent PNG shape assets in the assets folder for testing"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Generator mode for instant testing without needing pre-existing PNGs
    if args.create_sample_assets or (args.reference is None and not os.path.exists(args.assets)):
        assets_dir = args.assets or "assets"
        generate_sample_assets(assets_dir)
        if args.reference is None:
            print("\nUsage example:")
            print(f"  python pose_shape_composite.py reference.jpg {assets_dir} -o output_composite.png\n")
            return

    if not args.reference:
        print("[Error] Please provide a reference image path.", file=sys.stderr)
        print("Usage: python pose_shape_composite.py <reference.jpg> [assets_dir] [-o output.png]", file=sys.stderr)
        sys.exit(1)

    stem, _ = os.path.splitext(args.reference)
    output_path = args.output or f"{stem}_composite.png"

    pipeline = PoseShapeCompositePipeline(
        asset_dir=args.assets,
        gender=args.gender,
        min_confidence=args.confidence
    )

    success = pipeline.process(args.reference, output_path)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
