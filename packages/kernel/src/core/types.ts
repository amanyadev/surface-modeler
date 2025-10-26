export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface BoundingBox {
  min: Vec3;
  max: Vec3;
}

// Re-export for compatibility
export type { Vec3 as Vector3, Vec2 as Vector2 };