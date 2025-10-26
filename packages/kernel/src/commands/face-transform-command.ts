import { BaseCommand } from './base-command.js';
import { Vec3 } from '../core/types.js';
import { vec3Add } from '../utils/math.js';

interface Mesh {
  getFace(id: string): any;
  getFaceVertices(id: string): any[];
  updateVertex(id: string, position: Vec3): void;
  recalculateNormals?(): void;
}

export class FaceTransformCommand extends BaseCommand {
  private faceId: string;
  private offset: Vec3;
  private originalPositions: Map<string, Vec3> = new Map();

  constructor(faceId: string, offset: Vec3) {
    super('face_transform');
    this.faceId = faceId;
    this.offset = { ...offset };
  }

  do(mesh: Mesh): void {
    const face = mesh.getFace(this.faceId);
    if (!face) {
      throw new Error(`Face ${this.faceId} not found`);
    }

    const faceVertices = mesh.getFaceVertices(this.faceId);
    if (!faceVertices || faceVertices.length === 0) {
      throw new Error(`No vertices found for face ${this.faceId}`);
    }

    // Store original positions for undo
    this.originalPositions.clear();
    for (const vertex of faceVertices) {
      this.originalPositions.set(vertex.id, { ...vertex.pos });
    }

    // Move all vertices of the face by the offset
    for (const vertex of faceVertices) {
      const newPosition = vec3Add(vertex.pos, this.offset);
      mesh.updateVertex(vertex.id, newPosition);
    }

    // Recalculate normals if method exists
    if (mesh.recalculateNormals) {
      mesh.recalculateNormals();
    }
  }

  undo(mesh: Mesh): void {
    if (this.originalPositions.size === 0) {
      throw new Error('Cannot undo - no original positions stored');
    }

    // Restore original positions
    for (const [vertexId, originalPos] of this.originalPositions) {
      mesh.updateVertex(vertexId, originalPos);
    }

    // Recalculate normals if method exists
    if (mesh.recalculateNormals) {
      mesh.recalculateNormals();
    }
  }

  canExecute(mesh: Mesh): boolean {
    const face = mesh.getFace(this.faceId);
    return face !== undefined;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.originalPositions.size > 0;
  }
}