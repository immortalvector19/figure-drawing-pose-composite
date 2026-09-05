import { PoseDetectionResult, PoseLandmarkIndex } from './types/pose';

/**
 * Creates a synthetic full-body 33-landmark pose with natural proportions.
 * Used for instant demoing, edge-case testing, and offline verification.
 */
export function createSyntheticPose(options: {
  contrapposto?: boolean;
  foreshortenedArm?: boolean;
  lowConfidence?: boolean;
  partialBody?: boolean;
} = {}): PoseDetectionResult {
  const visMult = options.lowConfidence ? 0.35 : 1.0;

  const landmarks = new Array(33).fill(null).map(() => ({
    x: 0.5,
    y: 0.5,
    z: 0.0,
    visibility: 0.95 * visMult,
  }));

  const worldLandmarks = new Array(33).fill(null).map(() => ({
    x: 0.0,
    y: 0.0,
    z: 0.0,
    visibility: 0.95 * visMult,
  }));

  const shoulderTilt = options.contrapposto ? 0.03 : 0.0;
  const hipTilt = options.contrapposto ? -0.025 : 0.0;

  // Head & Face
  landmarks[PoseLandmarkIndex.NOSE] = { x: 0.50, y: 0.14, z: -0.08, visibility: 0.98 };
  landmarks[PoseLandmarkIndex.LEFT_EYE] = { x: 0.52, y: 0.125, z: -0.07, visibility: 0.98 };
  landmarks[PoseLandmarkIndex.RIGHT_EYE] = { x: 0.48, y: 0.125, z: -0.07, visibility: 0.98 };
  landmarks[PoseLandmarkIndex.LEFT_EAR] = { x: 0.55, y: 0.13, z: 0.02, visibility: 0.95 };
  landmarks[PoseLandmarkIndex.RIGHT_EAR] = { x: 0.45, y: 0.13, z: 0.02, visibility: 0.95 };
  landmarks[PoseLandmarkIndex.MOUTH_LEFT] = { x: 0.52, y: 0.16, z: -0.06, visibility: 0.97 };
  landmarks[PoseLandmarkIndex.MOUTH_RIGHT] = { x: 0.48, y: 0.16, z: -0.06, visibility: 0.97 };

  // Shoulders
  landmarks[PoseLandmarkIndex.LEFT_SHOULDER] = { x: 0.59, y: 0.22 - shoulderTilt, z: 0.02, visibility: 0.98 };
  landmarks[PoseLandmarkIndex.RIGHT_SHOULDER] = { x: 0.41, y: 0.22 + shoulderTilt, z: -0.02, visibility: 0.98 };

  // Arms
  const armZ = options.foreshortenedArm ? -0.35 : 0.05; // strongly pointing towards camera
  landmarks[PoseLandmarkIndex.LEFT_ELBOW] = { x: 0.64, y: 0.35, z: armZ * 0.5, visibility: 0.96 };
  landmarks[PoseLandmarkIndex.LEFT_WRIST] = { x: 0.66, y: 0.47, z: armZ, visibility: 0.95 };
  landmarks[PoseLandmarkIndex.LEFT_INDEX] = { x: 0.67, y: 0.51, z: armZ - 0.03, visibility: 0.92 };
  landmarks[PoseLandmarkIndex.LEFT_PINKY] = { x: 0.69, y: 0.50, z: armZ - 0.02, visibility: 0.90 };

  landmarks[PoseLandmarkIndex.RIGHT_ELBOW] = { x: 0.35, y: 0.35, z: 0.05, visibility: 0.96 };
  landmarks[PoseLandmarkIndex.RIGHT_WRIST] = { x: 0.32, y: 0.46, z: 0.08, visibility: 0.95 };
  landmarks[PoseLandmarkIndex.RIGHT_INDEX] = { x: 0.30, y: 0.50, z: 0.09, visibility: 0.92 };
  landmarks[PoseLandmarkIndex.RIGHT_PINKY] = { x: 0.29, y: 0.49, z: 0.09, visibility: 0.90 };

  // Hips
  landmarks[PoseLandmarkIndex.LEFT_HIP] = { x: 0.56, y: 0.46 - hipTilt, z: 0.0, visibility: 0.98 };
  landmarks[PoseLandmarkIndex.RIGHT_HIP] = { x: 0.44, y: 0.46 + hipTilt, z: 0.0, visibility: 0.98 };

  // Legs (if not partial body)
  if (!options.partialBody) {
    landmarks[PoseLandmarkIndex.LEFT_KNEE] = { x: 0.57, y: 0.67, z: 0.02, visibility: 0.96 };
    landmarks[PoseLandmarkIndex.RIGHT_KNEE] = { x: 0.43, y: 0.67, z: -0.03, visibility: 0.96 };

    landmarks[PoseLandmarkIndex.LEFT_ANKLE] = { x: 0.58, y: 0.86, z: 0.04, visibility: 0.95 };
    landmarks[PoseLandmarkIndex.RIGHT_ANKLE] = { x: 0.42, y: 0.86, z: -0.02, visibility: 0.95 };

    landmarks[PoseLandmarkIndex.LEFT_HEEL] = { x: 0.59, y: 0.88, z: 0.08, visibility: 0.92 };
    landmarks[PoseLandmarkIndex.LEFT_FOOT_INDEX] = { x: 0.61, y: 0.91, z: -0.05, visibility: 0.90 };

    landmarks[PoseLandmarkIndex.RIGHT_HEEL] = { x: 0.41, y: 0.88, z: 0.02, visibility: 0.92 };
    landmarks[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = { x: 0.39, y: 0.91, z: -0.10, visibility: 0.90 };
  } else {
    // Hide legs for partial body test
    landmarks[PoseLandmarkIndex.LEFT_KNEE].visibility = 0.1;
    landmarks[PoseLandmarkIndex.RIGHT_KNEE].visibility = 0.1;
    landmarks[PoseLandmarkIndex.LEFT_ANKLE].visibility = 0.05;
    landmarks[PoseLandmarkIndex.RIGHT_ANKLE].visibility = 0.05;
  }

  // Apply visibility multiplier for confidence simulation
  for (let i = 0; i < 33; i++) {
    landmarks[i].visibility = (landmarks[i].visibility ?? 1.0) * visMult;
  }

  // Populate 3D metric world landmarks based on normalized coords
  for (let i = 0; i < 33; i++) {
    worldLandmarks[i] = {
      x: (landmarks[i].x - 0.5) * 1.8,
      y: (landmarks[i].y - 0.5) * 1.8,
      z: landmarks[i].z,
      visibility: landmarks[i].visibility,
    };
  }

  return {
    landmarks,
    worldLandmarks,
    confidence: options.lowConfidence ? 0.42 : 0.94,
    totalPosesDetected: 1,
  };
}
