import { NormalizedLandmark, WorldLandmark, PoseLandmarkIndex } from '../types/pose';
import { ConstructionPrimitive, BodyPartCategory } from '../types/shapes';
import { Vector3, Point2D, Point3D } from './vector3';
import { Proportions } from './proportions';

interface LimbSegmentDef {
  id: string;
  name: string;
  bodyPart: BodyPartCategory;
  startIndex: PoseLandmarkIndex;
  endIndex: PoseLandmarkIndex;
  thicknessRatio: number;
  strokeColor: string;
  fillColor: string;
}

const LIMB_DEFINITIONS: LimbSegmentDef[] = [
  // Arms
  {
    id: 'primitive-right-upper-arm',
    name: 'Right Upper Arm (Cylinder)',
    bodyPart: 'arms',
    startIndex: PoseLandmarkIndex.RIGHT_SHOULDER,
    endIndex: PoseLandmarkIndex.RIGHT_ELBOW,
    thicknessRatio: Proportions.UPPER_ARM_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.armsStroke,
    fillColor: Proportions.COLORS.armsFill,
  },
  {
    id: 'primitive-right-forearm',
    name: 'Right Forearm (Cylinder)',
    bodyPart: 'arms',
    startIndex: PoseLandmarkIndex.RIGHT_ELBOW,
    endIndex: PoseLandmarkIndex.RIGHT_WRIST,
    thicknessRatio: Proportions.FOREARM_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.armsStroke,
    fillColor: Proportions.COLORS.armsFill,
  },
  {
    id: 'primitive-left-upper-arm',
    name: 'Left Upper Arm (Cylinder)',
    bodyPart: 'arms',
    startIndex: PoseLandmarkIndex.LEFT_SHOULDER,
    endIndex: PoseLandmarkIndex.LEFT_ELBOW,
    thicknessRatio: Proportions.UPPER_ARM_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.armsStroke,
    fillColor: Proportions.COLORS.armsFill,
  },
  {
    id: 'primitive-left-forearm',
    name: 'Left Forearm (Cylinder)',
    bodyPart: 'arms',
    startIndex: PoseLandmarkIndex.LEFT_ELBOW,
    endIndex: PoseLandmarkIndex.LEFT_WRIST,
    thicknessRatio: Proportions.FOREARM_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.armsStroke,
    fillColor: Proportions.COLORS.armsFill,
  },
  // Legs
  {
    id: 'primitive-right-thigh',
    name: 'Right Thigh (Cylinder)',
    bodyPart: 'legs',
    startIndex: PoseLandmarkIndex.RIGHT_HIP,
    endIndex: PoseLandmarkIndex.RIGHT_KNEE,
    thicknessRatio: Proportions.THIGH_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.legsStroke,
    fillColor: Proportions.COLORS.legsFill,
  },
  {
    id: 'primitive-right-calf',
    name: 'Right Calf (Cylinder)',
    bodyPart: 'legs',
    startIndex: PoseLandmarkIndex.RIGHT_KNEE,
    endIndex: PoseLandmarkIndex.RIGHT_ANKLE,
    thicknessRatio: Proportions.CALF_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.legsStroke,
    fillColor: Proportions.COLORS.legsFill,
  },
  {
    id: 'primitive-left-thigh',
    name: 'Left Thigh (Cylinder)',
    bodyPart: 'legs',
    startIndex: PoseLandmarkIndex.LEFT_HIP,
    endIndex: PoseLandmarkIndex.LEFT_KNEE,
    thicknessRatio: Proportions.THIGH_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.legsStroke,
    fillColor: Proportions.COLORS.legsFill,
  },
  {
    id: 'primitive-left-calf',
    name: 'Left Calf (Cylinder)',
    bodyPart: 'legs',
    startIndex: PoseLandmarkIndex.LEFT_KNEE,
    endIndex: PoseLandmarkIndex.LEFT_ANKLE,
    thicknessRatio: Proportions.CALF_THICKNESS_RATIO,
    strokeColor: Proportions.COLORS.legsStroke,
    fillColor: Proportions.COLORS.legsFill,
  },
];

export function fitLimbPrimitives(
  landmarks: NormalizedLandmark[],
  worldLandmarks: WorldLandmark[],
  imageWidth: number,
  imageHeight: number
): ConstructionPrimitive[] {
  const primitives: ConstructionPrimitive[] = [];

  for (const def of LIMB_DEFINITIONS) {
    const startLm = landmarks[def.startIndex];
    const endLm = landmarks[def.endIndex];

    // Check landmark availability & visibility
    if (!startLm || !endLm) continue;
    if ((startLm.visibility !== undefined && startLm.visibility < 0.35) ||
        (endLm.visibility !== undefined && endLm.visibility < 0.35)) {
      continue;
    }

    const startPx: Point2D = { x: startLm.x * imageWidth, y: startLm.y * imageHeight };
    const endPx: Point2D = { x: endLm.x * imageWidth, y: endLm.y * imageHeight };

    const length2D = Vector3.distance2D(startPx, endPx);
    if (length2D < 8) continue; // Degenerate segment

    const centerPx: Point2D = {
      x: (startPx.x + endPx.x) / 2,
      y: (startPx.y + endPx.y) / 2,
    };

    // 2D angle of segment
    const angleDeg = Vector3.angle2DDegrees(startPx, endPx);

    // 3D world landmark analysis for foreshortening
    const start3D: Point3D = worldLandmarks[def.startIndex] ?? { x: 0, y: 0, z: startLm.z };
    const end3D: Point3D = worldLandmarks[def.endIndex] ?? { x: 0, y: 0, z: endLm.z };

    // Foreshortening pitch angle
    const pitchDeg = Vector3.pitchDegrees(start3D, end3D);
    const meanZ = (startLm.z + endLm.z) / 2;

    // Limb thickness is proportional to apparent length plus thickness scaling for foreshortening
    const foreshortenFactor = Math.cos((pitchDeg * Math.PI) / 180);
    // When foreshortened, apparent length shrinks, but thickness remains consistent based on anatomical scaling
    const normalizedLength = length2D / Math.max(0.25, Math.abs(foreshortenFactor));
    const thickness = Math.max(16, normalizedLength * def.thicknessRatio);

    // 1. Cylinder / Capsule Primitive
    const limbPrimitive: ConstructionPrimitive = {
      id: def.id,
      type: 'capsule',
      bodyPart: def.bodyPart,
      name: def.name,
      x: centerPx.x,
      y: centerPx.y,
      width: thickness,
      height: length2D,
      rotation: angleDeg - 90, // 0 deg is oriented vertically
      depthZ: meanZ,
      tiltAngle: pitchDeg,
      strokeColor: def.strokeColor,
      strokeWidth: 2.2,
      fillColor: def.fillColor,
      fillOpacity: 0.16,
      isUserCreated: false,
      isVisible: true,
    };

    primitives.push(limbPrimitive);

    // 2. Foreshortened Cross-Contour Ellipse Arc
    // When cylinder has noticeable inclination (e.g. > 15 degrees depth delta),
    // classical artists draw a cross-contour ellipse to show volume in 3D perspective
    if (Math.abs(pitchDeg) > 12) {
      const contourCenterPx = centerPx;
      const contourWidth = thickness * 0.9;
      // Height of cross-contour ellipse corresponds to angle of view
      const contourHeight = thickness * Math.min(0.8, Math.max(0.18, Math.sin(Math.abs(pitchDeg) * Math.PI / 180)));

      const crossContour: ConstructionPrimitive = {
        id: `${def.id}-cross-contour`,
        type: 'cross_contour',
        bodyPart: def.bodyPart,
        name: `${def.name} Cross-Contour`,
        x: contourCenterPx.x,
        y: contourCenterPx.y,
        width: contourWidth,
        height: contourHeight,
        rotation: angleDeg,
        depthZ: meanZ - 0.02, // slightly in front
        tiltAngle: pitchDeg,
        strokeColor: Proportions.COLORS.crossContour,
        strokeWidth: 1.6,
        fillColor: 'transparent',
        fillOpacity: 0,
        isUserCreated: false,
        isVisible: true,
      };

      primitives.push(crossContour);
    }
  }

  // 3. Okabayashi Mannequin Articulated Ball Joints
  // Ball pivots at shoulders, elbows, hips, knees, and ankles anchor the limbs
  const lShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  let refScale = 120;
  if (lShoulder && rShoulder) {
    const sDist = Vector3.distance2D(
      { x: lShoulder.x * imageWidth, y: lShoulder.y * imageHeight },
      { x: rShoulder.x * imageWidth, y: rShoulder.y * imageHeight }
    );
    if (sDist > 20) refScale = sDist;
  }

  const JOINT_DEFINITIONS = [
    {
      id: 'primitive-right-shoulder-joint',
      name: 'Right Shoulder (Ball Joint)',
      bodyPart: 'arms' as BodyPartCategory,
      index: PoseLandmarkIndex.RIGHT_SHOULDER,
      radiusRatio: 0.20,
      strokeColor: Proportions.COLORS.armsStroke,
      fillColor: Proportions.COLORS.armsFill,
    },
    {
      id: 'primitive-left-shoulder-joint',
      name: 'Left Shoulder (Ball Joint)',
      bodyPart: 'arms' as BodyPartCategory,
      index: PoseLandmarkIndex.LEFT_SHOULDER,
      radiusRatio: 0.20,
      strokeColor: Proportions.COLORS.armsStroke,
      fillColor: Proportions.COLORS.armsFill,
    },
    {
      id: 'primitive-right-elbow-joint',
      name: 'Right Elbow (Ball Joint)',
      bodyPart: 'arms' as BodyPartCategory,
      index: PoseLandmarkIndex.RIGHT_ELBOW,
      radiusRatio: 0.17,
      strokeColor: Proportions.COLORS.armsStroke,
      fillColor: Proportions.COLORS.armsFill,
    },
    {
      id: 'primitive-left-elbow-joint',
      name: 'Left Elbow (Ball Joint)',
      bodyPart: 'arms' as BodyPartCategory,
      index: PoseLandmarkIndex.LEFT_ELBOW,
      radiusRatio: 0.17,
      strokeColor: Proportions.COLORS.armsStroke,
      fillColor: Proportions.COLORS.armsFill,
    },
    {
      id: 'primitive-right-hip-joint',
      name: 'Right Hip (Ball Joint)',
      bodyPart: 'legs' as BodyPartCategory,
      index: PoseLandmarkIndex.RIGHT_HIP,
      radiusRatio: 0.22,
      strokeColor: Proportions.COLORS.legsStroke,
      fillColor: Proportions.COLORS.legsFill,
    },
    {
      id: 'primitive-left-hip-joint',
      name: 'Left Hip (Ball Joint)',
      bodyPart: 'legs' as BodyPartCategory,
      index: PoseLandmarkIndex.LEFT_HIP,
      radiusRatio: 0.22,
      strokeColor: Proportions.COLORS.legsStroke,
      fillColor: Proportions.COLORS.legsFill,
    },
    {
      id: 'primitive-right-knee-joint',
      name: 'Right Knee (Ball Joint)',
      bodyPart: 'legs' as BodyPartCategory,
      index: PoseLandmarkIndex.RIGHT_KNEE,
      radiusRatio: 0.19,
      strokeColor: Proportions.COLORS.legsStroke,
      fillColor: Proportions.COLORS.legsFill,
    },
    {
      id: 'primitive-left-knee-joint',
      name: 'Left Knee (Ball Joint)',
      bodyPart: 'legs' as BodyPartCategory,
      index: PoseLandmarkIndex.LEFT_KNEE,
      radiusRatio: 0.19,
      strokeColor: Proportions.COLORS.legsStroke,
      fillColor: Proportions.COLORS.legsFill,
    },
    {
      id: 'primitive-right-ankle-joint',
      name: 'Right Ankle (Ball Joint)',
      bodyPart: 'legs' as BodyPartCategory,
      index: PoseLandmarkIndex.RIGHT_ANKLE,
      radiusRatio: 0.15,
      strokeColor: Proportions.COLORS.legsStroke,
      fillColor: Proportions.COLORS.legsFill,
    },
    {
      id: 'primitive-left-ankle-joint',
      name: 'Left Ankle (Ball Joint)',
      bodyPart: 'legs' as BodyPartCategory,
      index: PoseLandmarkIndex.LEFT_ANKLE,
      radiusRatio: 0.15,
      strokeColor: Proportions.COLORS.legsStroke,
      fillColor: Proportions.COLORS.legsFill,
    },
  ];

  for (const jDef of JOINT_DEFINITIONS) {
    const jLm = landmarks[jDef.index];
    if (!jLm || (jLm.visibility !== undefined && jLm.visibility < 0.35)) continue;

    const jPx: Point2D = { x: jLm.x * imageWidth, y: jLm.y * imageHeight };
    const jointRadius = Math.max(9, refScale * jDef.radiusRatio);
    const jointDiameter = jointRadius * 2;

    const jointPrimitive: ConstructionPrimitive = {
      id: jDef.id,
      type: 'circle',
      bodyPart: jDef.bodyPart,
      name: jDef.name,
      x: jPx.x,
      y: jPx.y,
      width: jointDiameter,
      height: jointDiameter,
      rotation: 0,
      depthZ: jLm.z - 0.015,
      strokeColor: jDef.strokeColor,
      strokeWidth: 2.2,
      fillColor: jDef.fillColor,
      fillOpacity: 0.28,
      isUserCreated: false,
      isVisible: true,
    };

    primitives.push(jointPrimitive);
  }

  return primitives;
}
