#!/usr/bin/env python3
"""
FormMaster CLI: Universal Shape and Landmark Detection Script
Takes any image, extracts salient landmarks and contours, recognizes primitive geometric shapes
(spheres, boxes, cylinders, ovals, wedges), and places them directly on the detected objects.
"""

import sys
import os
import argparse
import cv2
from shape_detector import ShapeDetector, PrimitiveType


def parse_args():
    parser = argparse.ArgumentParser(
        description="Detect and place geometric shapes and landmarks on any image."
    )
    parser.add_argument("input", help="Path to input image file (JPG, PNG, WebP, etc.)")
    parser.add_argument(
        "-o", "--output", help="Path for annotated output image with shapes placed on objects"
    )
    parser.add_argument(
        "--overlay", help="Path for transparent PNG containing only the construction shapes"
    )
    parser.add_argument("--svg", help="Path for scalable vector SVG file")
    parser.add_argument("--json", help="Path for structured detection JSON file")
    parser.add_argument(
        "--min-area",
        type=float,
        default=350.0,
        help="Minimum pixel area for detected object contours (default: 350)",
    )
    parser.add_argument(
        "--max-shapes",
        type=int,
        default=25,
        help="Maximum number of primary shapes to extract (default: 25)",
    )
    parser.add_argument(
        "--opacity",
        type=float,
        default=0.28,
        help="Fill opacity for rendered shapes (0.0 to 1.0, default: 0.28)",
    )
    parser.add_argument(
        "--stroke",
        type=int,
        default=3,
        help="Stroke width for shape outlines (default: 3)",
    )
    parser.add_argument(
        "--no-landmarks", action="store_true", help="Disable rendering landmark dots"
    )
    parser.add_argument(
        "-q", "--quiet", action="store_true", help="Suppress verbose terminal output"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found.", file=sys.stderr)
        sys.exit(1)

    image = cv2.imread(args.input)
    if image is None:
        print(f"Error: Could not decode image '{args.input}'.", file=sys.stderr)
        sys.exit(1)

    detector = ShapeDetector(
        min_area=args.min_area,
        max_shapes=args.max_shapes,
        opacity=args.opacity,
        stroke_width=args.stroke,
        show_landmarks=not args.no_landmarks,
    )

    if not args.quiet:
        print(f"\n[FormMaster] Processing: {args.input}")
        print(f"             Dimensions: {image.shape[1]}x{image.shape[0]} px")

    result = detector.process_image(image)

    if not args.quiet:
        print(f"             Execution Time: {result.processing_time_ms:.1f} ms")
        print(f"             Shapes Found: {len(result.shapes)}")
        print(f"             Landmarks Found: {len(result.landmarks)}\n")
        print(f"{'#':<3} | {'Type':<10} | {'Center (X,Y)':<14} | {'Size (WxH)':<14} | {'Angle':<7} | {'Confidence':<10}")
        print("-" * 70)
        for idx, s in enumerate(result.shapes, start=1):
            center = f"({s.center_x:.0f}, {s.center_y:.0f})"
            size = f"{s.width:.0f}x{s.height:.0f}"
            angle = f"{s.angle:.1f}°"
            conf = f"{s.confidence:.2f}"
            print(f"{idx:<3} | {s.type.value:<10} | {center:<14} | {size:<14} | {angle:<7} | {conf:<10}")
        print()

    # Determine default output path if none specified
    stem, ext = os.path.splitext(args.input)
    output_img_path = args.output or f"{stem}_detected_shapes.png"

    # 1. Save annotated image with shapes placed on objects
    annotated = detector.render_overlay(image, result, transparent_bg=False)
    cv2.imwrite(output_img_path, annotated)
    if not args.quiet:
        print(f"Saved annotated image: {output_img_path}")

    # 2. Save transparent overlay if requested
    if args.overlay:
        overlay = detector.render_overlay(image, result, transparent_bg=True)
        cv2.imwrite(args.overlay, overlay)
        if not args.quiet:
            print(f"Saved transparent overlay: {args.overlay}")

    # 3. Save SVG if requested
    if args.svg:
        svg_content = detector.to_svg(result)
        with open(args.svg, "w", encoding="utf-8") as f:
            f.write(svg_content)
        if not args.quiet:
            print(f"Saved vector SVG: {args.svg}")

    # 4. Save JSON metadata if requested
    if args.json:
        detector.export_json(result, args.json)
        if not args.quiet:
            print(f"Saved JSON metadata: {args.json}")


if __name__ == "__main__":
    main()
