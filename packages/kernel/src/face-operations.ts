import { Mesh } from './types.js';
import { BaseCommand } from './command.js';
import { HalfEdgeMesh } from './mesh.js';

export class MergeFacesCommand extends BaseCommand {
  private faceIds: string[];
  private originalMeshState?: string;

  constructor(faceIds: string[]) {
    super('merge_faces');
    this.faceIds = faceIds;
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    
    if (this.faceIds.length < 2) {
      console.error('Need at least 2 faces to merge');
      return;
    }

    // Store original state for undo
    this.originalMeshState = JSON.stringify({
      vertices: Array.from(halfEdgeMesh.data.vertices.entries()),
      halfEdges: Array.from(halfEdgeMesh.data.halfEdges.entries()),
      edges: Array.from(halfEdgeMesh.data.edges.entries()),
      faces: Array.from(halfEdgeMesh.data.faces.entries()),
    });

    // Get all vertices from all faces
    const allVertices = new Set<string>();
    for (const faceId of this.faceIds) {
      const faceVertices = halfEdgeMesh.getFaceVertices(faceId);
      faceVertices.forEach(v => allVertices.add(v.id));
    }

    // Remove original faces
    for (const faceId of this.faceIds) {
      halfEdgeMesh.data.faces.delete(faceId);
    }

    // Create new merged face (simplified - just create a face with all vertices)
    if (allVertices.size >= 3) {
      const vertexArray = Array.from(allVertices);
      halfEdgeMesh.addFace(vertexArray);
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo MergeFacesCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class SplitFaceCommand extends BaseCommand {
  private faceId: string;
  private originalMeshState?: string;

  constructor(faceId: string, _splitVertices: string[]) {
    super('split_face');
    this.faceId = faceId;
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    
    // Store original state for undo
    this.originalMeshState = JSON.stringify({
      vertices: Array.from(halfEdgeMesh.data.vertices.entries()),
      halfEdges: Array.from(halfEdgeMesh.data.halfEdges.entries()),
      edges: Array.from(halfEdgeMesh.data.edges.entries()),
      faces: Array.from(halfEdgeMesh.data.faces.entries()),
    });

    // TODO: Implement proper face splitting
    // This is a placeholder that just removes the face
    halfEdgeMesh.data.faces.delete(this.faceId);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo SplitFaceCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}