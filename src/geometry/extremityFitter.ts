import { NormalizedLandmark, WorldLandmark, PoseLandmarkIndex } from '../types/pose';
import { ConstructionPrimitive } from '../types/shapes';
import { Vector3, Point2D } from './vector3';
import { Proportions } from './proportions';

export function fitExtremityPrimitives(
  landmarks: NormalizedLandmark[],
  _worldLandmarks: WorldLandmark[],
  imageWidth: number,
  imageHeight: number
): ConstructionPrimitive[] {
  const primitives: ConstructionPrimitive[] = [];

  // Hands: Left & Right
  const handDefs = [
    {
      id: 'primitive-right-hand',
      name: 'Right Hand (Wedge Block)',
      wristIdx: PoseLandmarkIndex.RIGHT_WRIST,
      indexIdx: PoseLandmarkIndex.RIGHT_INDEX,
      pinkyIdx: PoseLandmarkIndex.RIGHT_PINKY,
    },
    {
      id: 'primitive-left-hand',
      name: 'Left Hand (Wedge Block)',
      wristIdx: PoseLandmarkIndex.LEFT_WRIST,
      indexIdx: PoseLandmarkIndex.LEFT_INDEX,
      pinkyIdx: PoseLandmarkIndex.LEFT_PINKY,
    }
  ];

  for (const def of handDefs) {
    const wrist = landmarks[def.wristIdx];
    const index = landmarks[def.indexIdx];
    const pinky = landmarks[def.pinkyIdx];

    if (!wrist || !index) continue;
    if ((wrist.visibility !== undefined && wrist.visibility < 0.3) ||
        (index.visibility !== undefined && index.visibility < 0.3)) {
      continue;
    }

    const wristPx: Point2D = { x: wrist.x * imageWidth, y: wrist.y * imageHeight };
    const indexPx: Point2D = { x: index.x * imageWidth, y: index.y * imageHeight };
    const pinkyPx: Point2D = pinky
      ? { x: pinky.x * imageWidth, y: pinky.y * imageHeight }
      : indexPx;

    const knuckleMidPx: Point2D = {
      x: (indexPx.x + pinkyPx.x) / 2,
      y: (indexPx.y + pinkyPx.y) / 2,
    };

    const handLength = Math.max(14, Vector3.distance2D(wristPx, knuckleMidPx) * 1.4);
    const handWidth = Math.max(12, handLength * 0.7);
    const handCenterPx: Point2D = {
      x: (wristPx.x + knuckleMidPx.x) / 2,
      y: (wristPx.y + knuckleMidPx.y) / 2,
    };

    const angleDeg = Vector3.angle2DDegrees(wristPx, knuckleMidPx);

    primitives.push({
      id: def.id,
      type: 'box',
      bodyPart: 'hands',
      name: def.name,
      x: handCenterPx.x,
      y: handCenterPx.y,
      width: handWidth,
      height: handLength,
      rotation: angleDeg - 90,
      depthZ: wrist.z,
      strokeColor: Proportions.COLORS.handsStroke,
      strokeWidth: 2,
      fillColor: Proportions.COLORS.handsFill,
      fillOpacity: 0.16,
      isUserCreated: false,
      isVisible: true,
    });
  }

  // Feet: Left & Right
  const footDefs = [
    {
      id: 'primitive-right-foot',
      name: 'Right Foot (Wedge Block)',
      ankleIdx: PoseLandmarkIndex.RIGHT_ANKLE,
      heelIdx: PoseLandmarkIndex.RIGHT_HEEL,
      toeIdx: PoseLandmarkIndex.RIGHT_FOOT_INDEX,
    },
    {
      id: 'primitive-left-foot',
      name: 'Left Foot (Wedge Block)',
      ankleIdx: PoseLandmarkIndex.LEFT_ANKLE,
      heelIdx: PoseLandmarkIndex.LEFT_HEEL,
      toeIdx: PoseLandmarkIndex.LEFT_FOOT_INDEX,
    }
  ];

  for (const def of footDefs) {
    const ankle = landmarks[def.ankleIdx];
    const heel = landmarks[def.heelIdx];
    const toe = landmarks[def.toeIdx];

    if (!ankle || !toe) continue;
    if ((ankle.visibility !== undefined && ankle.visibility < 0.3) ||
        (toe.visibility !== undefined && toe.visibility < 0.3)) {
      continue;
    }

    const anklePx: Point2D = { x: ankle.x * imageWidth, y: ankle.y * imageHeight };
    const heelPx: Point2D = heel ? { x: heel.x * imageWidth, y: heel.y * imageHeight } : anklePx;
    const toePx: Point2D = { x: toe.x * imageWidth, y: toe.y * imageHeight };

    const footLength = Math.max(16, Vector3.distance2D(heelPx, toePx));
    const footWidth = Math.max(12, footLength * 0.45);
    const footCenterPx: Point2D = {
      x: (heelPx.x + toePx.x) / 2,
      y: (heelPx.y + toePx.y) / 2,
    };

    const angleDeg = Vector3.angle2DDegrees(heelPx, toePx);

    primitives.push({
      id: def.id,
      type: 'box',
      bodyPart: 'feet',
      name: def.name,
      x: footCenterPx.x,
      y: footCenterPx.y,
      width: footWidth,
      height: footLength,
      rotation: angleDeg - 90,
      depthZ: ankle.z,
      strokeColor: Proportions.COLORS.feetStroke,
      strokeWidth: 2,
      fillColor: Proportions.COLORS.feetFill,
      fillOpacity: 0.16,
      isUserCreated: false,
      isVisible: true,
    });
  }

  return primitives;
}
