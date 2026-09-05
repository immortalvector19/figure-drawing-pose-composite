import { NormalizedLandmark, WorldLandmark, PoseLandmarkIndex } from '../types/pose';
import { ConstructionPrimitive } from '../types/shapes';
import { Vector3, Point2D, Point3D } from './vector3';
import { Proportions } from './proportions';

export function fitTorsoPrimitives(
  landmarks: NormalizedLandmark[],
  worldLandmarks: WorldLandmark[],
  imageWidth: number,
  imageHeight: number
): ConstructionPrimitive[] {
  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
  const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];

  if (!leftShoulder || !rightShoulder) return [];

  const leftShoulderPx: Point2D = { x: leftShoulder.x * imageWidth, y: leftShoulder.y * imageHeight };
  const rightShoulderPx: Point2D = { x: rightShoulder.x * imageWidth, y: rightShoulder.y * imageHeight };

  const shoulderDistPx = Vector3.distance2D(leftShoulderPx, rightShoulderPx);
  const midShoulderPx: Point2D = {
    x: (leftShoulderPx.x + rightShoulderPx.x) / 2,
    y: (leftShoulderPx.y + rightShoulderPx.y) / 2,
  };

  // Shoulder axis angle (roll)
  const shoulderAngle = Vector3.angle2DDegrees(rightShoulderPx, leftShoulderPx);

  // Ribcage center is below mid-shoulders
  const hasHips = !!(leftHip && rightHip);
  const leftHipPx: Point2D = hasHips ? { x: leftHip.x * imageWidth, y: leftHip.y * imageHeight } : { x: leftShoulderPx.x, y: leftShoulderPx.y + shoulderDistPx * 1.5 };
  const rightHipPx: Point2D = hasHips ? { x: rightHip.x * imageWidth, y: rightHip.y * imageHeight } : { x: rightShoulderPx.x, y: rightShoulderPx.y + shoulderDistPx * 1.5 };

  const midHipPx: Point2D = {
    x: (leftHipPx.x + rightHipPx.x) / 2,
    y: (leftHipPx.y + rightHipPx.y) / 2,
  };

  const spineVectorPx = {
    x: midHipPx.x - midShoulderPx.x,
    y: midHipPx.y - midShoulderPx.y,
  };
  const torsoHeightPx = Math.max(Vector3.length2D(spineVectorPx), shoulderDistPx * 1.2);

  // Ribcage is the top 60% of the torso
  const ribcageCenterPx: Point2D = {
    x: midShoulderPx.x + spineVectorPx.x * 0.32,
    y: midShoulderPx.y + spineVectorPx.y * 0.32,
  };

  const ribcageWidth = shoulderDistPx * 0.92;
  const ribcageHeight = torsoHeightPx * 0.58;

  // 3D pitch and tilt of ribcage
  const leftShoulder3D: Point3D = worldLandmarks[PoseLandmarkIndex.LEFT_SHOULDER] ?? { x: 0, y: 0, z: 0 };
  const rightShoulder3D: Point3D = worldLandmarks[PoseLandmarkIndex.RIGHT_SHOULDER] ?? { x: 0, y: 0, z: 0 };
  const midShoulder3D = Vector3.midpoint(leftShoulder3D, rightShoulder3D);

  const leftHip3D: Point3D = worldLandmarks[PoseLandmarkIndex.LEFT_HIP] ?? { x: 0, y: 0, z: 0 };
  const rightHip3D: Point3D = worldLandmarks[PoseLandmarkIndex.RIGHT_HIP] ?? { x: 0, y: 0, z: 0 };
  const midHip3D = Vector3.midpoint(leftHip3D, rightHip3D);

  const spineTiltAngle = Vector3.pitchDegrees(midHip3D, midShoulder3D);
  const meanTorsoZ = (leftShoulder.z + rightShoulder.z) / 2;

  // 1. Ribcage Ovoid / Block
  const ribcagePrimitive: ConstructionPrimitive = {
    id: 'primitive-ribcage',
    type: 'oval',
    bodyPart: 'torso',
    name: 'Ribcage (Thoracic Egg)',
    x: ribcageCenterPx.x,
    y: ribcageCenterPx.y,
    width: ribcageWidth,
    height: ribcageHeight,
    rotation: shoulderAngle,
    depthZ: meanTorsoZ,
    tiltAngle: spineTiltAngle,
    strokeColor: Proportions.COLORS.torsoStroke,
    strokeWidth: 2.5,
    fillColor: Proportions.COLORS.torsoFill,
    fillOpacity: 0.16,
    isUserCreated: false,
    isVisible: true,
  };

  const primitives: ConstructionPrimitive[] = [ribcagePrimitive];

  // 2. Pelvic Block (if hips detected)
  if (hasHips) {
    const hipDistPx = Vector3.distance2D(leftHipPx, rightHipPx);
    const hipAngle = Vector3.angle2DDegrees(rightHipPx, leftHipPx);
    const pelvisCenterPx: Point2D = {
      x: midHipPx.x,
      y: midHipPx.y + hipDistPx * 0.12,
    };

    const pelvisWidth = hipDistPx * 1.15;
    const pelvisHeight = torsoHeightPx * 0.38;
    const meanPelvisZ = (leftHip.z + rightHip.z) / 2;

    const pelvisPrimitive: ConstructionPrimitive = {
      id: 'primitive-pelvis',
      type: 'box',
      bodyPart: 'torso',
      name: 'Pelvis (Pelvic Block)',
      x: pelvisCenterPx.x,
      y: pelvisCenterPx.y,
      width: pelvisWidth,
      height: pelvisHeight,
      rotation: hipAngle,
      depthZ: meanPelvisZ,
      strokeColor: Proportions.COLORS.pelvisStroke,
      strokeWidth: 2.5,
      fillColor: Proportions.COLORS.pelvisFill,
      fillOpacity: 0.16,
      isUserCreated: false,
      isVisible: true,
    };

    // 2. Stomach / Abdomen Mass (Okabayashi Waist Column)
    // "Keeping the stomach simple" - bridges the ribcage egg to the pelvic wedge
    const stomachCenterPx: Point2D = {
      x: ribcageCenterPx.x * 0.45 + pelvisCenterPx.x * 0.55,
      y: ribcageCenterPx.y * 0.45 + pelvisCenterPx.y * 0.55,
    };
    const stomachWidth = Math.min(ribcageWidth, pelvisWidth) * 0.78;
    const stomachHeight = Math.max(20, Vector3.distance2D(ribcageCenterPx, pelvisCenterPx) * 0.55);

    const stomachPrimitive: ConstructionPrimitive = {
      id: 'primitive-stomach',
      type: 'capsule',
      bodyPart: 'torso',
      name: 'Stomach (Abdominal Column)',
      x: stomachCenterPx.x,
      y: stomachCenterPx.y,
      width: stomachWidth,
      height: stomachHeight,
      rotation: (shoulderAngle + hipAngle) / 2,
      depthZ: (meanTorsoZ + meanPelvisZ) / 2,
      tiltAngle: spineTiltAngle,
      strokeColor: Proportions.COLORS.torsoStroke,
      strokeWidth: 2.4,
      fillColor: Proportions.COLORS.torsoFill,
      fillOpacity: 0.15,
      isUserCreated: false,
      isVisible: true,
    };

    primitives.push(stomachPrimitive);
    primitives.push(pelvisPrimitive);

    // 3. Gestural Line of Action (Spine curve through ribcage & pelvis)
    const lineOfActionPrimitive: ConstructionPrimitive = {
      id: 'primitive-line-of-action',
      type: 'line_of_action',
      bodyPart: 'torso',
      name: 'Line of Action (Spine Rhythm)',
      x: midShoulderPx.x,
      y: midShoulderPx.y,
      width: Math.abs(midHipPx.x - midShoulderPx.x),
      height: Math.abs(midHipPx.y - midShoulderPx.y),
      rotation: 0,
      depthZ: (meanTorsoZ + meanPelvisZ) / 2 + 0.02,
      strokeColor: '#f43f5e',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      points: [
        midShoulderPx.x, midShoulderPx.y,
        ribcageCenterPx.x, ribcageCenterPx.y,
        midHipPx.x, midHipPx.y
      ],
      isUserCreated: false,
      isVisible: true,
    };

    primitives.push(lineOfActionPrimitive);
  }

  return primitives;
}
