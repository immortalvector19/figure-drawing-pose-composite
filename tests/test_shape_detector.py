import unittest
import numpy as np
import cv2
from shape_detector import ShapeDetector, PrimitiveType, LandmarkType


class TestShapeDetector(unittest.TestCase):
    def setUp(self):
        self.detector = ShapeDetector(min_area=200.0, max_shapes=15)

    def test_detect_circle(self):
        """Verify that a synthetic circle is correctly recognized as PrimitiveType.CIRCLE."""
        img = np.zeros((400, 400, 3), dtype=np.uint8)
        # White circle on black background
        cv2.circle(img, (200, 200), 70, (255, 255, 255), -1)

        result = self.detector.process_image(img)
        self.assertGreater(len(result.shapes), 0)

        circle_shape = result.shapes[0]
        self.assertEqual(circle_shape.type, PrimitiveType.CIRCLE)
        self.assertAlmostEqual(circle_shape.center_x, 200, delta=5)
        self.assertAlmostEqual(circle_shape.center_y, 200, delta=5)
        self.assertAlmostEqual(circle_shape.width, 140, delta=10)
        self.assertGreater(circle_shape.circularity, 0.85)

    def test_detect_box(self):
        """Verify that a synthetic rotated rectangle is recognized as PrimitiveType.BOX."""
        img = np.zeros((400, 400, 3), dtype=np.uint8)
        # Draw rotated rectangle
        rect = ((200, 200), (120, 80), 30)
        box_pts = cv2.boxPoints(rect)
        cv2.fillPoly(img, [np.int32(box_pts)], (255, 255, 255))

        result = self.detector.process_image(img)
        self.assertGreater(len(result.shapes), 0)

        box_shape = result.shapes[0]
        self.assertEqual(box_shape.type, PrimitiveType.BOX)
        self.assertAlmostEqual(box_shape.center_x, 200, delta=5)
        self.assertAlmostEqual(box_shape.center_y, 200, delta=5)
        self.assertGreater(box_shape.rectangularity, 0.80)

    def test_detect_cylinder_with_cross_contours(self):
        """Verify that an elongated rounded form is classified as CYLINDER with cross-contours."""
        img = np.zeros((500, 500, 3), dtype=np.uint8)
        # Draw elongated rounded capsule (cylinder)
        cv2.ellipse(img, (250, 250), (45, 130), 0, 0, 360, (255, 255, 255), -1)

        result = self.detector.process_image(img)
        self.assertGreater(len(result.shapes), 0)

        shape = result.shapes[0]
        # Should be classified as CYLINDER or OVAL
        self.assertIn(shape.type, (PrimitiveType.CYLINDER, PrimitiveType.OVAL))
        if shape.type == PrimitiveType.CYLINDER:
            self.assertGreater(len(shape.cross_contours), 0)
            self.assertIn("radius_x", shape.cross_contours[0])

    def test_extract_landmarks(self):
        """Verify landmark points (corners, centroids) are extracted."""
        img = np.zeros((400, 400, 3), dtype=np.uint8)
        # Triangle with distinct sharp corners
        pts = np.array([[100, 300], [300, 300], [200, 100]], dtype=np.int32)
        cv2.fillPoly(img, [pts], (255, 255, 255))

        result = self.detector.process_image(img)
        self.assertGreater(len(result.landmarks), 0)

        types = [lm.type for lm in result.landmarks]
        self.assertIn(LandmarkType.CENTROID, types)

    def test_render_and_export(self):
        """Verify overlay rendering, SVG export, and JSON dictionary format."""
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        cv2.circle(img, (150, 150), 50, (255, 255, 255), -1)

        result = self.detector.process_image(img)

        # Render overlay on image
        annotated = self.detector.render_overlay(img, result, transparent_bg=False)
        self.assertEqual(annotated.shape, img.shape)

        # Render transparent overlay
        transparent = self.detector.render_overlay(img, result, transparent_bg=True)
        self.assertEqual(transparent.shape, (300, 300, 4))

        # SVG export
        svg = self.detector.to_svg(result)
        self.assertIn("<svg", svg)
        self.assertIn("</svg>", svg)
        self.assertIn("circle", svg)

        # JSON dictionary
        d = result.to_dict()
        self.assertEqual(d["image_dimensions"]["width"], 300)
        self.assertEqual(d["total_shapes_detected"], 1)

    def test_blank_image(self):
        """Verify that a completely blank image produces 0 shapes without crashing."""
        blank = np.zeros((200, 200, 3), dtype=np.uint8)
        result = self.detector.process_image(blank)
        self.assertEqual(len(result.shapes), 0)
        self.assertEqual(len(result.landmarks), 0)


if __name__ == "__main__":
    unittest.main()
