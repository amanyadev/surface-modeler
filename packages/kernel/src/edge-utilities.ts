import { Vec3 } from './core/types.js';
import { BaseCommand } from './commands/base-command.js';
import { HalfEdgeMesh, Mesh } from './core/mesh.js';
import { vec3Add, vec3Scale, vec3Sub, vec3Length } from './utils/math.js';

export class SplitEdgeCommand extends BaseCommand {
  private edgeId: string;
  private parameter: number; // 0.0 to 1.0, position along edge
  private originalMeshState?: string;
  private newVertexId?: string;

  constructor(edgeId: string, parameter: number = 0.5) {
    super('split_edge');
    this.edgeId = edgeId;
    this.parameter = Math.max(0, Math.min(1, parameter)); // Clamp to [0,1]
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
      throw new Error(`Edge ${this.edgeId} not found`);
    }

    const halfEdge = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge || !halfEdge.twin) {
      throw new Error(`Invalid half-edge structure for edge ${this.edgeId}`);
    }

    const twin = halfEdgeMesh.getHalfEdge(halfEdge.twin);
    if (!twin) {
      throw new Error(`Twin half-edge not found for edge ${this.edgeId}`);
    }

    // Get the two vertices of the edge
    const vertex1 = halfEdgeMesh.getVertex(halfEdge.vertex);
    const vertex2 = halfEdgeMesh.getVertex(twin.vertex);
    
    if (!vertex1 || !vertex2) {
      throw new Error(`Vertices not found for edge ${this.edgeId}`);
    }

    // Calculate new vertex position
    const direction = vec3Sub(vertex2.pos, vertex1.pos);
    const offset = vec3Scale(direction, this.parameter);
    const newPos = vec3Add(vertex1.pos, offset);

    // Create new vertex
    this.newVertexId = halfEdgeMesh.addVertex(newPos);

    // This is a simplified edge split - a full implementation would:
    // 1. Split the edge into two edges
    // 2. Update all half-edge connectivity
    // 3. Handle faces adjacent to the edge
    // For now, we just add the vertex
  }

  getNewVertexId(): string | undefined {
    return this.newVertexId;
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo SplitEdgeCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
    
    this.newVertexId = undefined;
  }
}

export class WeldVerticesCommand extends BaseCommand {
  private vertexIds: string[];
  private tolerance: number;
  private originalMeshState?: string;
  private weldedVertexId?: string;

  constructor(vertexIds: string[], tolerance: number = 0.001) {
    super('weld_vertices');
    this.vertexIds = vertexIds;
    this.tolerance = tolerance;
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

    if (this.vertexIds.length < 2) {
      throw new Error('Need at least 2 vertices to weld');
    }

    // Get all vertices
    const vertices = this.vertexIds
      .map(id => halfEdgeMesh.getVertex(id))
      .filter(v => v !== undefined) as Array<NonNullable<ReturnType<typeof halfEdgeMesh.getVertex>>>;

    if (vertices.length !== this.vertexIds.length) {
      throw new Error('Some vertices not found');
    }

    // Check if vertices are within tolerance
    const firstVertex = vertices[0];
    for (let i = 1; i < vertices.length; i++) {
      const distance = vec3Length(vec3Sub(vertices[i].pos, firstVertex.pos));
      if (distance > this.tolerance) {
        throw new Error(`Vertices are too far apart to weld (distance: ${distance}, tolerance: ${this.tolerance})`);
      }
    }

    // Calculate average position
    const averagePos = { x: 0, y: 0, z: 0 };
    for (const vertex of vertices) {
      averagePos.x += vertex.pos.x;
      averagePos.y += vertex.pos.y;
      averagePos.z += vertex.pos.z;
    }
    averagePos.x /= vertices.length;
    averagePos.y /= vertices.length;
    averagePos.z /= vertices.length;

    // Create new welded vertex
    this.weldedVertexId = halfEdgeMesh.addVertex(averagePos);

    // Update all half-edges to reference the new vertex
    for (const [_, halfEdge] of halfEdgeMesh.data.halfEdges) {
      if (this.vertexIds.includes(halfEdge.vertex)) {
        halfEdge.vertex = this.weldedVertexId;
      }
    }

    // Remove old vertices
    for (const vertexId of this.vertexIds) {
      halfEdgeMesh.data.vertices.delete(vertexId);
    }
  }

  getWeldedVertexId(): string | undefined {
    return this.weldedVertexId;
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo WeldVerticesCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
    
    this.weldedVertexId = undefined;
  }
}

export class CollapseEdgeCommand extends BaseCommand {
  private edgeId: string;
  private originalMeshState?: string;

  constructor(edgeId: string) {
    super('collapse_edge');
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
      throw new Error(`Edge ${this.edgeId} not found`);
    }

    const halfEdge = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge || !halfEdge.twin) {
      throw new Error(`Invalid half-edge structure for edge ${this.edgeId}`);
    }

    const twin = halfEdgeMesh.getHalfEdge(halfEdge.twin);
    if (!twin) {
      throw new Error(`Twin half-edge not found for edge ${this.edgeId}`);
    }

    // Get the two vertices of the edge
    const vertex1 = halfEdgeMesh.getVertex(halfEdge.vertex);
    const vertex2 = halfEdgeMesh.getVertex(twin.vertex);
    
    if (!vertex1 || !vertex2) {
      throw new Error(`Vertices not found for edge ${this.edgeId}`);
    }

    // Calculate midpoint
    const midpoint = {
      x: (vertex1.pos.x + vertex2.pos.x) / 2,
      y: (vertex1.pos.y + vertex2.pos.y) / 2,
      z: (vertex1.pos.z + vertex2.pos.z) / 2,
    };

    // Move first vertex to midpoint
    vertex1.setPosition(midpoint);

    // Update all half-edges that reference vertex2 to reference vertex1
    for (const [_, he] of halfEdgeMesh.data.halfEdges) {
      if (he.vertex === vertex2.id) {
        he.vertex = vertex1.id;
      }
    }

    // Remove vertex2, the edge, and its half-edges
    halfEdgeMesh.data.vertices.delete(vertex2.id);
    halfEdgeMesh.data.edges.delete(this.edgeId);
    halfEdgeMesh.data.halfEdges.delete(halfEdge.id);
    halfEdgeMesh.data.halfEdges.delete(twin.id);

    // Remove any faces that became degenerate
    const facesToRemove: string[] = [];
    for (const [faceId] of halfEdgeMesh.data.faces) {
      const faceVertices = halfEdgeMesh.getFaceVertices(faceId);
      if (faceVertices.length < 3) {
        facesToRemove.push(faceId);
      }
    }

    for (const faceId of facesToRemove) {
      halfEdgeMesh.data.faces.delete(faceId);
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo CollapseEdgeCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

// Utility functions for mesh analysis and validation
export class MeshUtilities {
  static findNearbyVertices(mesh: HalfEdgeMesh, position: Vec3, radius: number): string[] {
    const nearbyVertices: string[] = [];
    
    for (const [vertexId, vertex] of mesh.data.vertices) {
      const distance = vec3Length(vec3Sub(vertex.pos, position));
      if (distance <= radius) {
        nearbyVertices.push(vertexId);
      }
    }
    
    return nearbyVertices;
  }

  static validateMeshTopology(mesh: HalfEdgeMesh): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that every half-edge has a valid twin
    for (const [halfEdgeId, halfEdge] of mesh.data.halfEdges) {
      if (!halfEdge.twin) {
        errors.push(`Half-edge ${halfEdgeId} has no twin`);
        continue;
      }

      const twin = mesh.data.halfEdges.get(halfEdge.twin);
      if (!twin) {
        errors.push(`Half-edge ${halfEdgeId} references non-existent twin ${halfEdge.twin}`);
        continue;
      }

      if (twin.twin !== halfEdgeId) {
        errors.push(`Half-edge ${halfEdgeId} and its twin ${halfEdge.twin} don't reference each other`);
      }
    }

    // Check that every vertex referenced by half-edges exists
    for (const [halfEdgeId, halfEdge] of mesh.data.halfEdges) {
      if (!mesh.data.vertices.has(halfEdge.vertex)) {
        errors.push(`Half-edge ${halfEdgeId} references non-existent vertex ${halfEdge.vertex}`);
      }
    }

    // Check that every face referenced by half-edges exists
    for (const [halfEdgeId, halfEdge] of mesh.data.halfEdges) {
      if (halfEdge.face && !mesh.data.faces.has(halfEdge.face)) {
        errors.push(`Half-edge ${halfEdgeId} references non-existent face ${halfEdge.face}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getVertexNeighbors(mesh: HalfEdgeMesh, vertexId: string): string[] {
    const neighbors: string[] = [];
    const vertex = mesh.data.vertices.get(vertexId);
    
    if (!vertex || !vertex.halfEdge) {
      return neighbors;
    }

    // Traverse around the vertex using half-edges
    let currentHalfEdge = mesh.data.halfEdges.get(vertex.halfEdge);
    const startHalfEdge = currentHalfEdge;

    if (!currentHalfEdge) {
      return neighbors;
    }

    do {
      // Get the target vertex of this half-edge
      if (currentHalfEdge.vertex !== vertexId) {
        neighbors.push(currentHalfEdge.vertex);
      }

      // Move to the next half-edge around the vertex
      const twin: any = currentHalfEdge.twin ? mesh.data.halfEdges.get(currentHalfEdge.twin) : undefined;
      if (!twin) break;

      currentHalfEdge = twin.next ? mesh.data.halfEdges.get(twin.next) : undefined;
      if (!currentHalfEdge) break;

    } while (currentHalfEdge !== startHalfEdge);

    return neighbors;
  }

  static getFaceArea(mesh: HalfEdgeMesh, faceId: string): number {
    const faceVertices = mesh.getFaceVertices(faceId);
    if (faceVertices.length < 3) return 0;

    // Calculate area using triangulation from first vertex
    let totalArea = 0;
    const firstVertex = faceVertices[0];

    for (let i = 1; i < faceVertices.length - 1; i++) {
      const v1 = faceVertices[i];
      const v2 = faceVertices[i + 1];

      // Calculate triangle area using cross product
      const edge1 = vec3Sub(v1.pos, firstVertex.pos);
      const edge2 = vec3Sub(v2.pos, firstVertex.pos);
      
      const cross = {
        x: edge1.y * edge2.z - edge1.z * edge2.y,
        y: edge1.z * edge2.x - edge1.x * edge2.z,
        z: edge1.x * edge2.y - edge1.y * edge2.x,
      };

      const triangleArea = 0.5 * vec3Length(cross);
      totalArea += triangleArea;
    }

    return totalArea;
  }
}