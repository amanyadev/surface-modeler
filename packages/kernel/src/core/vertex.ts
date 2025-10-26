import { Vec3 } from './types.js';
import { generateId } from '../utils/id.js';

export class Vertex {
  public readonly id: string;
  public pos: Vec3;
  public halfEdge?: string; // Reference to one outgoing half-edge

  constructor(position: Vec3, id?: string) {
    this.id = id || generateId();
    this.pos = { ...position };
  }

  clone(): Vertex {
    return new Vertex(this.pos, this.id);
  }

  distanceTo(other: Vertex): number {
    const dx = this.pos.x - other.pos.x;
    const dy = this.pos.y - other.pos.y;
    const dz = this.pos.z - other.pos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  translate(offset: Vec3): void {
    this.pos.x += offset.x;
    this.pos.y += offset.y;
    this.pos.z += offset.z;
  }

  setPosition(position: Vec3): void {
    this.pos.x = position.x;
    this.pos.y = position.y;
    this.pos.z = position.z;
  }
}