import { Mesh, Vec3 } from './types.js';
import { BaseCommand } from './command.js';
import { HalfEdgeMesh } from './mesh.js';

export class MoveVertexCommand extends BaseCommand {
  private vertexId: string;
  private newPosition: Vec3;
  private originalPosition?: Vec3;

  constructor(vertexId: string, newPosition: Vec3) {
    super('move_vertex');
    this.vertexId = vertexId;
    this.newPosition = newPosition;
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const vertex = halfEdgeMesh.getVertex(this.vertexId);
    
    if (!vertex) {
      console.error('Vertex not found:', this.vertexId);
      return;
    }

    // Store original position for undo
    this.originalPosition = { ...vertex.pos };
    
    // Update vertex position
    vertex.pos = { ...this.newPosition };
    
    // Recalculate normals for adjacent faces
    this.recalculateAdjacentFaceNormals(halfEdgeMesh, this.vertexId);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const vertex = halfEdgeMesh.getVertex(this.vertexId);
    
    if (!vertex || !this.originalPosition) {
      console.error('Cannot undo vertex move');
      return;
    }

    // Restore original position
    vertex.pos = { ...this.originalPosition };
    
    // Recalculate normals for adjacent faces
    this.recalculateAdjacentFaceNormals(halfEdgeMesh, this.vertexId);
  }

  private recalculateAdjacentFaceNormals(mesh: HalfEdgeMesh, vertexId: string): void {
    const vertex = mesh.getVertex(vertexId);
    if (!vertex?.halfEdge) return;

    const visitedFaces = new Set<string>();
    let currentHalfEdgeId = vertex.halfEdge;
    const startHalfEdgeId = currentHalfEdgeId;

    do {
      const halfEdge = mesh.getHalfEdge(currentHalfEdgeId);
      if (!halfEdge?.face) break;

      if (!visitedFaces.has(halfEdge.face)) {
        visitedFaces.add(halfEdge.face);
        const face = mesh.getFace(halfEdge.face);
        if (face) {
          const faceVertices = mesh.getFaceVertices(halfEdge.face);
          if (faceVertices.length >= 3) {
            // Recalculate normal
            const v1 = faceVertices[1].pos;
            const v2 = faceVertices[0].pos;
            const v3 = faceVertices[2].pos;
            
            const edge1 = { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
            const edge2 = { x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z };
            
            const normal = {
              x: edge1.y * edge2.z - edge1.z * edge2.y,
              y: edge1.z * edge2.x - edge1.x * edge2.z,
              z: edge1.x * edge2.y - edge1.y * edge2.x
            };
            
            const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
            if (length > 0) {
              face.normal = {
                x: normal.x / length,
                y: normal.y / length,
                z: normal.z / length
              };
            }
          }
        }
      }

      // Move to next half-edge around vertex
      const twin = halfEdge?.twin;
      if (!twin) break;
      
      const twinHalfEdge = mesh.getHalfEdge(twin);
      currentHalfEdgeId = twinHalfEdge?.next || '';
    } while (currentHalfEdgeId && currentHalfEdgeId !== startHalfEdgeId);
  }
}

export class DeleteVertexCommand extends BaseCommand {
  private vertexId: string;
  private originalMeshState?: string;

  constructor(vertexId: string) {
    super('delete_vertex');
    this.vertexId = vertexId;
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

    // TODO: Implement proper vertex deletion with topology management
    // For now, just remove the vertex (this will break topology)
    halfEdgeMesh.data.vertices.delete(this.vertexId);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo DeleteVertexCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}