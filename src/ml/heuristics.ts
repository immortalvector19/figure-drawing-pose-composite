import { NormalizedLandmark, PoseLandmarkIndex } from '../types/pose';

export interface QualityAlert {
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
}

export function evaluateDetectionHeuristics(
  landmarks: NormalizedLandmark[],
  totalPosesDetected: number
): QualityAlert[] {
  const alerts: QualityAlert[] = [];

  // 1. Check for empty detection
  if (!landmarks || landmarks.length === 0) {
    alerts.push({
      type: 'warning',
      title: 'No Figure Detected',
      message: 'No person was detected in the frame. Try uploading a clearer, well-lit reference with a visible subject.'
    });
    return alerts;
  }

  // 2. Check for multiple people
  if (totalPosesDetected > 1) {
    alerts.push({
      type: 'info',
      title: 'Multiple People Detected',
      message: `Detected ${totalPosesDetected} figures. Currently focusing construction forms on the primary subject.`
    });
  }

  // 3. Check overall confidence / visibility
  let visibleCount = 0;
  let totalVisibility = 0;

  for (const lm of landmarks) {
    const vis = lm.visibility ?? 1.0;
    totalVisibility += vis;
    if (vis > 0.4) visibleCount++;
  }

  const avgVisibility = totalVisibility / landmarks.length;
  if (avgVisibility < 0.55 || visibleCount < 14) {
    alerts.push({
      type: 'warning',
      title: 'Low Lighting or Occlusion',
      message: 'Landmark confidence is low due to lighting, motion blur, or partial occlusion. Some construction shapes may be approximated.'
    });
  }

  // 4. Check for partial body (e.g. bust / portrait only or legs missing)
  const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
  const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
  const leftAnkle = landmarks[PoseLandmarkIndex.LEFT_ANKLE];
  const rightAnkle = landmarks[PoseLandmarkIndex.RIGHT_ANKLE];

  const hasHips = (leftHip?.visibility ?? 0) > 0.4 || (rightHip?.visibility ?? 0) > 0.4;
  const hasLegs = (leftAnkle?.visibility ?? 0) > 0.35 || (rightAnkle?.visibility ?? 0) > 0.35;

  if (hasHips && !hasLegs) {
    alerts.push({
      type: 'info',
      title: 'Partial Figure (Upper Body Only)',
      message: 'Lower legs appear cropped or occluded. Showing upper-body construction forms.'
    });
  } else if (!hasHips) {
    alerts.push({
      type: 'info',
      title: 'Portrait / Head Shot',
      message: 'Torso and legs are out of frame. Showing cranial and facial construction forms.'
    });
  }

  return alerts;
}
