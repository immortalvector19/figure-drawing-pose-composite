import cv2
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from .primitives import PrimitiveShape, PrimitiveType, LandmarkPoint


class PrimitiveFitter:
    def fit_primitive(
        self,
        contour: np.ndarray,
        shape_index: int,
        landmarks: List[LandmarkPoint],
    ) -> Optional[PrimitiveShape]:
        """
        Classify and fit the mathematically optimal primitive shape onto a contour:
        Circle/Sphere, Oval/Ellipse, Box/Rectangle, Cylinder/Capsule, or Wedge/Polygon.
        """
        area = float(cv2.contourArea(contour))
        perimeter = float(cv2.arcLength(contour, True))
        if area < 10 or perimeter < 10:
            return None

        # 1. Circularity: 4 * pi * Area / Perimeter^2 (1.0 for perfect circle)
        circularity = (4.0 * np.pi * area) / (perimeter * perimeter)
        circularity = min(1.0, max(0.0, circularity))

        # 2. Convex Hull & Solidity
        hull = cv2.convexHull(contour)
        hull_area = float(cv2.contourArea(hull))
        solidity = (area / hull_area) if hull_area > 0 else 0.0

        # 3. Minimum Area Rotated Bounding Rectangle
        rect = cv2.minAreaRect(contour)
        (rcx, rcy), (rw, rh), angle = rect

        minor_dim = min(rw, rh)
        major_dim = max(rw, rh)
        aspect_ratio = (major_dim / minor_dim) if minor_dim > 0 else 1.0

        rect_area = rw * rh
        rectangularity = (area / rect_area) if rect_area > 0 else 0.0
        rectangularity = min(1.0, max(0.0, rectangularity))

        # Oriented bounding box corner vertices
        box_pts = cv2.boxPoints(rect)
        vertices = [(float(pt[0]), float(pt[1])) for pt in box_pts]

        # 4. Polygon approximation
        epsilon = 0.035 * perimeter
        approx = cv2.approxPolyDP(contour, epsilon, True)
        num_vertices = len(approx)
        approx_area = float(cv2.contourArea(approx))
        approx_area_ratio = (approx_area / area) if area > 0 else 0.0

        # Classification decision hierarchy based on geometric invariants
        shape_type: PrimitiveType
        name: str
        confidence: float
        cross_contours: List[Dict[str, Any]] = []

        is_box = (
            (num_vertices == 4 and rectangularity >= 0.82 and approx_area_ratio >= 0.92)
            or (rectangularity >= 0.94 and approx_area_ratio >= 0.92)
        )
        is_cylinder = (
            not is_box
            and aspect_ratio >= 1.60
            and rectangularity >= 0.83
            and solidity >= 0.70
        )

        # Case 1: Circle / Sphere
        if circularity >= 0.78 and aspect_ratio <= 1.32:
            (cx, cy), radius = cv2.minEnclosingCircle(contour)
            equiv_diameter = float(np.sqrt(4.0 * area / np.pi))
            shape_type = PrimitiveType.CIRCLE
            name = f"Sphere/Circle #{shape_index}"
            confidence = circularity
            width = equiv_diameter
            height = equiv_diameter
            center_x, center_y = float(cx), float(cy)
            angle = 0.0

        # Case 2: Box / Rectangle
        elif is_box:
            shape_type = PrimitiveType.BOX
            name = f"Box/Rectangle #{shape_index}"
            confidence = rectangularity
            center_x, center_y = float(rcx), float(rcy)
            width = float(minor_dim)
            height = float(major_dim)

        # Case 3: Cylinder / Capsule (Elongated form with parallel sides and rounded caps)
        elif is_cylinder:
            shape_type = PrimitiveType.CYLINDER
            name = f"Cylinder/Capsule #{shape_index}"
            confidence = (rectangularity * 0.5 + solidity * 0.5)
            width = float(minor_dim)
            height = float(major_dim)
            center_x, center_y = float(rcx), float(rcy)

            # Generate 3D perspective cross-contour ellipse arcs along cylinder medial axis
            cross_contours = self._generate_cylinder_cross_contours(
                center_x, center_y, width, height, angle, num_contours=3
            )

        # Case 4: Wedge / Triangle
        elif num_vertices == 3 or (num_vertices <= 5 and rectangularity < 0.62 and solidity > 0.72):
            shape_type = PrimitiveType.WEDGE
            name = f"Wedge/Block #{shape_index}"
            confidence = solidity
            center_x, center_y = float(rcx), float(rcy)
            width = float(minor_dim)
            height = float(major_dim)

        # Case 5: Oval / Ellipse
        elif (circularity >= 0.45 and solidity >= 0.70) or (len(contour) >= 5 and circularity >= 0.50):
            shape_type = PrimitiveType.OVAL
            name = f"Oval/Egg #{shape_index}"
            confidence = max(circularity, solidity * 0.9)
            if len(contour) >= 5:
                (ecx, ecy), (ew, eh), eangle = cv2.fitEllipse(contour)
                center_x, center_y = float(ecx), float(ecy)
                width = float(min(ew, eh))
                height = float(max(ew, eh))
                angle = float(eangle)
            else:
                center_x, center_y = float(rcx), float(rcy)
                width = float(minor_dim)
                height = float(major_dim)

        # Case 6: General Polygon
        else:
            shape_type = PrimitiveType.POLYGON
            name = f"Polygon Mass #{shape_index}"
            confidence = solidity
            center_x, center_y = float(rcx), float(rcy)
            width = float(minor_dim)
            height = float(major_dim)

        return PrimitiveShape(
            id=f"primitive-{shape_index}",
            type=shape_type,
            name=name,
            center_x=center_x,
            center_y=center_y,
            width=width,
            height=height,
            angle=float(angle),
            confidence=float(confidence),
            area=area,
            perimeter=perimeter,
            circularity=circularity,
            rectangularity=rectangularity,
            aspect_ratio=aspect_ratio,
            vertices=vertices,
            landmarks=landmarks,
            cross_contours=cross_contours,
        )

    def _generate_cylinder_cross_contours(
        self, cx: float, cy: float, width: float, height: float, angle_deg: float, num_contours: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate 3D perspective cross-contour elliptical arcs along a cylinder's medial axis.
        """
        contours = []
        angle_rad = np.radians(angle_deg)
        # Direction vector along the cylinder's major axis
        dx = -np.sin(angle_rad)
        dy = np.cos(angle_rad)

        positions = np.linspace(-0.35, 0.35, num_contours)
        for t in positions:
            contour_x = cx + dx * (height * t)
            contour_y = cy + dy * (height * t)
            contours.append({
                "center_x": round(float(contour_x), 2),
                "center_y": round(float(contour_y), 2),
                "radius_x": round(float(width * 0.48), 2),
                "radius_y": round(float(width * 0.22), 2),
                "angle": round(float(angle_deg), 2),
            })

        return contours
