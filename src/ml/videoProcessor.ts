import { NormalizedLandmark, WorldLandmark, PoseDetectionResult } from '../types/pose';
import { detectPoseFromVideo } from './poseDetector';

export class VideoPoseTracker {
  private smoothedLandmarks: NormalizedLandmark[] = [];
  private smoothedWorldLandmarks: WorldLandmark[] = [];
  private smoothingAlpha = 0.65; // Weight on new measurement vs previous frame

  /**
   * Reset the tracker state (e.g. when seeking to a distant timestamp)
   */
  public reset(): void {
    this.smoothedLandmarks = [];
    this.smoothedWorldLandmarks = [];
  }

  /**
   * Process a video frame and apply exponential smoothing to avoid jitter
   */
  public async processFrame(
    video: HTMLVideoElement,
    timestampMs: number
  ): Promise<PoseDetectionResult> {
    const rawResult = await detectPoseFromVideo(video, timestampMs);

    if (rawResult.landmarks.length === 0) {
      return rawResult;
    }

    // Apply EMA smoothing to 2D landmarks
    if (this.smoothedLandmarks.length !== rawResult.landmarks.length) {
      this.smoothedLandmarks = rawResult.landmarks.map(lm => ({ ...lm }));
    } else {
      this.smoothedLandmarks = rawResult.landmarks.map((lm, i) => {
        const prev = this.smoothedLandmarks[i];
        return {
          x: prev.x * (1 - this.smoothingAlpha) + lm.x * this.smoothingAlpha,
          y: prev.y * (1 - this.smoothingAlpha) + lm.y * this.smoothingAlpha,
          z: prev.z * (1 - this.smoothingAlpha) + lm.z * this.smoothingAlpha,
          visibility: lm.visibility,
        };
      });
    }

    // Apply EMA smoothing to 3D world landmarks
    if (this.smoothedWorldLandmarks.length !== rawResult.worldLandmarks.length) {
      this.smoothedWorldLandmarks = rawResult.worldLandmarks.map(wlm => ({ ...wlm }));
    } else {
      this.smoothedWorldLandmarks = rawResult.worldLandmarks.map((wlm, i) => {
        const prev = this.smoothedWorldLandmarks[i];
        return {
          x: prev.x * (1 - this.smoothingAlpha) + wlm.x * this.smoothingAlpha,
          y: prev.y * (1 - this.smoothingAlpha) + wlm.y * this.smoothingAlpha,
          z: prev.z * (1 - this.smoothingAlpha) + wlm.z * this.smoothingAlpha,
          visibility: wlm.visibility,
        };
      });
    }

    return {
      landmarks: this.smoothedLandmarks,
      worldLandmarks: this.smoothedWorldLandmarks,
      confidence: rawResult.confidence,
      totalPosesDetected: rawResult.totalPosesDetected,
    };
  }
}
