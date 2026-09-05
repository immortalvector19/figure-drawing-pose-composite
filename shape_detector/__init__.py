import time
import cv2
import numpy as np
from typing import Union, List, Optional
from .primitives import ShapeDetectionResult, PrimitiveShape, PrimitiveType, LandmarkPoint, LandmarkType
from .contour_analyzer import ContourAnalyzer
from .primitive_fitter import PrimitiveFitter
from .visualizer import ShapeVisualizer


class ShapeDetector:
    """
    Universal Shape and Landmark Detection Model.
    Analyzes any image, detects contours and salient landmarks,
    classifies geometric primitives (spheres, boxes, cylinders, ovals, wedges),
    and fits them directly onto the detected objects.
    """

    def __init__(
        self,
        min_area: float = 350.0,
        max_shapes: int = 25,
        opacity: float = 0.28,
        stroke_width: int = 3,
        show_landmarks: bool = True,
    ):
        self.min_area = min_area
        self.max_shapes = max_shapes
        self.analyzer = ContourAnalyzer(min_area=min_area)
        self.fitter = PrimitiveFitter()
        self.visualizer = ShapeVisualizer(
            opacity=opacity, stroke_width=stroke_width, show_landmarks=show_landmarks
        )

    def process_image(self, image_input: Union[str, np.ndarray]) -> ShapeDetectionResult:
        """
        Analyze an image (path or numpy BGR array) and extract primitive shapes and landmarks.
        """
        start_time = time.perf_counter()

        if isinstance(image_input, str):
            image = cv2.imread(image_input)
            if image is None:
                raise ValueError(f"Could not load image from path: {image_input}")
        else:
            image = image_input

        h, w = image.shape[:2]
        total_area = float(w * h)

        # 1. Preprocessing & Edge Extraction
        gray, blurred = self.analyzer.preprocess(image)
        binary_mask = self.analyzer.extract_edges(blurred)

        # 2. Extract Structural Contours
        contours = self.analyzer.find_object_contours(binary_mask, total_area)

        # Limit to max_shapes
        primary_contours = contours[: self.max_shapes]

        shapes: List[PrimitiveShape] = []
        all_landmarks: List[LandmarkPoint] = []

        # 3. Fit Primitives & Extract Landmarks for Each Contour
        for idx, cnt in enumerate(primary_contours, start=1):
            landmarks = self.analyzer.extract_landmarks(gray, cnt)
            all_landmarks.extend(landmarks)

            primitive = self.fitter.fit_primitive(cnt, idx, landmarks)
            if primitive:
                shapes.append(primitive)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return ShapeDetectionResult(
            image_width=w,
            image_height=h,
            shapes=shapes,
            landmarks=all_landmarks,
            processing_time_ms=elapsed_ms,
        )

    def render_overlay(
        self,
        image: np.ndarray,
        result: ShapeDetectionResult,
        transparent_bg: bool = False,
    ) -> np.ndarray:
        """Render recognized shapes and landmarks onto the image."""
        return self.visualizer.render(image, result, transparent_bg=transparent_bg)

    def to_svg(self, result: ShapeDetectionResult) -> str:
        """Convert result to scalable vector SVG markup."""
        return self.visualizer.to_svg(result)

    def export_json(self, result: ShapeDetectionResult, filepath: str) -> None:
        """Export detection results to JSON."""
        self.visualizer.export_json(result, filepath)
