import { BaseCommand } from './base-command.js';
import { Vec3 } from '../core/types.js';
import { HalfEdgeMesh, Mesh } from '../core/mesh.js';

export class CreateVertexCommand extends BaseCommand {
  private position: Vec3;
  private vertexId?: string;

  constructor(position: Vec3) {
    super('create_vertex');
    this.position = { ...position };
  }

  do(mesh: Mesh): void {
    this.vertexId = mesh.addVertex(this.position);
  }

  undo(mesh: Mesh): void {
    if (this.vertexId && mesh instanceof HalfEdgeMesh) {
      mesh.data.vertices.delete(this.vertexId);
    }
  }

  canExecute(_mesh: Mesh): boolean {
    return true;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.vertexId !== undefined;
  }

  getVertexId(): string | undefined {
    return this.vertexId;
  }
}

export class CreateFaceFromVerticesCommand extends BaseCommand {
  private vertexIds: string[];
  private faceId?: string;
  private originalMeshState?: string;

  constructor(vertexIds: string[]) {
    super('create_face_from_vertices');
    this.vertexIds = [...vertexIds];
  }

  do(mesh: Mesh): void {
    if (this.vertexIds.length < 3) {
      throw new Error('Face must have at least 3 vertices');
    }

    // Store original state for undo
    if (mesh instanceof HalfEdgeMesh) {
      this.originalMeshState = JSON.stringify({
        vertices: Array.from(mesh.data.vertices.entries()),
        halfEdges: Array.from(mesh.data.halfEdges.entries()),
        edges: Array.from(mesh.data.edges.entries()),
        faces: Array.from(mesh.data.faces.entries()),
      });
    }

    this.faceId = mesh.addFace(this.vertexIds);
  }

  undo(mesh: Mesh): void {
    if (!this.originalMeshState || !(mesh instanceof HalfEdgeMesh)) {
      throw new Error('Cannot undo CreateFaceFromVerticesCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    mesh.data.vertices = new Map(originalState.vertices);
    mesh.data.halfEdges = new Map(originalState.halfEdges);
    mesh.data.edges = new Map(originalState.edges);
    mesh.data.faces = new Map(originalState.faces);
  }

  canExecute(mesh: Mesh): boolean {
    if (this.vertexIds.length < 3) return false;
    
    // Check that all vertices exist
    for (const vertexId of this.vertexIds) {
      if (!mesh.getVertex(vertexId)) {
        return false;
      }
    }
    return true;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.originalMeshState !== undefined;
  }

  getFaceId(): string | undefined {
    return this.faceId;
  }
}

export class CreateQuadCommand extends BaseCommand {
  private center: Vec3;
  private size: number;
  private vertexIds: string[] = [];
  private faceId?: string;

  constructor(center: Vec3, size: number = 1) {
    super('create_quad');
    this.center = { ...center };
    this.size = size;
  }

  do(mesh: Mesh): void {
    const half = this.size / 2;
    
    // Create four vertices for a quad
    const positions = [
      { x: this.center.x - half, y: this.center.y, z: this.center.z - half },
      { x: this.center.x + half, y: this.center.y, z: this.center.z - half },
      { x: this.center.x + half, y: this.center.y, z: this.center.z + half },
      { x: this.center.x - half, y: this.center.y, z: this.center.z + half },
    ];

    this.vertexIds = positions.map(pos => mesh.addVertex(pos));
    this.faceId = mesh.addFace(this.vertexIds);
  }

  undo(mesh: Mesh): void {
    if (mesh instanceof HalfEdgeMesh) {
      // Remove face first
      if (this.faceId) {
        mesh.data.faces.delete(this.faceId);
      }
      
      // Remove vertices
      for (const vertexId of this.vertexIds) {
        mesh.data.vertices.delete(vertexId);
      }
      
      // Clean up orphaned edges and half-edges
      const edgeEntries = Array.from(mesh.data.edges.entries());
      for (const [edgeId, edge] of edgeEntries) {
        const halfEdge = mesh.data.halfEdges.get(edge.halfEdge);
        if (!halfEdge || !mesh.data.vertices.has(halfEdge.vertex)) {
          mesh.data.edges.delete(edgeId);
        }
      }
      
      const halfEdgeEntries = Array.from(mesh.data.halfEdges.entries());
      for (const [halfEdgeId, halfEdge] of halfEdgeEntries) {
        if (!mesh.data.vertices.has(halfEdge.vertex)) {
          mesh.data.halfEdges.delete(halfEdgeId);
        }
      }
    }
  }

  canExecute(_mesh: Mesh): boolean {
    return true;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.vertexIds.length > 0;
  }
}

export class CreateCircleCommand extends BaseCommand {
  private center: Vec3;
  private radius: number;
  private segments: number;
  private vertexIds: string[] = [];
  private faceId?: string;

  constructor(center: Vec3, radius: number = 1, segments: number = 8) {
    super('create_circle');
    this.center = { ...center };
    this.radius = radius;
    this.segments = Math.max(3, segments);
  }

  do(mesh: Mesh): void {
    // Create vertices in a circle
    for (let i = 0; i < this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2;
      const x = this.center.x + Math.cos(angle) * this.radius;
      const z = this.center.z + Math.sin(angle) * this.radius;
      
      const vertexId = mesh.addVertex({
        x,
        y: this.center.y,
        z
      });
      this.vertexIds.push(vertexId);
    }

    this.faceId = mesh.addFace(this.vertexIds);
  }

  undo(mesh: Mesh): void {
    if (mesh instanceof HalfEdgeMesh) {
      // Remove face first
      if (this.faceId) {
        mesh.data.faces.delete(this.faceId);
      }
      
      // Remove vertices
      for (const vertexId of this.vertexIds) {
        mesh.data.vertices.delete(vertexId);
      }
      
      // Clean up orphaned edges and half-edges
      const edgeEntries = Array.from(mesh.data.edges.entries());
      for (const [edgeId, edge] of edgeEntries) {
        const halfEdge = mesh.data.halfEdges.get(edge.halfEdge);
        if (!halfEdge || !mesh.data.vertices.has(halfEdge.vertex)) {
          mesh.data.edges.delete(edgeId);
        }
      }
      
      const halfEdgeEntries = Array.from(mesh.data.halfEdges.entries());
      for (const [halfEdgeId, halfEdge] of halfEdgeEntries) {
        if (!mesh.data.vertices.has(halfEdge.vertex)) {
          mesh.data.halfEdges.delete(halfEdgeId);
        }
      }
    }
  }

  canExecute(_mesh: Mesh): boolean {
    return true;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.vertexIds.length > 0;
  }
}