# FormMaster: 3D Figure Construction Drawing Reference & Pose Studio

> A suite of tools for figure drawing and visual art students that breaks photographic references down to fundamental 3D geometric construction masses — spheres, ovals, cylinders, boxes, and cross-contours à la Andrew Loomis, George Bridgman, Kensuke Okabayashi, Ryan Woodward, and Ron Tiner.

---

## 1. Overview & Three Tool Pipelines

To avoid confusion between different detection approaches, FormMaster provides three distinct, specialized tools:

| Tool | Pipeline & Stack | Purpose | Target Media |
| :--- | :--- | :--- | :--- |
| **1. Web Drawing Studio** *(Canonical)* | React 18, TypeScript, Vite, Konva.js, MediaPipe Tasks Vision (WASM/WebGL) | **Interactive drawing studio**: Real-time 3D pose detection with 8 master canons (Okabayashi, BrokenDraw, Woodward, Tiner, etc.), gravitational plumb line, Conté red rhythms, manual freeform drawing palette, 100% native resolution, and unrestricted cropping. | Human figures in photos and video frames (`http://localhost:5173`) |
| **2. Pose Shape Composite** | Python 3, MediaPipe Pose Landmarker, Pillow, OpenCV | **CLI side-by-side mannequin compositor**: Detects 33 landmarks and flush-anchors pre-cut transparent PNG body shape assets (`assets/male/` or `assets/female/`) in anatomical z-order on a clean comparison canvas. | Full-body figure photos (`pose_shape_composite.py` / `run_pose_test.bat`) |
| **3. Universal Object Shape Detector** | Python 3, OpenCV (contour morphology, Hu moments, convex hull) | **Still-life contour primitive fitter**: Detects geometric primitives (spheres, boxes, cylinders, wedges, ovals) on inanimate objects and reference props. **NOT for isolating human figures in photographic scenes**. | Still lifes, drawing props, geometric objects (`sample_objects.png`) |

---

## 2. Tool 1: Interactive Figure Drawing Web Studio (Canonical)

The primary application is an interactive, browser-based digital art studio.

### Key Features:
- **8 Master Construction Canons**: Switch between Kensuke Okabayashi (connected torso-limb mannequin), BrokenDraw / Tieran (3 big perspective boxes with ear, sternum tie, and sacral landmarks), Ryan Woodward (Conté crayon red gesture sweeps & head-to-ankle gravity lines), Ron Tiner (suprasternal notch plumb line & dynamic balance engine), Andrew Loomis (cranium sphere & jaw planes), George Bridgman (interlocking wedges), Michael Hampton, and Hybrid mode.
- **3D-to-2D Volumetric Form Fitting**: Uses metric 3D landmarks (in meters) to compute 3D tilt angles, limb inclinations, and perspective foreshortening.
- **Perspective Cross-Contour Curves**: Automatically projects curved cross-contour ellipses on foreshortened limbs, showing the student cylindrical volume orientation.
- **Body-Part Isolation**: Filter by any combination of body parts: Full Figure, Face / Head, Torso, Arms, Legs, Hands, Feet.
- **Manual Mode & Drawing Palette**:
  - Full drawing tools: Select (`V`), Box (`R`), Circle (`C`), Oval (`O`), Cylinder (`Y`), Line (`L`).
  - 1-click starter presets (`+Box`, `+Circle`, `+Oval`, `+Cylinder`, `Drop Starter Mannequin`).
  - Transform gizmos for translation, rotation, and 8-point scaling with multi-step Undo/Redo (`Ctrl+Z` / `Ctrl+Y`).
- **High-Resolution Export**: Export transparent PNGs at native image resolution or clean scalable vector SVGs.
- **Video Scrubbing & Tracking**: Scrub MP4, WebM, and MOV videos frame-by-frame with Exponential Moving Average (EMA) jitter smoothing.
- **Client-Side Processing & Privacy**: All video and image analysis executes client-side on your device. No user images or videos are ever uploaded to a server.
  *(Note: An active internet connection is required on first launch to download the MediaPipe pose model binary and WebAssembly runtimes from official CDNs).*

### Web Studio Setup & Running:
```bash
# 1. Install Node dependencies
npm install

# 2. Start local development server
npm run dev
```
Open your browser to `http://localhost:5173`.

To build for production:
```bash
npm run build
npm run preview
```

---

## 3. Tool 2: Pose Shape Composite Mannequin Pipeline (Python CLI)

A standalone Python pipeline that takes a reference photograph and a folder of pre-cut transparent PNG shape assets (male or female templates), detects the 33 body landmarks locally, calculates segment lengths and angles, flush-anchors the shapes to joints, and renders a side-by-side composite comparison image.

### Pipeline Highlights:
- **Zero Generative AI**: 100% deterministic geometry (Lanczos affine scaling, rotation around joint pivots, sub-pixel flush attachment).
- **100% Local Inference**: Uses MediaPipe Pose (`pose_landmarker_full.task`). On first run, it caches the model in `models/`. All subsequent runs work completely offline.
- **Anatomical Z-Ordering**: Shapes layer back-to-front (Neck $\to$ Pelvis $\to$ Torso $\to$ Legs $\to$ Head $\to$ Arms $\to$ Forearms $\to$ Hands/Feet).
- **Occlusion Handling**: Low-confidence joints (< 0.45) are flagged and badged rather than guessed.
- **Gender Auto-Detection**: Automatically detects `assets/male` vs `assets/female` or infers gender from shoulder-to-hip ratio.

### Python Installation:
```bash
# Install Python dependencies
pip install -r requirements.txt
```

### Running Tool 2:
```bash
# 1. Generate sample transparent PNG shape templates (if you don't have cutouts yet):
python pose_shape_composite.py --create-sample-assets

# 2. Run composite on any photo:
python pose_shape_composite.py reference.jpg assets/male -o output_composite.png

# 3. Quick drag-and-drop runner (Windows):
# Drag any photo directly onto run_pose_test.bat in File Explorer!
```

---

## 4. Tool 3: Still Life & Prop Geometric Shape Detector (OpenCV CLI)

An OpenCV contour-analysis tool that analyzes **inanimate still life objects, drawing props, and geometric items** (e.g. `sample_objects.png`), extracts salient contours and landmarks, and fits primitive 2D/3D shapes (spheres, boxes, cylinders, ovals, wedges).

> [!IMPORTANT]
> **Scope Notice**: This tool is designed for **still life and drawing props**, NOT for isolating human figures in photographic scenes. In photographic scenes with clothing folds, textures, and background clutter, contour thresholding does not produce single anatomical body part contours. For human figure drawing, use **Tool 1 (Web Studio)** or **Tool 2 (Pose Shape Composite)**.

### Running Tool 3 on Still Life / Props:
```bash
# Run on sample drawing objects:
python detect_shapes.py sample_objects.png

# Export annotated image, transparent overlay, vector SVG, and JSON:
python detect_shapes.py sample_objects.png -o annotated.png --overlay overlay.png --svg vector.svg --json metadata.json
```

### Programmatic Python API:
```python
import cv2
from shape_detector import ShapeDetector

# Initialize detector
detector = ShapeDetector(min_area=300.0, max_shapes=20)

# Process any still life or object image
image = cv2.imread("sample_objects.png")
result = detector.process_image(image)

# Access detected geometric forms
for shape in result.shapes:
    print(f"Detected {shape.type.value} at ({shape.center_x:.1f}, {shape.center_y:.1f})")
    print(f"  Size: {shape.width:.1f} x {shape.height:.1f} | Angle: {shape.angle:.1f} deg | Confidence: {shape.confidence:.2f}")

# Render annotated overlay
annotated_img = detector.render_overlay(image, result, transparent_bg=False)
cv2.imwrite("annotated.png", annotated_img)
```

---

## 5. Automated Tests

FormMaster maintains a comprehensive automated test suite across both TypeScript and Python:

```bash
# Run TypeScript / Vitest test suite
npm test

# Run Python unit tests
python -m unittest discover tests
```

### Test Coverage (Regenerated from test run):
- **Vitest Suite (44 tests across 9 test files)**:
  - `src/test/canvas_context.test.ts` (2 tests): Native 2D canvas context extraction and image smoothing regression test.
  - `src/test/manual_mode.test.ts` (7 tests): Manual shape creation, category assignment, duplication, deletion, transform state.
  - `src/test/geometry.test.ts` (15 tests): 3D vector math, pitch angles, Loomis cranium & jaw fitting, ribcage & pelvic blocks, foreshortened cross-contours.
  - `src/test/heuristics.test.ts` (4 tests): Empty detection warnings, multi-person crowd detection, low confidence alerts.
  - `src/test/state.test.ts` (4 tests): Persistence of manual transformations, palette shapes, reset to auto-detected geometry.
  - `src/test/edge_cases.test.ts` (5 tests): Heavy occlusion, extreme crouching poses, corrupted inputs, 4K canvases.
  - `src/test/export.test.ts` (3 tests): Valid SVG XML markup and viewport scaling.
  - `src/test/performance.test.ts` (2 tests): Sub-15ms 3D primitive fitting speed.
  - `src/test/video.test.ts` (2 tests): Exponential moving average (EMA) temporal jitter smoothing.
- **Python Suite (6 tests across 1 test file)**:
  - `tests/test_shape_detector.py` (6 tests): Mathematical validation for circles, oriented bounding boxes, cylinders with cross-contours, landmark extraction, and SVG/JSON exporters.

---

## 6. Prior Art & Attribution

| Prior Art / Library | Role & Attribution |
| :--- | :--- |
| **Google MediaPipe Tasks Vision** | Permissive Apache-2.0 pose detection model (`@mediapipe/tasks-vision`) used for 33 landmark points and metric 3D world coordinates. |
| **Kensuke Okabayashi (*Figure Drawing For Dummies*)** | Connected anatomical cylinder and sphere mannequin construction. |
| **BrokenDraw / Tieran (*25 Drawing Exercises*)** | Level 4 box figures (cranium, thorax, pelvis), planar ear landmark, sternum tie, and sacral triangle. |
| **Ryan Woodward (*Gesture Drawing*)** | Conté crayon whole-body red rhythm curves and primary head-to-supporting-ankle gravity sweeps. |
| **Ron Tiner (*Figure Drawing Without a Model*)** | Center of Gravity Plumb Line dropped from suprasternal notch and dynamic balance analysis. |
| **Andrew Loomis (*Figure Drawing for All It's Worth*)** | Cranium sphere and jaw plane proportion formulas, thoracic egg mass, and 8-head proportional reference. |
| **George Bridgman (*Constructive Anatomy*)** | Interlocking block and wedge concepts for torso, pelvis, hands, and feet; cross-contour perspective arcs. |
| **Konva.js** | MIT-licensed 2D canvas interaction engine used for object selection, 8-point scaling handles, and rotation anchors. |
