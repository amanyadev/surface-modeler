import { Mesh } from './types.js';
import { BaseCommand } from './command.js';
import { HalfEdgeMesh } from './mesh.js';

export class SubdivideEdgeCommand extends BaseCommand {
  private edgeId: string;
  private originalMeshState?: string;

  constructor(edgeId: string) {
    super('subdivide_edge');
    this.edgeId = edgeId;
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

    const edge = halfEdgeMesh.getEdge(this.edgeId);
    if (!edge) {
      console.error('Edge not found:', this.edgeId);
      return;
    }

    // Get the half-edge for this edge
    const halfEdge = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge) return;

    // Get the twin half-edge (for future use in proper edge subdivision)
    // const twinHalfEdge = halfEdge.twin ? halfEdgeMesh.getHalfEdge(halfEdge.twin) : null;

    // Get the two vertices of the edge
    const targetVertex = halfEdgeMesh.getVertex(halfEdge.vertex);
    const sourceVertex = halfEdge.prev ? 
      halfEdgeMesh.getHalfEdge(halfEdge.prev)?.vertex : null;
    
    if (!targetVertex || !sourceVertex) return;
    
    const sourceVertexObj = halfEdgeMesh.getVertex(sourceVertex);
    if (!sourceVertexObj) return;

    // Create midpoint vertex
    const midpoint = {
      x: (sourceVertexObj.pos.x + targetVertex.pos.x) / 2,
      y: (sourceVertexObj.pos.y + targetVertex.pos.y) / 2,
      z: (sourceVertexObj.pos.z + targetVertex.pos.z) / 2,
    };
    
    const midVertex = halfEdgeMesh.addVertex(midpoint);

    // TODO: Implement proper edge subdivision with half-edge topology
    // This is a simplified version that just adds the midpoint vertex
    console.log('Edge subdivided with midpoint vertex:', midVertex.id);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo SubdivideEdgeCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class DeleteEdgeCommand extends BaseCommand {
  private edgeId: string;
  private originalMeshState?: string;

  constructor(edgeId: string) {
    super('delete_edge');
    this.edgeId = edgeId;
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

    // TODO: Implement proper edge deletion with topology management
    // For now, just remove the edge (this will break topology)
    halfEdgeMesh.data.edges.delete(this.edgeId);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo DeleteEdgeCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}