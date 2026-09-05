import { describe, it, expect } from 'vitest';
import { Vector3 } from '../geometry/vector3';
import { createSyntheticPose } from '../samplePoses';
import { fitHeadPrimitives } from '../geometry/headFitter';
import { fitTorsoPrimitives } from '../geometry/torsoFitter';
import { fitLimbPrimitives } from '../geometry/limbFitter';
import { fitExtremityPrimitives } from '../geometry/extremityFitter';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';

describe('Geometry & 3D Math Engine', () => {
  it('correctly calculates 3D vector length, dot, and cross product', () => {
    const v1 = { x: 3, y: 4, z: 0 };
    expect(Vector3.length(v1)).toBe(5);

    const v2 = { x: 0, y: 1, z: 0 };
    expect(Vector3.dot(v1, v2)).toBe(4);

    const cross = Vector3.cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(cross).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('calculates limb foreshortening pitch angle towards camera', () => {
    // Segment pointing directly along Z axis (towards camera)
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 0, y: 0, z: -1 };
    const pitch = Vector3.pitchDegrees(p1, p2);
    expect(pitch).toBeCloseTo(-90, 1);

    // Segment parallel to camera plane (XY)
    const p3 = { x: 1, y: 0, z: 0 };
    const flatPitch = Vector3.pitchDegrees(p1, p3);
    expect(flatPitch).toBeCloseTo(0, 1);
  });

  it('fits Loomis cranium sphere, jaw wedge, and Okabayashi neck cylinder from head landmarks', () => {
    const pose = createSyntheticPose();
    const primitives = fitHeadPrimitives(pose.landmarks, pose.worldLandmarks, 800, 1000);

    expect(primitives.length).toBe(3);
    const cranium = primitives.find(p => p.id === 'primitive-cranium');
    const jaw = primitives.find(p => p.id === 'primitive-jaw-wedge');
    const neck = primitives.find(p => p.id === 'primitive-neck');

    expect(cranium).toBeDefined();
    expect(cranium?.type).toBe('oval');
    expect(cranium?.bodyPart).toBe('face');
    expect(cranium?.width).toBeGreaterThan(30);

    expect(jaw).toBeDefined();
    expect(jaw?.type).toBe('box');
    expect(jaw?.bodyPart).toBe('face');

    expect(neck).toBeDefined();
    expect(neck?.type).toBe('capsule');
    expect(neck?.bodyPart).toBe('face');
  });

  it('fits thoracic ribcage, stomach column, pelvic block, and gestural line of action', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const primitives = fitTorsoPrimitives(pose.landmarks, pose.worldLandmarks, 800, 1000);

    const ribcage = primitives.find(p => p.id === 'primitive-ribcage');
    const stomach = primitives.find(p => p.id === 'primitive-stomach');
    const pelvis = primitives.find(p => p.id === 'primitive-pelvis');
    const spine = primitives.find(p => p.id === 'primitive-line-of-action');

    expect(ribcage).toBeDefined();
    expect(ribcage?.type).toBe('oval');
    expect(ribcage?.bodyPart).toBe('torso');

    expect(stomach).toBeDefined();
    expect(stomach?.type).toBe('capsule');
    expect(stomach?.bodyPart).toBe('torso');

    expect(pelvis).toBeDefined();
    expect(pelvis?.type).toBe('box');
    expect(pelvis?.bodyPart).toBe('torso');

    expect(spine).toBeDefined();
    expect(spine?.type).toBe('line_of_action');
    expect(spine?.points?.length).toBe(6);
  });

  it('generates cross-contour perspective curves when limb is foreshortened', () => {
    // Pose with foreshortened arm pointing at camera
    const foreshortenedPose = createSyntheticPose({ foreshortenedArm: true });
    const primitives = fitLimbPrimitives(foreshortenedPose.landmarks, foreshortenedPose.worldLandmarks, 800, 1000);

    const crossContours = primitives.filter(p => p.type === 'cross_contour');
    expect(crossContours.length).toBeGreaterThan(0);
    expect(crossContours[0].name).toContain('Cross-Contour');
  });

  it('fits hand and foot wedge blocks', () => {
    const pose = createSyntheticPose();
    const extremities = fitExtremityPrimitives(pose.landmarks, pose.worldLandmarks, 800, 1000);

    const hands = extremities.filter(p => p.bodyPart === 'hands');
    const feet = extremities.filter(p => p.bodyPart === 'feet');

    expect(hands.length).toBe(2);
    expect(feet.length).toBe(2);
    expect(hands[0].type).toBe('box');
    expect(feet[0].type).toBe('box');
  });

  it('sorts primitives back-to-front using 3D depth painter algorithm', () => {
    const pose = createSyntheticPose({ foreshortenedArm: true });
    const scene = buildConstructionPrimitives(pose, 800, 1000);

    expect(scene.length).toBeGreaterThan(10);

    // Line of action should be at the bottom layer
    const lineOfActionIndex = scene.findIndex(p => p.type === 'line_of_action');
    expect(lineOfActionIndex).toBe(0);
  });

  it('supports Loomis style with cranial side plane oval and facial thirds lines', () => {
    const pose = createSyntheticPose();
    const loomisScene = buildConstructionPrimitives(pose, 800, 1000, 'loomis');

    const facialThirds = loomisScene.filter(p => p.type === 'facial_thirds');
    const sidePlane = loomisScene.find(p => p.id === 'loomis-side-plane');

    expect(facialThirds.length).toBeGreaterThanOrEqual(2);
    expect(sidePlane).toBeDefined();
    expect(sidePlane?.type).toBe('oval');
    expect(sidePlane?.bodyPart).toBe('face');
  });

  it('supports Bridgman style with distinct interlocking torso blocks and waist mortise wedges', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const bridgmanScene = buildConstructionPrimitives(pose, 800, 1000, 'bridgman');

    const ribcage = bridgmanScene.find(p => p.id === 'primitive-ribcage');
    const waistWedge = bridgmanScene.find(p => p.id === 'bridgman-waist-wedge');

    expect(ribcage).toBeDefined();
    expect(ribcage?.type).toBe('box'); // Bridgman uses boxy thorax
    expect(waistWedge).toBeDefined();
    expect(waistWedge?.type).toBe('box');
  });

  it('supports Hampton style with gesture rhythms, deltoid flow paths, and leg spirals', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const hamptonScene = buildConstructionPrimitives(pose, 800, 1000, 'hampton');

    const rhythmLines = hamptonScene.filter(p => p.type === 'rhythm_line');
    expect(rhythmLines.length).toBeGreaterThanOrEqual(2);
    const shoulderRhythm = rhythmLines.find(p => p.name.includes('Clavicle-Deltoid'));
    expect(shoulderRhythm).toBeDefined();
  });

  it('supports Okabayashi style with articulated ball joints, cervical neck, and abdominal mass', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const okabayashiScene = buildConstructionPrimitives(pose, 800, 1000, 'okabayashi');

    // 1. Neck cylinder connecting head to torso
    const neck = okabayashiScene.find(p => p.id === 'primitive-neck');
    expect(neck).toBeDefined();
    expect(neck?.type).toBe('capsule');

    // 2. Torso core: Ribcage, Stomach, Pelvis
    const ribcage = okabayashiScene.find(p => p.id === 'primitive-ribcage');
    const stomach = okabayashiScene.find(p => p.id === 'primitive-stomach');
    const pelvis = okabayashiScene.find(p => p.id === 'primitive-pelvis');
    expect(ribcage).toBeDefined();
    expect(stomach).toBeDefined();
    expect(pelvis).toBeDefined();

    // 3. Articulated Joint Spheres
    const shoulderJoints = okabayashiScene.filter(p => p.id.includes('shoulder-joint'));
    const elbowJoints = okabayashiScene.filter(p => p.id.includes('elbow-joint'));
    const hipJoints = okabayashiScene.filter(p => p.id.includes('hip-joint'));
    const kneeJoints = okabayashiScene.filter(p => p.id.includes('knee-joint'));

    expect(shoulderJoints.length).toBe(2);
    expect(elbowJoints.length).toBe(2);
    expect(hipJoints.length).toBe(2);
    expect(kneeJoints.length).toBe(2);

    expect(shoulderJoints[0].type).toBe('circle');
    expect(elbowJoints[0].type).toBe('circle');

    // 4. Head directional crosshairs
    const eyeline = okabayashiScene.find(p => p.id === 'okabayashi-eyeline');
    const centerline = okabayashiScene.find(p => p.id === 'okabayashi-centerline');
    expect(eyeline).toBeDefined();
    expect(centerline).toBeDefined();
  });

  it('supports BrokenDraw style with 3 big boxes, ear circle, sternum tie, and sacral triangle', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const brokenDrawScene = buildConstructionPrimitives(pose, 800, 1000, 'brokendraw');

    // 1. Three major masses must be boxes
    const cranium = brokenDrawScene.find(p => p.id === 'primitive-cranium');
    const ribcage = brokenDrawScene.find(p => p.id === 'primitive-ribcage');
    const pelvis = brokenDrawScene.find(p => p.id === 'primitive-pelvis');

    expect(cranium?.type).toBe('box');
    expect(ribcage?.type).toBe('box');
    expect(pelvis?.type).toBe('box');

    // 2. BrokenDraw Key Landmarks
    const earLandmark = brokenDrawScene.find(p => p.id === 'brokendraw-ear-landmark');
    const sternumLandmark = brokenDrawScene.find(p => p.id === 'brokendraw-sternum-landmark');
    const sacralLandmark = brokenDrawScene.find(p => p.id === 'brokendraw-sacrum-landmark');

    expect(earLandmark).toBeDefined();
    expect(earLandmark?.type).toBe('circle');
    expect(sternumLandmark).toBeDefined();
    expect(sternumLandmark?.type).toBe('facial_thirds');
    expect(sacralLandmark).toBeDefined();
    expect(sacralLandmark?.type).toBe('facial_thirds');

    // 3. Boxified limbs
    const leftUpperArm = brokenDrawScene.find(p => p.id === 'primitive-left-upper-arm');
    const leftThigh = brokenDrawScene.find(p => p.id === 'primitive-left-thigh');
    expect(leftUpperArm?.type).toBe('box');
    expect(leftThigh?.type).toBe('box');
  });

  it('supports Ryan Woodward style with Conté red rhythms and head-to-ankle gravity sweeps', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const woodwardScene = buildConstructionPrimitives(pose, 800, 1000, 'woodward');

    // 1. Primary gravity rhythm line
    const primaryRhythm = woodwardScene.find(p => p.id === 'woodward-primary-gravity-rhythm');
    expect(primaryRhythm).toBeDefined();
    expect(primaryRhythm?.type).toBe('rhythm_line');
    expect(primaryRhythm?.strokeColor).toBe('#ef4444');
    expect(primaryRhythm?.strokeWidth).toBe(4.5);
    expect(primaryRhythm?.points && primaryRhythm.points.length >= 8).toBe(true);

    // 2. Transverse contrapposto rhythm
    const transverse = woodwardScene.find(p => p.id === 'woodward-transverse-contrapposto');
    expect(transverse).toBeDefined();
    expect(transverse?.type).toBe('rhythm_line');

    // 3. Clavicle-to-palm sweep
    const armSweep = woodwardScene.find(p => p.id === 'woodward-clavicle-palm-rhythm');
    expect(armSweep).toBeDefined();
    expect(armSweep?.type).toBe('rhythm_line');
  });

  it('supports Ron Tiner style with reciprocal shoulder and pelvis counterpoise axes', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const tinerScene = buildConstructionPrimitives(pose, 800, 1000, 'tiner');

    // 1. Reciprocal counterpoise lines
    const shoulderAxis = tinerScene.find(p => p.id === 'tiner-reciprocal-shoulder-axis');
    const pelvisAxis = tinerScene.find(p => p.id === 'tiner-reciprocal-pelvis-axis');

    expect(shoulderAxis).toBeDefined();
    expect(shoulderAxis?.type).toBe('rhythm_line');
    expect(pelvisAxis).toBeDefined();
    expect(pelvisAxis?.type).toBe('rhythm_line');

    // 2. Both axes have at least 4 coordinates (start and end points)
    expect(shoulderAxis?.points?.length).toBe(4);
    expect(pelvisAxis?.points?.length).toBe(4);
  });

  it('synthesizes all master principles in hybrid style', () => {
    const pose = createSyntheticPose({ contrapposto: true });
    const hybridScene = buildConstructionPrimitives(pose, 800, 1000, 'hybrid');

    const facialThirds = hybridScene.filter(p => p.type === 'facial_thirds');
    const waistWedge = hybridScene.find(p => p.id === 'bridgman-waist-wedge');
    const shoulderRhythm = hybridScene.find(p => p.name.includes('Clavicle-Deltoid'));
    const neck = hybridScene.find(p => p.id === 'primitive-neck');

    expect(facialThirds.length).toBeGreaterThan(0);
    expect(waistWedge).toBeDefined();
    expect(shoulderRhythm).toBeDefined();
    expect(neck).toBeDefined();
  });
});
