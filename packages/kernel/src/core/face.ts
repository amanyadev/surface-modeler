import { Vec3 } from './types.js';
import { generateId } from '../utils/id.js';

export class Face {
  public readonly id: string;
  public halfEdge: string;   // Reference to one of the boundary half-edges
  public normal?: Vec3;      // Face normal vector

  constructor(halfEdgeId: string, id?: string) {
    this.id = id || generateId();
    this.halfEdge = halfEdgeId;
  }

  clone(): Face {
    const cloned = new Face(this.halfEdge, this.id);
    cloned.normal = this.normal ? { ...this.normal } : undefined;
    return cloned;
  }

  setHalfEdge(halfEdgeId: string): void {
    this.halfEdge = halfEdgeId;
  }

  setNormal(normal: Vec3): void {
    this.normal = { ...normal };
  }

  hasNormal(): boolean {
    return this.normal !== undefined;
  }
}