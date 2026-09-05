import {
  PoseLandmarker,
  FilesetResolver,
  PoseLandmarkerResult
} from '@mediapipe/tasks-vision';
import { PoseDetectionResult, NormalizedLandmark, WorldLandmark } from '../types/pose';

let landmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker | null> | null = null;
let currentRunningMode: 'IMAGE' | 'VIDEO' = 'IMAGE';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_URL_FULL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';
const MODEL_URL_LITE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

/**
 * Initialize the MediaPipe PoseLandmarker singleton (Full accuracy model with fallback)
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (landmarkerInstance) return landmarkerInstance;
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      // Attempt to load Full accuracy model for best 2D/anime & complex pose handling
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL_FULL,
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 2,
        minPoseDetectionConfidence: 0.15,
        minPosePresenceConfidence: 0.15,
        minTrackingConfidence: 0.15,
      });

      landmarkerInstance = landmarker;
      currentRunningMode = 'IMAGE';
      isInitializing = false;
      return landmarker;
    } catch (err) {
      console.warn('Failed to initialize Full GPU delegate, trying Lite model:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL_LITE,
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numPoses: 2,
          minPoseDetectionConfidence: 0.15,
          minPosePresenceConfidence: 0.15,
          minTrackingConfidence: 0.15,
        });

        landmarkerInstance = landmarker;
        currentRunningMode = 'IMAGE';
        isInitializing = false;
        return landmarker;
      } catch (fallbackErr) {
        console.error(
          'Unable to load MediaPipe pose detection model. Please check your internet connection (an active internet connection is required on first launch to download model and WebAssembly assets from the CDN).',
          fallbackErr
        );
        isInitializing = false;
        return null;
      }
    }
  })();

  return initPromise;
}

/**
 * Transform raw MediaPipe output into structured PoseDetectionResult
 */
function parseLandmarkerResult(result: PoseLandmarkerResult): PoseDetectionResult {
  const totalPoses = result.landmarks?.length ?? 0;

  if (totalPoses === 0) {
    return {
      landmarks: [],
      worldLandmarks: [],
      confidence: 0,
      totalPosesDetected: 0,
    };
  }

  // Choose the most prominent pose (first pose)
  const primaryLandmarks = result.landmarks[0].map((lm): NormalizedLandmark => ({
    x: lm.x,
    y: lm.y,
    z: lm.z,
    visibility: lm.visibility,
  }));

  const primaryWorldLandmarks = result.worldLandmarks?.[0]?.map((wlm): WorldLandmark => ({
    x: wlm.x,
    y: wlm.y,
    z: wlm.z,
    visibility: wlm.visibility,
  })) ?? [];

  // Compute average confidence
  const avgVis = primaryLandmarks.reduce((acc, curr) => acc + (curr.visibility ?? 1), 0) / primaryLandmarks.length;

  return {
    landmarks: primaryLandmarks,
    worldLandmarks: primaryWorldLandmarks,
    confidence: avgVis,
    totalPosesDetected: totalPoses,
  };
}

export const OFFLINE_ERROR_MSG =
  'Unable to load MediaPipe pose detection model. Please check your network connection (an internet connection is required on first launch to download model and WASM assets from the CDN).';

/**
 * Detect human pose from an HTMLImageElement or HTMLCanvasElement
 */
export async function detectPoseFromImage(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<PoseDetectionResult> {
  const landmarker = await getPoseLandmarker();
  if (!landmarker) {
    throw new Error(OFFLINE_ERROR_MSG);
  }

  if (currentRunningMode !== 'IMAGE') {
    await landmarker.setOptions({ runningMode: 'IMAGE' });
    currentRunningMode = 'IMAGE';
  }
  const result = landmarker.detect(imageSource);
  return parseLandmarkerResult(result);
}

/**
 * Detect human pose from an HTMLVideoElement at a specific timestamp
 */
export async function detectPoseFromVideo(
  videoSource: HTMLVideoElement,
  timestampMs: number
): Promise<PoseDetectionResult> {
  const landmarker = await getPoseLandmarker();
  if (!landmarker) {
    throw new Error(OFFLINE_ERROR_MSG);
  }

  if (currentRunningMode !== 'VIDEO') {
    await landmarker.setOptions({ runningMode: 'VIDEO' });
    currentRunningMode = 'VIDEO';
  }
  const result = landmarker.detectForVideo(videoSource, timestampMs);
  return parseLandmarkerResult(result);
}
