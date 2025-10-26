import { Vec3 } from '../core/types.js';

export function vec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
  return { x, y, z };
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vec3Normalize(v: Vec3): Vec3 {
  const length = vec3Length(v);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return vec3Scale(v, 1 / length);
}

export function calculateFaceNormal(vertices: Vec3[]): Vec3 {
  if (vertices.length < 3) {
    return { x: 0, y: 1, z: 0 };
  }

  const v1 = vertices[0];
  const v2 = vertices[1];
  const v3 = vertices[2];

  const edge1 = vec3Sub(v2, v1);
  const edge2 = vec3Sub(v3, v1);
  
  return vec3Normalize(vec3Cross(edge1, edge2));
}