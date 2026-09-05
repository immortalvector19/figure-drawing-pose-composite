import { PoseDetectionResult, PoseLandmarkIndex, NormalizedLandmark, WorldLandmark } from '../types/pose';
import { ConstructionPrimitive, ConstructionStyle } from '../types/shapes';
import { fitHeadPrimitives } from './headFitter';
import { fitTorsoPrimitives } from './torsoFitter';
import { fitLimbPrimitives } from './limbFitter';
import { fitExtremityPrimitives } from './extremityFitter';

function buildSinglePosePrimitives(
  landmarks: NormalizedLandmark[],
  worldLandmarks: WorldLandmark[],
  imageWidth: number,
  imageHeight: number,
  style: ConstructionStyle = 'okabayashi',
  figureIndex?: number
): ConstructionPrimitive[] {
  if (!landmarks || landmarks.length === 0) {
    return [];
  }

  // Extract baseline primitives from each anatomical region
  let headPrimitives = fitHeadPrimitives(landmarks, worldLandmarks, imageWidth, imageHeight);
  let torsoPrimitives = fitTorsoPrimitives(landmarks, worldLandmarks, imageWidth, imageHeight);
  let limbPrimitives = fitLimbPrimitives(landmarks, worldLandmarks, imageWidth, imageHeight);
  const extremityPrimitives = fitExtremityPrimitives(landmarks, worldLandmarks, imageWidth, imageHeight);

  const extraPrimitives: ConstructionPrimitive[] = [];

  // Modular Academic Master Style Specializations:
  const applyLoomis = () => {
    const cranium = headPrimitives.find(p => p.id === 'primitive-cranium');
    if (cranium) {
      const rx = cranium.width / 2;
      const ry = cranium.height / 2;

      // Facial thirds: Brow Line
      extraPrimitives.push({
        id: 'loomis-brow-line',
        type: 'facial_thirds',
        bodyPart: 'face',
        name: 'Loomis Brow Line',
        x: cranium.x,
        y: cranium.y,
        width: cranium.width,
        height: cranium.height,
        rotation: cranium.rotation,
        depthZ: cranium.depthZ - 0.01,
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          cranium.x - rx * 0.85, cranium.y,
          cranium.x + rx * 0.85, cranium.y,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      // Facial thirds: Nose Base Line
      extraPrimitives.push({
        id: 'loomis-nose-line',
        type: 'facial_thirds',
        bodyPart: 'face',
        name: 'Loomis Nose Base Line',
        x: cranium.x,
        y: cranium.y + ry * 0.45,
        width: cranium.width * 0.7,
        height: cranium.height,
        rotation: cranium.rotation,
        depthZ: cranium.depthZ - 0.01,
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          cranium.x - rx * 0.65, cranium.y + ry * 0.45,
          cranium.x + rx * 0.65, cranium.y + ry * 0.45,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      // Cranium sliced side plane oval
      extraPrimitives.push({
        id: 'loomis-side-plane',
        type: 'oval',
        bodyPart: 'face',
        name: 'Loomis Skull Sliced Side Plane',
        x: cranium.x + rx * 0.25,
        y: cranium.y - ry * 0.05,
        width: cranium.width * 0.55,
        height: cranium.height * 0.68,
        rotation: cranium.rotation,
        depthZ: cranium.depthZ - 0.02,
        strokeColor: '#7dd3fc',
        strokeWidth: 3.0,
        fillColor: '#0284c7',
        fillOpacity: 0.15,
        isUserCreated: false,
        isVisible: true,
      });
    }

    if (style === 'loomis') {
      // Ensure ribcage is Loomis smooth thoracic egg mass
      torsoPrimitives = torsoPrimitives.map(p => {
        if (p.id === 'primitive-ribcage') {
          return {
            ...p,
            type: 'oval',
            name: 'Loomis Thoracic Egg',
            strokeColor: '#f43f5e',
            fillColor: '#e11d48',
          };
        }
        return p;
      });
    }
  };

  const applyBridgman = () => {
    if (style === 'bridgman') {
      torsoPrimitives = torsoPrimitives.map(p => {
        if (p.id === 'primitive-ribcage') {
          return {
            ...p,
            type: 'box',
            name: 'Bridgman Thorax Block',
            strokeColor: '#a855f7',
            fillColor: '#9333ea',
          };
        }
        if (p.id === 'primitive-pelvis') {
          return {
            ...p,
            type: 'box',
            name: 'Bridgman Pelvic Block',
            strokeColor: '#ec4899',
            fillColor: '#db2777',
          };
        }
        return p;
      });
    }

    const rib = torsoPrimitives.find(p => p.id === 'primitive-ribcage');
    const pelvis = torsoPrimitives.find(p => p.id === 'primitive-pelvis');
    if (rib && pelvis) {
      const midX = (rib.x + pelvis.x) / 2;
      const midY = (rib.y + pelvis.y) / 2;
      const waistW = Math.min(rib.width, pelvis.width) * 0.85;
      const waistH = Math.abs(pelvis.y - rib.y) * 0.65;

      extraPrimitives.push({
        id: 'bridgman-waist-wedge',
        type: 'box',
        bodyPart: 'torso',
        name: 'Bridgman Waist Mortise Wedge',
        x: midX,
        y: midY,
        width: waistW,
        height: Math.max(30, waistH),
        rotation: (rib.rotation + pelvis.rotation) / 2,
        depthZ: (rib.depthZ + pelvis.depthZ) / 2 - 0.01,
        strokeColor: '#c084fc',
        strokeWidth: 4.0,
        fillColor: '#a855f7',
        fillOpacity: 0.20,
        isUserCreated: false,
        isVisible: true,
      });
    }
  };

  const applyHampton = () => {
    const lShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const rShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const lElbow = landmarks[PoseLandmarkIndex.LEFT_ELBOW];
    const rElbow = landmarks[PoseLandmarkIndex.RIGHT_ELBOW];
    const lHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
    const rHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
    const lKnee = landmarks[PoseLandmarkIndex.LEFT_KNEE];
    const rKnee = landmarks[PoseLandmarkIndex.RIGHT_KNEE];

    if (lShoulder && rShoulder) {
      const midClavicleX = (lShoulder.x + rShoulder.x) * 0.5 * imageWidth;
      const midClavicleY = (lShoulder.y + rShoulder.y) * 0.5 * imageHeight;
      const lElbX = lElbow ? lElbow.x * imageWidth : lShoulder.x * imageWidth;
      const lElbY = lElbow ? lElbow.y * imageHeight : lShoulder.y * imageHeight + 60;
      const rElbX = rElbow ? rElbow.x * imageWidth : rShoulder.x * imageWidth;
      const rElbY = rElbow ? rElbow.y * imageHeight : rShoulder.y * imageHeight + 60;

      // Left clavicle-deltoid rhythm curve
      extraPrimitives.push({
        id: 'hampton-rhythm-left-arm',
        type: 'rhythm_line',
        bodyPart: 'arms',
        name: 'Hampton Clavicle-Deltoid Rhythm (L)',
        x: midClavicleX,
        y: midClavicleY,
        width: 100,
        height: 100,
        rotation: 0,
        depthZ: -0.05,
        strokeColor: '#38bdf8',
        strokeWidth: 4.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          midClavicleX, midClavicleY,
          lShoulder.x * imageWidth, lShoulder.y * imageHeight,
          lElbX, lElbY,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      // Right clavicle-deltoid rhythm curve
      extraPrimitives.push({
        id: 'hampton-rhythm-right-arm',
        type: 'rhythm_line',
        bodyPart: 'arms',
        name: 'Hampton Clavicle-Deltoid Rhythm (R)',
        x: midClavicleX,
        y: midClavicleY,
        width: 100,
        height: 100,
        rotation: 0,
        depthZ: -0.05,
        strokeColor: '#38bdf8',
        strokeWidth: 4.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          midClavicleX, midClavicleY,
          rShoulder.x * imageWidth, rShoulder.y * imageHeight,
          rElbX, rElbY,
        ],
        isUserCreated: false,
        isVisible: true,
      });
    }

    if (lHip && rHip && lKnee && rKnee) {
      // Leg spiral rhythms
      extraPrimitives.push({
        id: 'hampton-rhythm-leg-left',
        type: 'rhythm_line',
        bodyPart: 'legs',
        name: 'Hampton Leg Spiral Rhythm (L)',
        x: lHip.x * imageWidth,
        y: lHip.y * imageHeight,
        width: 80,
        height: 120,
        rotation: 0,
        depthZ: -0.05,
        strokeColor: '#4ade80',
        strokeWidth: 4.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          lHip.x * imageWidth, lHip.y * imageHeight,
          (lHip.x * 0.7 + lKnee.x * 0.3) * imageWidth, (lHip.y * 0.4 + lKnee.y * 0.6) * imageHeight,
          lKnee.x * imageWidth, lKnee.y * imageHeight,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      extraPrimitives.push({
        id: 'hampton-rhythm-leg-right',
        type: 'rhythm_line',
        bodyPart: 'legs',
        name: 'Hampton Leg Spiral Rhythm (R)',
        x: rHip.x * imageWidth,
        y: rHip.y * imageHeight,
        width: 80,
        height: 120,
        rotation: 0,
        depthZ: -0.05,
        strokeColor: '#4ade80',
        strokeWidth: 4.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          rHip.x * imageWidth, rHip.y * imageHeight,
          (rHip.x * 0.7 + rKnee.x * 0.3) * imageWidth, (rHip.y * 0.4 + rKnee.y * 0.6) * imageHeight,
          rKnee.x * imageWidth, rKnee.y * imageHeight,
        ],
        isUserCreated: false,
        isVisible: true,
      });
    }
  };

  const applyOkabayashi = () => {
    // Okabayashi Mannequin Features (Figure Drawing For Dummies Chapter 9):
    // Centerline & Eyeline cross across the skull to establish head tilt and gaze direction
    const cranium = headPrimitives.find(p => p.id === 'primitive-cranium');
    if (cranium) {
      const rx = cranium.width / 2;
      const ry = cranium.height / 2;

      // Facial Eyeline across the middle of the sphere
      extraPrimitives.push({
        id: 'okabayashi-eyeline',
        type: 'facial_thirds',
        bodyPart: 'face',
        name: 'Okabayashi Head Eyeline',
        x: cranium.x,
        y: cranium.y,
        width: cranium.width,
        height: cranium.height,
        rotation: cranium.rotation,
        depthZ: cranium.depthZ - 0.02,
        strokeColor: '#38bdf8',
        strokeWidth: 2.2,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          cranium.x - rx * 0.9, cranium.y,
          cranium.x + rx * 0.9, cranium.y,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      // Facial Centerline down the front of the head
      extraPrimitives.push({
        id: 'okabayashi-centerline',
        type: 'facial_thirds',
        bodyPart: 'face',
        name: 'Okabayashi Head Centerline',
        x: cranium.x,
        y: cranium.y,
        width: cranium.width,
        height: cranium.height,
        rotation: cranium.rotation,
        depthZ: cranium.depthZ - 0.02,
        strokeColor: '#38bdf8',
        strokeWidth: 2.2,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          cranium.x, cranium.y - ry * 0.9,
          cranium.x, cranium.y + ry * 1.1,
        ],
        isUserCreated: false,
        isVisible: true,
      });
    }
  };

  const applyBrokenDraw = () => {
    // BrokenDraw (Tieran - 25 Drawing Exercises: Level 4 Box Figures & Deconstruction)
    // 1. Convert Cranium, Ribcage, and Pelvis into 3 Big Perspective Boxes
    headPrimitives = headPrimitives.map(p => {
      if (p.id === 'primitive-cranium') {
        return {
          ...p,
          type: 'box' as const,
          name: 'BrokenDraw Cranial Box',
          strokeColor: '#38bdf8',
          fillColor: '#0284c7',
        };
      }
      return p;
    });

    torsoPrimitives = torsoPrimitives.map(p => {
      if (p.id === 'primitive-ribcage') {
        return {
          ...p,
          type: 'box' as const,
          name: 'BrokenDraw Thoracic Box',
          strokeColor: '#f43f5e',
          fillColor: '#e11d48',
        };
      }
      if (p.id === 'primitive-pelvis') {
        return {
          ...p,
          type: 'box' as const,
          name: 'BrokenDraw Pelvic Box',
          strokeColor: '#a855f7',
          fillColor: '#9333ea',
        };
      }
      return p;
    });

    // Boxify limbs for BrokenDraw level 4
    limbPrimitives = limbPrimitives.map(p => {
      if (p.type === 'capsule') {
        return {
          ...p,
          type: 'box' as const,
          name: p.name.replace('Cylinder', 'Box').replace('Capsule', 'Box'),
        };
      }
      return p;
    });

    // 2. Ear Landmark on side plane of Cranium (BrokenDraw: "The ear rests as a C shape in the center of the side plane")
    const cranium = headPrimitives.find(p => p.id === 'primitive-cranium');
    if (cranium) {
      const earX = cranium.x + cranium.width * 0.35;
      const earY = cranium.y;
      extraPrimitives.push({
        id: 'brokendraw-ear-landmark',
        type: 'circle',
        bodyPart: 'face',
        name: 'BrokenDraw Ear Side-Plane Marker',
        x: earX,
        y: earY,
        width: Math.max(12, cranium.width * 0.22),
        height: Math.max(12, cranium.width * 0.22),
        rotation: cranium.rotation,
        depthZ: cranium.depthZ - 0.02,
        strokeColor: '#7dd3fc',
        strokeWidth: 2.2,
        fillColor: '#0284c7',
        fillOpacity: 0.25,
        isUserCreated: false,
        isVisible: true,
      });
    }

    // 3. Sternum Tie Landmark (BrokenDraw: "This tie-like shape is a good landmark for the sternum")
    const rib = torsoPrimitives.find(p => p.id === 'primitive-ribcage');
    if (rib) {
      const tieTopY = rib.y - rib.height * 0.4;
      const tieBottomY = rib.y + rib.height * 0.35;
      extraPrimitives.push({
        id: 'brokendraw-sternum-landmark',
        type: 'facial_thirds',
        bodyPart: 'torso',
        name: 'BrokenDraw Sternum Tie Landmark',
        x: rib.x,
        y: rib.y,
        width: rib.width * 0.3,
        height: rib.height * 0.75,
        rotation: rib.rotation,
        depthZ: rib.depthZ - 0.02,
        strokeColor: '#f43f5e',
        strokeWidth: 3.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          rib.x, tieTopY,
          rib.x - 8, rib.y - rib.height * 0.1,
          rib.x, tieBottomY,
          rib.x + 8, rib.y - rib.height * 0.1,
          rib.x, tieTopY,
        ],
        isUserCreated: false,
        isVisible: true,
      });
    }

    // 4. Sacral Triangular Landmark (BrokenDraw: "This triangular shape is always visible on the pelvic mass")
    const pelvis = torsoPrimitives.find(p => p.id === 'primitive-pelvis');
    if (pelvis) {
      const sacrumY = pelvis.y - pelvis.height * 0.15;
      extraPrimitives.push({
        id: 'brokendraw-sacrum-landmark',
        type: 'facial_thirds',
        bodyPart: 'torso',
        name: 'BrokenDraw Sacral Triangle Landmark',
        x: pelvis.x,
        y: sacrumY,
        width: pelvis.width * 0.4,
        height: pelvis.height * 0.4,
        rotation: pelvis.rotation,
        depthZ: pelvis.depthZ - 0.02,
        strokeColor: '#c084fc',
        strokeWidth: 2.5,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          pelvis.x - 14, sacrumY - 10,
          pelvis.x + 14, sacrumY - 10,
          pelvis.x, sacrumY + 16,
          pelvis.x - 14, sacrumY - 10,
        ],
        isUserCreated: false,
        isVisible: true,
      });
    }
  };

  const applyWoodward = () => {
    // Ryan Woodward (Gesture Drawing: The Unreachable Goal)
    // Continuous flowing red rhythm lines connecting whole-body relationships
    const lShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const rShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const lHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
    const rHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
    const lKnee = landmarks[PoseLandmarkIndex.LEFT_KNEE];
    const rKnee = landmarks[PoseLandmarkIndex.RIGHT_KNEE];
    const lAnkle = landmarks[PoseLandmarkIndex.LEFT_ANKLE];
    const rAnkle = landmarks[PoseLandmarkIndex.RIGHT_ANKLE];
    const nose = landmarks[PoseLandmarkIndex.NOSE];
    const lWrist = landmarks[PoseLandmarkIndex.LEFT_WRIST];
    const rWrist = landmarks[PoseLandmarkIndex.RIGHT_WRIST];

    if (lShoulder && rShoulder && lHip && rHip) {
      const midShoulderX = ((lShoulder.x + rShoulder.x) / 2) * imageWidth;
      const midShoulderY = ((lShoulder.y + rShoulder.y) / 2) * imageHeight;
      const headTopX = nose ? nose.x * imageWidth : midShoulderX;
      const headTopY = nose ? (nose.y - 0.08) * imageHeight : midShoulderY - 60;

      // Identify supporting / weight-bearing leg
      const useRightLeg = (rAnkle && lAnkle) ? (rAnkle.y > lAnkle.y) : !!rAnkle;
      const activeHip = useRightLeg ? rHip : lHip;
      const activeKnee = useRightLeg ? (rKnee ?? activeHip) : (lKnee ?? activeHip);
      const activeAnkle = useRightLeg ? (rAnkle ?? activeKnee) : (lAnkle ?? activeKnee);

      // 1. Primary Whole-Body Gravitational Rhythm (Skull -> Spine -> Weight-Bearing Ankle)
      extraPrimitives.push({
        id: 'woodward-primary-gravity-rhythm',
        type: 'rhythm_line',
        bodyPart: 'torso',
        name: 'Woodward Primary Body Rhythm (Head-to-Ankle Flow)',
        x: midShoulderX,
        y: midShoulderY,
        width: 120,
        height: 400,
        rotation: 0,
        depthZ: -0.06,
        strokeColor: '#ef4444',
        strokeWidth: 4.5,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          headTopX, headTopY,
          midShoulderX, midShoulderY,
          activeHip.x * imageWidth, activeHip.y * imageHeight,
          activeKnee.x * imageWidth, activeKnee.y * imageHeight,
          activeAnkle.x * imageWidth, activeAnkle.y * imageHeight,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      // 2. Transverse Torso Contrapposto Rhythm (Shoulder -> Opposite Hip)
      extraPrimitives.push({
        id: 'woodward-transverse-contrapposto',
        type: 'rhythm_line',
        bodyPart: 'torso',
        name: 'Woodward Transverse Torso Rhythm (Shoulder-to-Opposite-Hip)',
        x: midShoulderX,
        y: midShoulderY,
        width: 100,
        height: 120,
        rotation: 0,
        depthZ: -0.05,
        strokeColor: '#f97316',
        strokeWidth: 3.8,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          rShoulder.x * imageWidth, rShoulder.y * imageHeight,
          midShoulderX, midShoulderY + 30,
          lHip.x * imageWidth, lHip.y * imageHeight,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      // 3. Dominant Arm Gesture Flow Arc
      if (lWrist || rWrist) {
        const armWrist = rWrist ?? lWrist!;
        const armShoulder = (armWrist === rWrist) ? rShoulder : lShoulder;
        const armElbow = (armWrist === rWrist) ? landmarks[PoseLandmarkIndex.RIGHT_ELBOW] : landmarks[PoseLandmarkIndex.LEFT_ELBOW];
        const elbowX = armElbow ? armElbow.x * imageWidth : (armShoulder.x + armWrist.x) * 0.5 * imageWidth;
        const elbowY = armElbow ? armElbow.y * imageHeight : (armShoulder.y + armWrist.y) * 0.5 * imageHeight;

        extraPrimitives.push({
          id: 'woodward-clavicle-palm-rhythm',
          type: 'rhythm_line',
          bodyPart: 'arms',
          name: 'Woodward Arm Gesture Flow (Clavicle-to-Fingertips)',
          x: armShoulder.x * imageWidth,
          y: armShoulder.y * imageHeight,
          width: 80,
          height: 140,
          rotation: 0,
          depthZ: -0.05,
          strokeColor: '#ef4444',
          strokeWidth: 4.0,
          fillColor: 'transparent',
          fillOpacity: 0,
          points: [
            midShoulderX, midShoulderY,
            armShoulder.x * imageWidth, armShoulder.y * imageHeight,
            elbowX, elbowY,
            armWrist.x * imageWidth, armWrist.y * imageHeight,
          ],
          isUserCreated: false,
          isVisible: true,
        });
      }
    }
  };

  const applyTiner = () => {
    // Ron Tiner (Figure Drawing Without a Model - Chapter 4: The Figure in Action)
    // Balance, equilibrium, and reciprocal slope axes (contrapposto compensation)
    const lShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const rShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const lHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
    const rHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];

    if (lShoulder && rShoulder && lHip && rHip) {
      const lSPx = { x: lShoulder.x * imageWidth, y: lShoulder.y * imageHeight };
      const rSPx = { x: rShoulder.x * imageWidth, y: rShoulder.y * imageHeight };
      const lHPx = { x: lHip.x * imageWidth, y: lHip.y * imageHeight };
      const rHPx = { x: rHip.x * imageWidth, y: rHip.y * imageHeight };

      const sMidX = (lSPx.x + rSPx.x) / 2;
      const sMidY = (lSPx.y + rSPx.y) / 2;
      const sDx = lSPx.x - rSPx.x;
      const sDy = lSPx.y - rSPx.y;

      extraPrimitives.push({
        id: 'tiner-reciprocal-shoulder-axis',
        type: 'rhythm_line',
        bodyPart: 'torso',
        name: 'Tiner Shoulder Counterpoise Axis',
        x: sMidX,
        y: sMidY,
        width: 140,
        height: 20,
        rotation: 0,
        depthZ: -0.04,
        strokeColor: '#38bdf8',
        strokeWidth: 3.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          sMidX - sDx * 0.7, sMidY - sDy * 0.7,
          sMidX + sDx * 0.7, sMidY + sDy * 0.7,
        ],
        isUserCreated: false,
        isVisible: true,
      });

      const hMidX = (lHPx.x + rHPx.x) / 2;
      const hMidY = (lHPx.y + rHPx.y) / 2;
      const hDx = lHPx.x - rHPx.x;
      const hDy = lHPx.y - rHPx.y;

      extraPrimitives.push({
        id: 'tiner-reciprocal-pelvis-axis',
        type: 'rhythm_line',
        bodyPart: 'torso',
        name: 'Tiner Pelvic Counterpoise Axis',
        x: hMidX,
        y: hMidY,
        width: 140,
        height: 20,
        rotation: 0,
        depthZ: -0.04,
        strokeColor: '#f43f5e',
        strokeWidth: 3.0,
        fillColor: 'transparent',
        fillOpacity: 0,
        points: [
          hMidX - hDx * 0.7, hMidY - hDy * 0.7,
          hMidX + hDx * 0.7, hMidY + hDy * 0.7,
        ],
        isUserCreated: false,
        isVisible: true,
      });
    }
  };

  if (style === 'okabayashi') {
    applyOkabayashi();
  } else if (style === 'brokendraw') {
    applyBrokenDraw();
  } else if (style === 'woodward') {
    applyWoodward();
  } else if (style === 'tiner') {
    applyTiner();
  } else if (style === 'loomis') {
    applyLoomis();
  } else if (style === 'bridgman') {
    torsoPrimitives = torsoPrimitives.filter(p => p.id !== 'primitive-stomach');
    applyBridgman();
  } else if (style === 'hampton') {
    applyHampton();
  } else if (style === 'hybrid') {
    applyOkabayashi();
    applyBrokenDraw();
    applyWoodward();
    applyTiner();
    applyLoomis();
    applyBridgman();
    applyHampton();
  }

  const allPrimitives = [
    ...headPrimitives,
    ...torsoPrimitives,
    ...limbPrimitives,
    ...extremityPrimitives,
    ...extraPrimitives,
  ];

  // 3D Depth Sorting (Painter's Algorithm):
  allPrimitives.sort((a, b) => {
    // Keep line of action on bottom of torso
    if (a.type === 'line_of_action') return -1;
    if (b.type === 'line_of_action') return 1;
    // Rhythms and facial thirds render cleanly over parent forms
    if (a.type === 'rhythm_line' && b.type !== 'rhythm_line') return 1;
    if (b.type === 'rhythm_line' && a.type !== 'rhythm_line') return -1;
    if (a.type === 'facial_thirds' && b.type !== 'facial_thirds') return 1;
    if (b.type === 'facial_thirds' && a.type !== 'facial_thirds') return -1;
    // Cross contours always render directly on their parent limb
    if (a.type === 'cross_contour' && b.type !== 'cross_contour') return 1;
    if (b.type === 'cross_contour' && a.type !== 'cross_contour') return -1;
    return b.depthZ - a.depthZ;
  });

  if (figureIndex !== undefined) {
    return allPrimitives.map(p => ({
      ...p,
      id: `fig${figureIndex + 1}-${p.id}`,
      name: `Figure ${figureIndex + 1}: ${p.name}`,
    }));
  }

  return allPrimitives;
}

export function buildConstructionPrimitives(
  pose: PoseDetectionResult,
  imageWidth: number,
  imageHeight: number,
  style: ConstructionStyle = 'okabayashi'
): ConstructionPrimitive[] {
  if (!pose.landmarks || pose.landmarks.length === 0) {
    return [];
  }

  // Multi-figure composition
  if (pose.allPoses && pose.allPoses.length > 1) {
    const combinedPrimitives: ConstructionPrimitive[] = [];
    pose.allPoses.forEach((singlePose, figIdx) => {
      const figPrimitives = buildSinglePosePrimitives(
        singlePose.landmarks,
        singlePose.worldLandmarks,
        imageWidth,
        imageHeight,
        style,
        figIdx
      );
      combinedPrimitives.push(...figPrimitives);
    });

    // 3D Depth Sorting across all figures
    combinedPrimitives.sort((a, b) => {
      if (a.type === 'line_of_action') return -1;
      if (b.type === 'line_of_action') return 1;
      if (a.type === 'rhythm_line' && b.type !== 'rhythm_line') return 1;
      if (b.type === 'rhythm_line' && a.type !== 'rhythm_line') return -1;
      if (a.type === 'facial_thirds' && b.type !== 'facial_thirds') return 1;
      if (b.type === 'facial_thirds' && a.type !== 'facial_thirds') return -1;
      if (a.type === 'cross_contour' && b.type !== 'cross_contour') return 1;
      if (b.type === 'cross_contour' && a.type !== 'cross_contour') return -1;
      return b.depthZ - a.depthZ;
    });

    return combinedPrimitives;
  }

  // Single pose default
  return buildSinglePosePrimitives(
    pose.landmarks,
    pose.worldLandmarks,
    imageWidth,
    imageHeight,
    style
  );
}
