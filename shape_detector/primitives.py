from dataclasses import dataclass, field
from enum import Enum
from typing import List, Tuple, Optional, Dict, Any


class PrimitiveType(str, Enum):
    CIRCLE = "circle"
    OVAL = "oval"
    BOX = "box"
    CYLINDER = "cylinder"
    WEDGE = "wedge"
    POLYGON = "polygon"


class LandmarkType(str, Enum):
    CORNER = "corner"
    INFLECTION = "inflection"
    CENTROID = "centroid"
    EXTREME = "extreme"
    JOINT = "joint"


@dataclass
class LandmarkPoint:
    x: float
    y: float
    type: LandmarkType = LandmarkType.CORNER
    saliency: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "type": self.type.value,
            "saliency": round(self.saliency, 3),
        }


@dataclass
class PrimitiveShape:
    id: str
    type: PrimitiveType
    name: str
    center_x: float
    center_y: float
    width: float
    height: float
    angle: float  # In degrees (-90 to +90 or 0 to 360)
    confidence: float
    area: float
    perimeter: float
    circularity: float
    rectangularity: float
    aspect_ratio: float
    vertices: List[Tuple[float, float]] = field(default_factory=list)
    landmarks: List[LandmarkPoint] = field(default_factory=list)
    cross_contours: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "name": self.name,
            "center": {"x": round(self.center_x, 2), "y": round(self.center_y, 2)},
            "dimensions": {"width": round(self.width, 2), "height": round(self.height, 2)},
            "angle": round(self.angle, 2),
            "confidence": round(self.confidence, 3),
            "metrics": {
                "area": round(self.area, 1),
                "perimeter": round(self.perimeter, 1),
                "circularity": round(self.circularity, 3),
                "rectangularity": round(self.rectangularity, 3),
                "aspect_ratio": round(self.aspect_ratio, 3),
            },
            "vertices": [[round(x, 2), round(y, 2)] for x, y in self.vertices],
            "landmarks": [lm.to_dict() for lm in self.landmarks],
            "cross_contours": self.cross_contours,
            "metadata": self.metadata,
        }


@dataclass
class ShapeDetectionResult:
    image_width: int = 0
    image_height: int = 0
    shapes: List[PrimitiveShape] = field(default_factory=list)
    landmarks: List[LandmarkPoint] = field(default_factory=list)
    processing_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "image_dimensions": {"width": self.image_width, "height": self.image_height},
            "total_shapes_detected": len(self.shapes),
            "total_landmarks_detected": len(self.landmarks),
            "processing_time_ms": round(self.processing_time_ms, 2),
            "shapes": [s.to_dict() for s in self.shapes],
            "landmarks": [lm.to_dict() for lm in self.landmarks],
        }
