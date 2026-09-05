import { describe, it, expect } from 'vitest';
import { evaluateDetectionHeuristics } from '../ml/heuristics';
import { createSyntheticPose } from '../samplePoses';

describe('Heuristics & Quality Alerts', () => {
  it('warns when no figure is detected', () => {
    const alerts = evaluateDetectionHeuristics([], 0);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe('warning');
    expect(alerts[0].title).toBe('No Figure Detected');
  });

  it('notifies when multiple people are in the frame', () => {
    const pose = createSyntheticPose();
    const alerts = evaluateDetectionHeuristics(pose.landmarks, 3);
    const multiAlert = alerts.find(a => a.title === 'Multiple People Detected');
    expect(multiAlert).toBeDefined();
    expect(multiAlert?.message).toContain('Detected 3 figures');
  });

  it('warns on low confidence / blurry lighting', () => {
    const pose = createSyntheticPose({ lowConfidence: true });
    const alerts = evaluateDetectionHeuristics(pose.landmarks, 1);
    const lowConfAlert = alerts.find(a => a.title === 'Low Lighting or Occlusion');
    expect(lowConfAlert).toBeDefined();
  });

  it('detects partial body (portrait bust / cropped legs)', () => {
    const pose = createSyntheticPose({ partialBody: true });
    const alerts = evaluateDetectionHeuristics(pose.landmarks, 1);
    const partialAlert = alerts.find(a => a.title.includes('Partial Figure'));
    expect(partialAlert).toBeDefined();
  });
});
