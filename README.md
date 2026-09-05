# FormMaster: 3D Figure Construction Drawing Reference

> A client-side web application for figure drawing students that strips photos and videos of human figures down to fundamental 3D construction forms — spheres, ovals, cylinders, boxes, and foreshortened cross-contours à la Andrew Loomis, George Bridgman, and Frank Reilly.

---

## 1. Concept & Problem Solved

When figure drawing students look at reference photos or life models, they are often overwhelmed by photographic surface detail (skin tones, muscle striations, complex lighting, cast shadows). Academic figure drawing pedagogy teaches students to first **block in the figure using basic 3D geometric masses**:
- **Cranium**: Spherical vault
- **Face Plane**: Tapered jaw wedge
- **Ribcage**: Thoracic egg or rounded box tilted in space
- **Pelvis**: Flattened pelvic bowl or box
- **Limbs**: Tapered cylinders (capsules) with perspective cross-contour ellipses indicating whether limbs advance toward or recede from the viewer
- **Extremities**: Wedge blocks for hands and feet
- **Line of Action**: Smooth gestural rhythm through the spine establishing balance and contrapposto

**FormMaster** automatically analyzes any photo or video frame, extracts 33 landmark points and metric 3D coordinates, fits volumetric geometric primitives, and renders an interactive, editable 2D drawing overlay.

---

## 2. Key Features

- **3D-to-2D Volumetric Form Fitting**: Uses real-world metric 3D landmarks (in meters) to compute 3D tilt angles, limb inclinations, and perspective foreshortening.
- **Perspective Cross-Contour Curves**: Automatically projects curved cross-contour ellipses on foreshortened limbs, showing the student the direction of cylindrical volume in space.
- **Body-Part Isolation (Multi-Select)**: Filter by any combination of body parts: Full Figure, Face / Head, Torso, Arms, Legs, Hands, Feet. Includes quick "Solo" isolate buttons.
- **Manual Direct-Manipulation Editing**:
  - Drag, rotate, and scale any generated shape via interactive Konva handles.
  - Delete unwanted shapes (`Delete` / `Backspace` key or button).
  - Add new primitive shapes manually (Circle, Oval, Cylinder, Box) from the artist palette.
  - Full Undo / Redo history stack.
  - "Reset to Auto-detected" button restores original detected forms at any time.
- **Opacity Crossfader**: Smooth slider blending between 100% reference photo and 100% construction overlay.
- **Video Scrubbing & Tracking**:
  - Scrub through MP4, WebM, and MOV videos frame-by-frame.
  - "Convert Frame" captures and extracts forms from any scrubbed timestamp.
  - Optional real-time tracking with Exponential Moving Average (EMA) smoothing to eliminate frame jitter.
- **High-Resolution Export**:
  - **Transparent PNG**: Renders pixel-perfect transparent overlay at the exact native resolution of the original media.
  - **Scalable Vector SVG**: Exports clean `<ellipse>`, `<rect>`, and `<path>` SVG elements ready for Photoshop, Illustrator, Procreate, or Clip Studio Paint.
- **Zero-Friction Presets**: Includes built-in benchmark presets (Contrapposto, Foreshortened Pose, Neutral Standing, Portrait) for immediate testing without uploading files.
- **100% Client-Side Privacy**: Runs completely in the browser using WebAssembly and WebGL via `@mediapipe/tasks-vision`. No images or videos are ever uploaded to a remote server.

---

## 3. Architecture & Tech Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **Computer Vision & 3D Pose**: `@mediapipe/tasks-vision` (BlazePose Wasm / WebGL)
- **Vector Canvas**: `konva` + `react-konva` (HTML5 Canvas 2D scene graph with `Transformer` gizmos)
- **Styling**: Tailwind CSS + Lucide Icons (dark studio theme)
- **Test Runner**: Vitest (26 unit, heuristic, performance, and edge case tests)

### Directory Structure:
```
src/
├── types/          # Pose landmarks & ConstructionPrimitive data models
├── ml/             # MediaPipe singleton, video processor, and heuristics
├── geometry/       # 3D vector math, head, torso, limb, and extremity fitters
├── canvas/         # Konva stage, shape items, and transformer manager
├── state/          # ShapeStore (editing, undo/redo) & FilterStore
├── ui/             # Header, UploadZone, VideoPlayer, BodyPartToggle, ToolPalette, OpacitySlider
├── export/         # Transparent PNG and SVG exporters
├── samplePoses.ts  # Benchmark sample poses for demo and offline test
└── test/           # Vitest suite covering geometry, heuristics, state, video, edge cases
```

---

## 4. Setup & Running Locally

### Prerequisites:
- Node.js (v18+ or v20+ recommended)
- npm or yarn

### Installation:
```bash
# Clone or navigate to directory
cd "model for beginners"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:5173` to start using FormMaster.

### Building for Production:
```bash
npm run build
npm run preview
```

---

## 5. Universal Shape & Landmark Detector (Python CLI & API)

In addition to the interactive web application, FormMaster includes a **universal Python model/script** that analyzes **any arbitrary image** (objects, still lifes, animals, architecture, tools, figures), extracts salient structural landmarks, recognizes primitive geometric forms (spheres, boxes, cylinders, ovals, wedges), and fits/places them directly onto detected objects.

### Running via CLI:
```bash
# Basic run: outputs annotated image with shapes placed directly on objects
python detect_shapes.py path/to/image.jpg

# Full export: annotated image, transparent construction overlay, vector SVG, and JSON
python detect_shapes.py path/to/image.jpg -o annotated.png --overlay overlay.png --svg vector.svg --json metadata.json

# Tuning options:
#   --min-area FLOAT      Filter small background noise (default: 350)
#   --max-shapes INT      Maximum number of shapes to detect (default: 25)
#   --opacity FLOAT       Shape fill transparency (0.0 to 1.0, default: 0.28)
#   --stroke INT          Outline thickness in pixels (default: 3)
#   --no-landmarks        Hide corner/inflection landmark dots
```

### Programmatic Python API:
```python
import cv2
from shape_detector import ShapeDetector, PrimitiveType

# Initialize detector
detector = ShapeDetector(min_area=300.0, max_shapes=20)

# Process any image (NumPy array or file path)
image = cv2.imread("still_life.jpg")
result = detector.process_image(image)

# Access detected geometric forms
for shape in result.shapes:
    print(f"Detected {shape.type.value} at ({shape.center_x:.1f}, {shape.center_y:.1f})")
    print(f"  Size: {shape.width:.1f} x {shape.height:.1f} | Angle: {shape.angle:.1f}°")
    print(f"  Confidence: {shape.confidence:.2f}")

# Access salient landmarks (corners, centroids, inflection points)
for lm in result.landmarks:
    print(f"Landmark [{lm.type.value}] at ({lm.x:.1f}, {lm.y:.1f})")

# Render and save annotated overlay
annotated_img = detector.render_overlay(image, result, transparent_bg=False)
cv2.imwrite("annotated.png", annotated_img)

# Export to SVG or JSON
svg_markup = detector.to_svg(result)
json_data = detector.to_json(result)
```

---

## 6. Running Automated Tests

Run the complete test suite:
```bash
# Frontend web app tests
npm test

# Python universal shape detector tests
python -m unittest discover tests
```

The test suite covers:
- **Geometry & 3D Math (`geometry.test.ts`)**: Vector operations, pitch angles, Loomis cranium & jaw fitting, ribcage & pelvic block fitting, foreshortened cross-contours, painter's algorithm depth sorting.
- **Heuristics & Quality Alerts (`heuristics.test.ts`)**: Empty detection warnings, multi-person crowd detection, low confidence alerts, partial figure detection.
- **State Management (`state.test.ts`)**: Persistence of manual transformations, adding custom palette shapes, deleting shapes, resetting to auto-detected geometry.
- **Video Tracking (`video.test.ts`)**: Exponential moving average (EMA) temporal jitter smoothing.
- **Performance SLA (`performance.test.ts`)**: Sub-15ms 3D primitive fitting speed (< 2000ms SLA).
- **Export Integrity (`export.test.ts`)**: Valid SVG XML markup and viewport scaling.
- **Gauntlet Edge Cases (`edge_cases.test.ts`)**: Heavy occlusion (hidden limbs), extreme crouching poses, corrupted inputs, and 4K resolution canvases.
- **Python Shape Detection Tests (`test_shape_detector.py`)**: Mathematical validation for circles, oriented bounding boxes, cylinders with cross-contours, landmark extraction, and SVG/JSON exporters.

---

## 7. Prior Art & Attribution

| Prior Art / Library | Role & Attribution |
| :--- | :--- |
| **Google MediaPipe Tasks Vision** | Permissive Apache-2.0 pose detection model (`@mediapipe/tasks-vision`) used for 33 landmark points and metric 3D world coordinates. |
| **Andrew Loomis (*Figure Drawing for All It's Worth*)** | Cranium sphere and jaw plane proportion formulas, thoracic egg mass, and 8-head proportional reference. |
| **George Bridgman (*Constructive Anatomy*)** | Interlocking block and wedge concepts for torso, pelvis, hands, and feet; cross-contour perspective arcs for foreshortened cylinders. |
| **Konva.js** | MIT-licensed 2D canvas interaction engine used for object selection, 8-point scaling handles, and rotation anchors. |

---

## 8. Known Limitations (v1 Scope)

1. **Single Primary Subject (Web App)**: v1 focuses on a single clear subject. In multi-person scenes, the system alerts the user and selects the primary figure.
2. **Universal Python Detector**: Optimized for clear object silhouettes and multi-object compositions. Dense, overlapping clutter can be filtered using `--min-area` and `--max-shapes`.
3. **Pedagogical Abstraction vs Medical Accuracy**: Primitives are designed for artist gesture and block-in reference, not clinical or orthotic measurements.
4. **Extreme Low Light / Occlusion**: If more than 70% of a limb is occluded, the algorithm omits that segment rather than guessing. Users can manually add replacement shapes using the "+ Add Cylinder" palette tool.
