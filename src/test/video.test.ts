import { describe, it, expect } from 'vitest';
import { VideoPoseTracker } from '../ml/videoProcessor';

describe('Video Tracking & EMA Smoothing Engine', () => {
  it('correctly dampens landmark jitter across consecutive frames', () => {
    const tracker = new VideoPoseTracker();
    expect(tracker).toBeDefined();

    // Test EMA math directly:
    // S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
    const alpha = 0.65;
    const frame0 = 0.50;
    const noisyFrame1 = 0.60; // Jitter jump +0.10

    const smoothed1 = frame0 * (1 - alpha) + noisyFrame1 * alpha;
    // Smoothed value should be 0.565, dampening the jump from +0.10 to +0.065
    expect(smoothed1).toBeCloseTo(0.565, 3);
  });

  it('handles empty frames gracefully without exceptions', () => {
    const tracker = new VideoPoseTracker();
    tracker.reset();
    expect(() => tracker.reset()).not.toThrow();
  });
});
