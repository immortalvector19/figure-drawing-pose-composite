export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export const Vector3 = {
  add(a: Point3D, b: Point3D): Point3D {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },

  sub(a: Point3D, b: Point3D): Point3D {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },

  scale(v: Point3D, s: number): Point3D {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },

  length(v: Point3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  },

  length2D(v: Point2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  distance(a: Point3D, b: Point3D): number {
    return Vector3.length(Vector3.sub(a, b));
  },

  distance2D(a: Point2D, b: Point2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  normalize(v: Point3D): Point3D {
    const len = Vector3.length(v);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  },

  dot(a: Point3D, b: Point3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },

  cross(a: Point3D, b: Point3D): Point3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  },

  midpoint(a: Point3D, b: Point3D): Point3D {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2,
    };
  },

  lerp(a: Point3D, b: Point3D, t: number): Point3D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  },

  /**
   * Angle of 2D segment from A to B in degrees relative to vertical (up-down)
   */
  angle2DDegrees(a: Point2D, b: Point2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  },

  /**
   * Calculate foreshortening pitch angle:
   * Returns angle in degrees between the limb vector and the camera plane XY.
   * If limb points straight towards camera (pure Z delta), angle is 90 deg.
   * If limb is parallel to camera plane, angle is 0 deg.
   */
  pitchDegrees(a: Point3D, b: Point3D): number {
    const delta = Vector3.sub(b, a);
    const xyLength = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    return (Math.atan2(delta.z, xyLength) * 180) / Math.PI;
  }
};
