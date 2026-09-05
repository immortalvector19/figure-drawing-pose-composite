import cv2
import json
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from .primitives import ShapeDetectionResult, PrimitiveShape, PrimitiveType, LandmarkPoint, LandmarkType

# Color map: (B, G, R) for OpenCV
PALETTE_BGR = {
    PrimitiveType.CIRCLE: (248, 189, 56),    # Sky Blue #38bdf8
    PrimitiveType.OVAL: (94, 63, 244),       # Rose / Magenta #f43f5e
    PrimitiveType.BOX: (247, 85, 168),       # Purple #a855f7
    PrimitiveType.CYLINDER: (8, 179, 234),   # Amber #eab308
    PrimitiveType.WEDGE: (22, 115, 249),     # Orange #f97316
    PrimitiveType.POLYGON: (94, 197, 34),    # Emerald #22c55e
}

PALETTE_HEX = {
    PrimitiveType.CIRCLE: "#38bdf8",
    PrimitiveType.OVAL: "#f43f5e",
    PrimitiveType.BOX: "#a855f7",
    PrimitiveType.CYLINDER: "#eab308",
    PrimitiveType.WEDGE: "#f97316",
    PrimitiveType.POLYGON: "#22c55e",
}


class ShapeVisualizer:
    def __init__(self, opacity: float = 0.28, stroke_width: int = 3, show_landmarks: bool = True):
        self.opacity = opacity
        self.stroke_width = stroke_width
        self.show_landmarks = show_landmarks

    def render(
        self,
        base_image: np.ndarray,
        result: ShapeDetectionResult,
        transparent_bg: bool = False,
    ) -> np.ndarray:
        """
        Renders primitive shapes and landmarks directly onto the image.
        If transparent_bg is True, returns an RGBA image with transparent background.
        """
        h, w = base_image.shape[:2]

        if transparent_bg:
            output = np.zeros((h, w, 4), dtype=np.uint8)
            fill_layer = np.zeros((h, w, 4), dtype=np.uint8)
        else:
            output = base_image.copy()
            fill_layer = output.copy()

        # 1. Render filled interiors onto fill_layer
        for shape in result.shapes:
            color_bgr = PALETTE_BGR.get(shape.type, (200, 200, 200))
            color = (*color_bgr, int(255 * self.opacity)) if transparent_bg else color_bgr

            if shape.type == PrimitiveType.CIRCLE:
                cv2.circle(
                    fill_layer,
                    (int(shape.center_x), int(shape.center_y)),
                    int(shape.width / 2),
                    color,
                    -1,
                    cv2.LINE_AA,
                )
            elif shape.type in (PrimitiveType.OVAL, PrimitiveType.CYLINDER):
                cv2.ellipse(
                    fill_layer,
                    (int(shape.center_x), int(shape.center_y)),
                    (int(shape.width / 2), int(shape.height / 2)),
                    shape.angle,
                    0,
                    360,
                    color,
                    -1,
                    cv2.LINE_AA,
                )
            elif shape.type in (PrimitiveType.BOX, PrimitiveType.WEDGE, PrimitiveType.POLYGON):
                if len(shape.vertices) >= 3:
                    pts = np.array(shape.vertices, dtype=np.int32)
                    cv2.fillPoly(fill_layer, [pts], color, cv2.LINE_AA)

        # Blend fills
        if transparent_bg:
            output = fill_layer.copy()
        else:
            output = cv2.addWeighted(fill_layer, self.opacity, output, 1.0 - self.opacity, 0)

        # 2. Render solid outline strokes and cross-contours
        for shape in result.shapes:
            color_bgr = PALETTE_BGR.get(shape.type, (255, 255, 255))
            color = (*color_bgr, 255) if transparent_bg else color_bgr

            if shape.type == PrimitiveType.CIRCLE:
                cv2.circle(
                    output,
                    (int(shape.center_x), int(shape.center_y)),
                    int(shape.width / 2),
                    color,
                    self.stroke_width,
                    cv2.LINE_AA,
                )
            elif shape.type in (PrimitiveType.OVAL, PrimitiveType.CYLINDER):
                cv2.ellipse(
                    output,
                    (int(shape.center_x), int(shape.center_y)),
                    (int(shape.width / 2), int(shape.height / 2)),
                    shape.angle,
                    0,
                    360,
                    color,
                    self.stroke_width,
                    cv2.LINE_AA,
                )
            elif shape.type in (PrimitiveType.BOX, PrimitiveType.WEDGE, PrimitiveType.POLYGON):
                if len(shape.vertices) >= 3:
                    pts = np.array(shape.vertices, dtype=np.int32)
                    cv2.polylines(output, [pts], True, color, self.stroke_width, cv2.LINE_AA)

            # Draw perspective cross-contours on cylinders
            for cc in shape.cross_contours:
                cc_color = (180, 180, 180, 255) if transparent_bg else (180, 180, 180)
                cv2.ellipse(
                    output,
                    (int(cc["center_x"]), int(cc["center_y"])),
                    (int(cc["radius_x"]), int(cc["radius_y"])),
                    cc["angle"],
                    0,
                    360,
                    cc_color,
                    2,
                    cv2.LINE_AA,
                )

            # Draw centroid anchor
            center_color = (255, 255, 255, 255) if transparent_bg else (255, 255, 255)
            cv2.circle(output, (int(shape.center_x), int(shape.center_y)), 4, center_color, -1, cv2.LINE_AA)

        # 3. Render landmark points if enabled
        if self.show_landmarks:
            for shape in result.shapes:
                for lm in shape.landmarks:
                    pt = (int(lm.x), int(lm.y))
                    dot_color = (0, 255, 255, 255) if transparent_bg else (0, 255, 255)
                    # Outer white ring
                    cv2.circle(output, pt, 5, (255, 255, 255, 255) if transparent_bg else (255, 255, 255), 1, cv2.LINE_AA)
                    # Inner colored dot
                    cv2.circle(output, pt, 3, dot_color, -1, cv2.LINE_AA)

        return output

    def to_svg(self, result: ShapeDetectionResult) -> str:
        """
        Generate clean scalable vector SVG string matching the image viewport.
        """
        w, h = result.image_width, result.image_height
        svg_elements = []

        for shape in result.shapes:
            hex_color = PALETTE_HEX.get(shape.type, "#ffffff")
            fill_opacity = self.opacity

            if shape.type == PrimitiveType.CIRCLE:
                r = shape.width / 2
                svg_elements.append(
                    f'    <circle cx="{shape.center_x}" cy="{shape.center_y}" r="{r}" '
                    f'fill="{hex_color}" fill-opacity="{fill_opacity}" stroke="{hex_color}" stroke-width="{self.stroke_width}" '
                    f'data-name="{shape.name}" />'
                )
            elif shape.type in (PrimitiveType.OVAL, PrimitiveType.CYLINDER):
                rx = shape.width / 2
                ry = shape.height / 2
                svg_elements.append(
                    f'    <ellipse cx="{shape.center_x}" cy="{shape.center_y}" rx="{rx}" ry="{ry}" '
                    f'transform="rotate({shape.angle} {shape.center_x} {shape.center_y})" '
                    f'fill="{hex_color}" fill-opacity="{fill_opacity}" stroke="{hex_color}" stroke-width="{self.stroke_width}" '
                    f'data-name="{shape.name}" />'
                )
                for cc in shape.cross_contours:
                    svg_elements.append(
                        f'    <ellipse cx="{cc["center_x"]}" cy="{cc["center_y"]}" rx="{cc["radius_x"]}" ry="{cc["radius_y"]}" '
                        f'transform="rotate({cc["angle"]} {cc["center_x"]} {cc["center_y"]})" '
                        f'fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />'
                    )
            elif shape.type in (PrimitiveType.BOX, PrimitiveType.WEDGE, PrimitiveType.POLYGON):
                pts_str = " ".join(f"{x},{y}" for x, y in shape.vertices)
                svg_elements.append(
                    f'    <polygon points="{pts_str}" '
                    f'fill="{hex_color}" fill-opacity="{fill_opacity}" stroke="{hex_color}" stroke-width="{self.stroke_width}" '
                    f'data-name="{shape.name}" />'
                )

        elements_str = "\n".join(svg_elements)
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <!-- FormMaster Universal Shape & Landmark Detection -->
  <g id="detected-primitives">
{elements_str}
  </g>
</svg>"""

    def export_json(self, result: ShapeDetectionResult, filepath: str) -> None:
        """Export result to JSON file."""
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(result.to_dict(), f, indent=2)
