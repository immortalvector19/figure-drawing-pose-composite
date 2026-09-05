import { describe, it, expect } from 'vitest';
import { createSyntheticPose } from '../samplePoses';
import { buildConstructionPrimitives } from '../geometry/sceneBuilder';
import { evaluateDetectionHeuristics } from '../ml/heuristics';
import { PoseDetectionResult, PoseLandmarkIndex } from '../types/pose';
import { generateSvgString } from '../export/svgExporter';

describe('Gauntlet Edge Case Suite', () => {
  it('exercises heavy occlusion (one arm occluded behind back)', () => {
    const pose = createSyntheticPose();
    // Simulate right arm being hidden behind back (low visibility)
    pose.landmarks[PoseLandmarkIndex.RIGHT_ELBOW].visibility = 0.1;
    pose.landmarks[PoseLandmarkIndex.RIGHT_WRIST].visibility = 0.05;

    const primitives = buildConstructionPrimitives(pose, 800, 1000);

    // Left arm should still exist, but occluded right forearm should be omitted gracefully
    const rightForearm = primitives.find(p => p.id === 'primitive-right-forearm');
    const leftForearm = primitives.find(p => p.id === 'primitive-left-forearm');

    expect(rightForearm).toBeUndefined();
    expect(leftForearm).toBeDefined();
    expect(primitives.length).toBeGreaterThan(5);
  });

  it('exercises extreme seated / crouching pose', () => {
    const pose = createSyntheticPose();
    // Move knees and ankles up to hip level to simulate deep squat/crouch
    pose.landmarks[PoseLandmarkIndex.LEFT_KNEE].y = 0.50;
    pose.landmarks[PoseLandmarkIndex.RIGHT_KNEE].y = 0.50;
    pose.landmarks[PoseLandmarkIndex.LEFT_ANKLE].y = 0.55;
    pose.landmarks[PoseLandmarkIndex.RIGHT_ANKLE].y = 0.55;

    const primitives = buildConstructionPrimitives(pose, 800, 1000);
    expect(primitives.length).toBeGreaterThan(8);

    const thighs = primitives.filter(p => p.name.includes('Thigh'));
    expect(thighs.length).toBe(2);
  });

  it('handles completely corrupt or empty landmark array without crashing', () => {
    const corruptPose: PoseDetectionResult = {
      landmarks: [],
      worldLandmarks: [],
      confidence: 0,
      totalPosesDetected: 0,
    };

    expect(() => buildConstructionPrimitives(corruptPose, 800, 1000)).not.toThrow();
    const result = buildConstructionPrimitives(corruptPose, 800, 1000);
    expect(result).toEqual([]);

    const alerts = evaluateDetectionHeuristics(corruptPose.landmarks, 0);
    expect(alerts.length).toBe(1);
    expect(alerts[0].title).toBe('No Figure Detected');
  });

  it('handles extreme multi-person crowd (e.g. 6 people)', () => {
    const pose = createSyntheticPose();
    const alerts = evaluateDetectionHeuristics(pose.landmarks, 6);
    const multiAlert = alerts.find(a => a.title === 'Multiple People Detected');

    expect(multiAlert).toBeDefined();
    expect(multiAlert?.message).toContain('Detected 6 figures');
  });

  it('handles high-resolution images (4K / 8K canvas) without overflow', () => {
    const pose = createSyntheticPose();
    const primitives = buildConstructionPrimitives(pose, 3840, 2160);

    expect(primitives.length).toBeGreaterThan(10);
    const cranium = primitives.find(p => p.id === 'primitive-cranium')!;
    expect(cranium.width).toBeGreaterThan(100);
    expect(cranium.x).toBeCloseTo(0.5 * 3840, -1);

    const svg = generateSvgString(primitives, 3840, 2160);
    expect(svg).toContain('viewBox="0 0 3840 2160"');
  });
});
