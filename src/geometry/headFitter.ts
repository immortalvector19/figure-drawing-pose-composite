import { NormalizedLandmark, WorldLandmark, PoseLandmarkIndex } from '../types/pose';
import { ConstructionPrimitive } from '../types/shapes';
import { Vector3, Point2D, Point3D } from './vector3';
import { Proportions } from './proportions';

export function fitHeadPrimitives(
  landmarks: NormalizedLandmark[],
  worldLandmarks: WorldLandmark[],
  imageWidth: number,
  imageHeight: number
): ConstructionPrimitive[] {
  const nose = landmarks[PoseLandmarkIndex.NOSE];
  const leftEar = landmarks[PoseLandmarkIndex.LEFT_EAR];
  const rightEar = landmarks[PoseLandmarkIndex.RIGHT_EAR];
  const leftEye = landmarks[PoseLandmarkIndex.LEFT_EYE];
  const rightEye = landmarks[PoseLandmarkIndex.RIGHT_EYE];
  const mouthLeft = landmarks[PoseLandmarkIndex.MOUTH_LEFT];
  const mouthRight = landmarks[PoseLandmarkIndex.MOUTH_RIGHT];

  if (!nose && !leftEye && !rightEye) return [];

  // Convert keypoints to pixel space
  const nosePx: Point2D = nose
    ? { x: nose.x * imageWidth, y: nose.y * imageHeight }
    : { x: (imageWidth * 0.5), y: (imageHeight * 0.2) };

  const leftEyePx: Point2D = leftEye
    ? { x: leftEye.x * imageWidth, y: leftEye.y * imageHeight }
    : { x: nosePx.x + 20, y: nosePx.y - 15 };

  const rightEyePx: Point2D = rightEye
    ? { x: rightEye.x * imageWidth, y: rightEye.y * imageHeight }
    : { x: nosePx.x - 20, y: nosePx.y - 15 };

  const leftEarPx: Point2D = leftEar
    ? { x: leftEar.x * imageWidth, y: leftEar.y * imageHeight }
    : { x: nosePx.x + 50, y: nosePx.y - 10 };

  const rightEarPx: Point2D = rightEar
    ? { x: rightEar.x * imageWidth, y: rightEar.y * imageHeight }
    : { x: nosePx.x - 50, y: nosePx.y - 10 };

  const hasLeftEar = !!leftEar && (leftEar.visibility === undefined || leftEar.visibility > 0.25);
  const hasRightEar = !!rightEar && (rightEar.visibility === undefined || rightEar.visibility > 0.25);

  let headScale = 60;
  let headTilt = 0;

  if (hasLeftEar && hasRightEar) {
    const earDist = Vector3.distance2D(leftEarPx, rightEarPx);
    headScale = Math.max(earDist * 1.25, 35);
    headTilt = Vector3.angle2DDegrees(rightEarPx, leftEarPx);
  } else if (hasLeftEar) {
    const dist = Vector3.distance2D(nosePx, leftEarPx);
    headScale = Math.max(dist * 2.2, 35);
    headTilt = Vector3.angle2DDegrees(nosePx, leftEarPx) - 90;
  } else if (hasRightEar) {
    const dist = Vector3.distance2D(nosePx, rightEarPx);
    headScale = Math.max(dist * 2.2, 35);
    headTilt = Vector3.angle2DDegrees(rightEarPx, nosePx) - 90;
  } else if (leftEye && rightEye) {
    const eyeDist = Vector3.distance2D(leftEyePx, rightEyePx);
    headScale = Math.max(eyeDist * 2.8, 35);
    headTilt = Vector3.angle2DDegrees(rightEyePx, leftEyePx);
  }

  // Mid-eyes & Mid-ears
  const midEyesPx: Point2D = {
    x: (leftEyePx.x + rightEyePx.x) / 2,
    y: (leftEyePx.y + rightEyePx.y) / 2,
  };
  const midEarsPx: Point2D = {
    x: (leftEarPx.x + rightEarPx.x) / 2,
    y: (leftEarPx.y + rightEarPx.y) / 2,
  };

  // Cranium center is slightly above and behind the eyes
  const craniumCenterPx: Point2D = {
    x: midEyesPx.x * 0.5 + midEarsPx.x * 0.5,
    y: Math.min(midEyesPx.y, midEarsPx.y) - headScale * 0.20,
  };

  // 3D pitch from world landmarks (ears vs nose)
  const nose3D: Point3D = worldLandmarks[PoseLandmarkIndex.NOSE] ?? { x: 0, y: 0, z: 0 };
  const leftEar3D: Point3D = worldLandmarks[PoseLandmarkIndex.LEFT_EAR] ?? { x: 0, y: 0, z: 0 };
  const rightEar3D: Point3D = worldLandmarks[PoseLandmarkIndex.RIGHT_EAR] ?? { x: 0, y: 0, z: 0 };
  const midEars3D = Vector3.midpoint(leftEar3D, rightEar3D);
  const pitchAngle = Vector3.pitchDegrees(midEars3D, nose3D);

  const meanZ = ((nose?.z ?? 0) + (leftEar?.z ?? 0) + (rightEar?.z ?? 0)) / 3;

  // 1. Cranium Sphere / Oval
  const craniumWidth = headScale * 0.95;
  const craniumHeight = headScale * 1.05;

  const craniumPrimitive: ConstructionPrimitive = {
    id: 'primitive-cranium',
    type: 'oval',
    bodyPart: 'face',
    name: 'Cranium (Loomis Sphere)',
    x: craniumCenterPx.x,
    y: craniumCenterPx.y,
    width: craniumWidth,
    height: craniumHeight,
    rotation: headTilt,
    depthZ: meanZ,
    tiltAngle: pitchAngle,
    strokeColor: Proportions.COLORS.headStroke,
    strokeWidth: 3.5,
    fillColor: Proportions.COLORS.headFill,
    fillOpacity: 0.24,
    isUserCreated: false,
    isVisible: true,
  };

  // 2. Jaw Plane / Wedge (Loomis Face Block)
  const mouthMidPx: Point2D = {
    x: ((mouthLeft?.x ?? nose?.x ?? 0.5) + (mouthRight?.x ?? nose?.x ?? 0.5)) * 0.5 * imageWidth,
    y: ((mouthLeft?.y ?? nose?.y ?? 0.2) + (mouthRight?.y ?? nose?.y ?? 0.2)) * 0.5 * imageHeight,
  };
  const chinY = mouthMidPx.y + headScale * 0.26;
  const jawCenterPx: Point2D = {
    x: (nosePx.x + mouthMidPx.x) / 2,
    y: (mouthMidPx.y + chinY) / 2,
  };

  const jawWidth = headScale * 0.72;
  const jawHeight = headScale * 0.65;

  const jawPrimitive: ConstructionPrimitive = {
    id: 'primitive-jaw-wedge',
    type: 'box',
    bodyPart: 'face',
    name: 'Face Plane (Jaw Wedge)',
    x: jawCenterPx.x,
    y: jawCenterPx.y,
    width: jawWidth,
    height: jawHeight,
    rotation: headTilt,
    depthZ: meanZ - 0.05, // slightly in front of cranium
    tiltAngle: pitchAngle,
    strokeColor: Proportions.COLORS.headStroke,
    strokeWidth: 3.0,
    fillColor: Proportions.COLORS.headFill,
    fillOpacity: 0.18,
    isUserCreated: false,
    isVisible: true,
  };

  // 3. Neck Cylinder (Okabayashi Mannequin Neck Connector)
  // Connects skull base / jaw directly into the top of the ribcage / shoulder girdle
  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];

  let neckEndPx: Point2D;
  if (leftShoulder && rightShoulder) {
    neckEndPx = {
      x: ((leftShoulder.x + rightShoulder.x) / 2) * imageWidth,
      y: ((leftShoulder.y + rightShoulder.y) / 2) * imageHeight,
    };
  } else {
    const rad = (headTilt + 90) * (Math.PI / 180);
    neckEndPx = {
      x: jawCenterPx.x + Math.cos(rad) * headScale * 0.45,
      y: jawCenterPx.y + Math.sin(rad) * headScale * 0.45,
    };
  }

  const neckStartPx: Point2D = {
    x: jawCenterPx.x * 0.65 + craniumCenterPx.x * 0.35,
    y: jawCenterPx.y + jawHeight * 0.1,
  };

  const neckLength = Math.max(16, Vector3.distance2D(neckStartPx, neckEndPx));
  const neckCenterPx: Point2D = {
    x: (neckStartPx.x + neckEndPx.x) / 2,
    y: (neckStartPx.y + neckEndPx.y) / 2,
  };
  const neckAngle = Vector3.angle2DDegrees(neckStartPx, neckEndPx);
  const neckWidth = Math.max(14, headScale * 0.42);

  const neckPrimitive: ConstructionPrimitive = {
    id: 'primitive-neck',
    type: 'capsule',
    bodyPart: 'face',
    name: 'Neck (Cervical Cylinder)',
    x: neckCenterPx.x,
    y: neckCenterPx.y,
    width: neckWidth,
    height: neckLength,
    rotation: neckAngle - 90,
    depthZ: meanZ + 0.02, // slightly behind chin/jaw
    tiltAngle: pitchAngle,
    strokeColor: Proportions.COLORS.headStroke,
    strokeWidth: 2.8,
    fillColor: Proportions.COLORS.headFill,
    fillOpacity: 0.18,
    isUserCreated: false,
    isVisible: true,
  };

  return [craniumPrimitive, jawPrimitive, neckPrimitive];
}

