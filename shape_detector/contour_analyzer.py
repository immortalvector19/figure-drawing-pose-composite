import cv2
import numpy as np
from typing import List, Tuple, Dict, Any
from .primitives import LandmarkPoint, LandmarkType


class ContourAnalyzer:
    def __init__(self, min_area: float = 350.0, max_area_ratio: float = 0.98):
        self.min_area = min_area
        self.max_area_ratio = max_area_ratio

    def preprocess(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess image for robust edge and contour extraction:
        1. Grayscale conversion.
        2. Bilateral filtering to smooth photographic noise while preserving sharp boundaries.
        3. CLAHE (Contrast Limited Adaptive Histogram Equalization) for dark/shadow regions.
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # CLAHE for contrast normalization
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Bilateral filter preserves sharp geometric edges while removing texture grain
        blurred = cv2.bilateralFilter(enhanced, d=7, sigmaColor=50, sigmaSpace=50)

        return gray, blurred

    def extract_edges(self, blurred_gray: np.ndarray) -> np.ndarray:
        """
        Multi-scale edge and binary mask extraction.
        Combines Canny edge detection with Otsu boundary thresholding and morphological closing.
        """
        # Canny edge detection with dynamic thresholds based on median intensity
        v = float(np.median(blurred_gray))
        sigma = 0.33
        lower = int(max(20, (1.0 - sigma) * v))
        upper = int(min(255, max(80, (1.0 + sigma) * v)))
        edges = cv2.Canny(blurred_gray, lower, upper)

        # Otsu thresholding boundary to catch subtle object-background separations
        _, otsu = cv2.threshold(blurred_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        otsu_edges = cv2.Canny(otsu, 50, 150)

        # Combine edge sources
        combined = cv2.bitwise_or(edges, otsu_edges)

        # Morphological closing to bridge micro-gaps in object silhouettes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        closed_edges = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)

        return closed_edges

    def find_object_contours(self, binary_mask: np.ndarray, total_image_area: float) -> List[np.ndarray]:
        """
        Extract external and prominent structural contours from the binary edge map.
        Filters out tiny artifacts and giant whole-image frame borders.
        """
        contours, hierarchy = cv2.findContours(
            binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        valid_contours = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter noise and whole-frame borders
            if self.min_area <= area <= (total_image_area * self.max_area_ratio):
                # Ensure contour has at least 5 points to allow ellipse fitting
                if len(cnt) >= 5:
                    valid_contours.append(cnt)

        # Sort descending by area so dominant masses are processed first
        valid_contours.sort(key=cv2.contourArea, reverse=True)
        return valid_contours

    def extract_landmarks(
        self, gray: np.ndarray, contour: np.ndarray, max_corners: int = 12
    ) -> List[LandmarkPoint]:
        """
        Extract salient geometric landmark points on and within the object:
        1. Centroid (center of mass via image moments).
        2. Convex hull inflection vertices.
        3. Corner points via Shi-Tomasi feature tracking restricted to contour mask.
        """
        landmarks: List[LandmarkPoint] = []

        # 1. Centroid via moments
        m = cv2.moments(contour)
        if m["m00"] > 0:
            cx = float(m["m10"] / m["m00"])
            cy = float(m["m01"] / m["m00"])
            landmarks.append(LandmarkPoint(x=cx, y=cy, type=LandmarkType.CENTROID, saliency=1.0))

        # 2. Convex hull inflection vertices
        hull = cv2.convexHull(contour)
        # Approximate hull slightly to eliminate near-duplicate vertices
        epsilon = 0.02 * cv2.arcLength(hull, True)
        approx_hull = cv2.approxPolyDP(hull, epsilon, True)

        for pt in approx_hull:
            x, y = float(pt[0][0]), float(pt[0][1])
            landmarks.append(LandmarkPoint(x=x, y=y, type=LandmarkType.EXTREME, saliency=0.85))

        # 3. Shi-Tomasi Corner Detection inside contour mask
        mask = np.zeros(gray.shape, dtype=np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, -1)

        corners = cv2.goodFeaturesToTrack(
            gray,
            maxCorners=max_corners,
            qualityLevel=0.04,
            minDistance=15,
            mask=mask,
            blockSize=5,
        )

        if corners is not None:
            for c in corners:
                x, y = float(c[0][0]), float(c[0][1])
                # Check distance from existing landmarks to prevent clutter
                if all(np.hypot(x - lm.x, y - lm.y) > 12 for lm in landmarks):
                    landmarks.append(LandmarkPoint(x=x, y=y, type=LandmarkType.CORNER, saliency=0.9))

        return landmarks
