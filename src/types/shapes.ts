export type BodyPartCategory = 'face' | 'torso' | 'arms' | 'legs' | 'hands' | 'feet';

export type ConstructionStyle =
  | 'okabayashi'
  | 'brokendraw'
  | 'woodward'
  | 'tiner'
  | 'hybrid'
  | 'loomis'
  | 'bridgman'
  | 'hampton';

export type ConstructionMode = 'auto' | 'manual';

export type DrawToolType = 'select' | 'rectangle' | 'circle' | 'oval' | 'cylinder' | 'line';

export type PrimitiveType =
  | 'oval'
  | 'circle'
  | 'box'
  | 'capsule'
  | 'cross_contour'
  | 'line_of_action'
  | 'rhythm_line'
  | 'facial_thirds';

export interface ConstructionPrimitive {
  id: string;
  type: PrimitiveType;
  bodyPart: BodyPartCategory;
  name: string;

  // 2D Coordinates (relative to source image coordinate system in px)
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees

  // 3D Depth & Perspective metadata
  depthZ: number; // Mean Z depth in meters (more negative = closer to camera in MediaPipe coords)
  tiltAngle?: number; // Tilt angle in degrees for cross-contour curvature
  aspectRatio?: number;

  // Styling
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;

  // Custom paths / polyline points if applicable
  points?: number[]; // [x1, y1, x2, y2, ...] for action line or polygon wedge

  // State
  isUserCreated: boolean;
  isVisible: boolean;
}

export interface BodyPartVisibilityMap {
  face: boolean;
  torso: boolean;
  arms: boolean;
  legs: boolean;
  hands: boolean;
  feet: boolean;
}
