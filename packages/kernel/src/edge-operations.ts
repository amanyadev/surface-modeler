import { Mesh } from './types.js';
import { BaseCommand } from './commands/base-command.js';
import { HalfEdgeMesh } from './mesh.js';
import { generateId } from './utils.js';
import { Vec3 } from './types.js';

export class SubdivideEdgeCommand extends BaseCommand {
  private edgeId: string;
  private originalMeshState?: string;
  private subdivisions: number;

  constructor(edgeId: string, subdivisions: number = 1) {
    super('subdivide_edge');
    this.edgeId = edgeId;
    this.subdivisions = Math.max(1, subdivisions);
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;

    console.log(' SUBDIVIDE EDGE COMMAND EXECUTING 🔪🔪🔪');
    console.log(' SubdivideEdgeCommand starting for edge:', this.edgeId);
    console.log(' Mesh before subdivision:', {
      vertices: halfEdgeMesh.data.vertices.size,
      edges: halfEdgeMesh.data.edges.size,
      halfEdges: halfEdgeMesh.data.halfEdges.size,
      faces: halfEdgeMesh.data.faces.size
    });

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

    console.log(' Found edge:', edge);

    // Get the two half-edges that make up this edge
    const halfEdge1 = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge1) {
      throw new Error(`Primary half-edge ${edge.halfEdge} not found`);
    }

    const halfEdge2 = halfEdge1.twin ? halfEdgeMesh.getHalfEdge(halfEdge1.twin) : null;

    // Get the source and target vertices of the half-edge
    const targetVertex = halfEdgeMesh.getVertex(halfEdge1.vertex);
    const prevHalfEdge = halfEdge1.prev ? halfEdgeMesh.getHalfEdge(halfEdge1.prev) : null;
    const sourceVertex = prevHalfEdge ? halfEdgeMesh.getVertex(prevHalfEdge.vertex) : null;

    if (!targetVertex || !sourceVertex) {
      throw new Error('Could not find edge vertices');
    }

    // Create subdivision vertices
    const newVertices: string[] = [];
    for (let i = 1; i <= this.subdivisions; i++) {
      const t = i / (this.subdivisions + 1);
      const subdivisionPoint: Vec3 = {
        x: sourceVertex.pos.x + (targetVertex.pos.x - sourceVertex.pos.x) * t,
        y: sourceVertex.pos.y + (targetVertex.pos.y - sourceVertex.pos.y) * t,
        z: sourceVertex.pos.z + (targetVertex.pos.z - sourceVertex.pos.z) * t,
      };
      const newVertex = halfEdgeMesh.addVertex(subdivisionPoint);
      newVertices.push(newVertex.id);
    }

    // Subdivide both sides and maintain twin relationships
    const newHalfEdges1 = this.subdivideHalfEdgeChain(halfEdgeMesh, halfEdge1, newVertices);
    let newHalfEdges2: string[] = [];
    if (halfEdge2) {
      newHalfEdges2 = this.subdivideHalfEdgeChain(halfEdgeMesh, halfEdge2, [...newVertices].reverse());
    }

    // Create twin relationships and edges for new segments
    this.createTwinRelationships(halfEdgeMesh, newHalfEdges1, newHalfEdges2);

    // Update vertex half-edge references
    this.updateVertexReferences(halfEdgeMesh, newVertices, newHalfEdges1, newHalfEdges2);

    // Remove the original edge after everything is properly linked
    halfEdgeMesh.data.edges.delete(this.edgeId);

    console.log(' Subdivision completed. Mesh after subdivision:', {
      vertices: halfEdgeMesh.data.vertices.size,
      edges: halfEdgeMesh.data.edges.size,
      halfEdges: halfEdgeMesh.data.halfEdges.size,
      faces: halfEdgeMesh.data.faces.size
    });
    console.log(' New vertices created:', newVertices.length, 'subdivisions');
  }

  private subdivideHalfEdgeChain(mesh: HalfEdgeMesh, halfEdge: any, newVertexIds: string[]): string[] {
    console.log('Subdividing half-edge chain:', halfEdge.id, 'inserting vertices:', newVertexIds);

    if (newVertexIds.length === 0) return [halfEdge.id];

    const originalTargetVertex = halfEdge.vertex;
    const originalNext = halfEdge.next;
    const newHalfEdges: string[] = [halfEdge.id];

    let currentHalfEdge = halfEdge;

    // Create chain of half-edges through all subdivision vertices
    for (let i = 0; i < newVertexIds.length; i++) {
      const newVertexId = newVertexIds[i];
      const isLast = i === newVertexIds.length - 1;

      // Create new half-edge for this segment
      const newHalfEdgeId = generateId();
      const newHalfEdge = {
        id: newHalfEdgeId,
        vertex: isLast ? originalTargetVertex : newVertexIds[i + 1],
        face: halfEdge.face,
        next: isLast ? originalNext : undefined,
        prev: currentHalfEdge.id,
        twin: undefined as any,
        edge: undefined as any,
      };

      // Update current half-edge to point to new vertex
      currentHalfEdge.vertex = newVertexId;
      currentHalfEdge.next = newHalfEdgeId;

      // Add the new half-edge to mesh
      mesh.data.halfEdges.set(newHalfEdgeId, newHalfEdge);
      newHalfEdges.push(newHalfEdgeId);

      currentHalfEdge = newHalfEdge;
    }

    // Update the next half-edge's prev pointer
    if (originalNext) {
      const nextHalfEdge = mesh.getHalfEdge(originalNext);
      if (nextHalfEdge) {
        nextHalfEdge.prev = currentHalfEdge.id;
      }
    }

    return newHalfEdges;
  }

  private createTwinRelationships(mesh: HalfEdgeMesh, halfEdges1: string[], halfEdges2: string[]): void {
    // If there's no twin side, create boundary edges
    if (halfEdges2.length === 0) {
      for (const halfEdgeId of halfEdges1) {
        const halfEdge = mesh.getHalfEdge(halfEdgeId);
        if (halfEdge && !halfEdge.edge) {
          const edgeId = generateId();
          const edge = { id: edgeId, halfEdge: halfEdgeId };
          mesh.data.edges.set(edgeId, edge);
          halfEdge.edge = edgeId;
        }
      }
      return;
    }

    // Create twin pairs and edges for each segment
    const maxSegments = Math.max(halfEdges1.length, halfEdges2.length);
    for (let i = 0; i < maxSegments; i++) {
      const halfEdgeId1 = halfEdges1[i];
      const halfEdgeId2 = halfEdges2[halfEdges2.length - 1 - i]; // Reverse order for twins

      if (halfEdgeId1 && halfEdgeId2) {
        const halfEdge1 = mesh.getHalfEdge(halfEdgeId1);
        const halfEdge2 = mesh.getHalfEdge(halfEdgeId2);

        if (halfEdge1 && halfEdge2) {
          // Set twin relationships
          halfEdge1.twin = halfEdgeId2;
          halfEdge2.twin = halfEdgeId1;

          // Create single edge for this twin pair
          const edgeId = generateId();
          const edge = { id: edgeId, halfEdge: halfEdgeId1 };
          mesh.data.edges.set(edgeId, edge);

          halfEdge1.edge = edgeId;
          halfEdge2.edge = edgeId;
        }
      }
    }
  }

  private updateVertexReferences(mesh: HalfEdgeMesh, newVertexIds: string[], halfEdges1: string[], halfEdges2: string[]): void {
    // Update vertex half-edge references for all new vertices
    for (let i = 0; i < newVertexIds.length; i++) {
      const vertex = mesh.getVertex(newVertexIds[i]);
      if (vertex) {
        // Find a half-edge emanating from this vertex
        const outgoingHalfEdge = halfEdges1[i] || halfEdges2[i];
        if (outgoingHalfEdge) {
          vertex.halfEdge = outgoingHalfEdge;
        }
      }
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo - no original state stored');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);

    halfEdgeMesh.data.vertices.clear();
    halfEdgeMesh.data.halfEdges.clear();
    halfEdgeMesh.data.edges.clear();
    halfEdgeMesh.data.faces.clear();

    for (const [id, vertex] of originalState.vertices) {
      halfEdgeMesh.data.vertices.set(id, vertex);
    }
    for (const [id, halfEdge] of originalState.halfEdges) {
      halfEdgeMesh.data.halfEdges.set(id, halfEdge);
    }
    for (const [id, edge] of originalState.edges) {
      halfEdgeMesh.data.edges.set(id, edge);
    }
    for (const [id, face] of originalState.faces) {
      halfEdgeMesh.data.faces.set(id, face);
    }
  }

  canExecute(mesh: Mesh): boolean {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const edge = halfEdgeMesh.getEdge(this.edgeId);
    return edge !== undefined && this.subdivisions > 0;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.originalMeshState !== undefined;
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

    const edge = halfEdgeMesh.getEdge(this.edgeId);
    if (!edge) {
      throw new Error(`Edge ${this.edgeId} not found`);
    }

    // Get the two half-edges that make up this edge
    const halfEdge1 = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge1) {
      throw new Error(`Primary half-edge ${edge.halfEdge} not found`);
    }

    const halfEdge2 = halfEdge1.twin ? halfEdgeMesh.getHalfEdge(halfEdge1.twin) : null;

    // Check if this is a boundary edge (only one face)
    if (!halfEdge2 || !halfEdge1.face || !halfEdge2.face) {
      throw new Error('Cannot delete boundary edges - operation not supported');
    }

    // Get the two faces that will be merged
    const face1 = halfEdgeMesh.getFace(halfEdge1.face);
    const face2 = halfEdgeMesh.getFace(halfEdge2.face);

    if (!face1 || !face2) {
      throw new Error('Could not find faces adjacent to edge');
    }

    if (face1.id === face2.id) {
      throw new Error('Cannot delete edge - both half-edges belong to same face');
    }

    // Merge the faces by combining their vertex loops
    this.mergeFaces(halfEdgeMesh, face1, face2, halfEdge1, halfEdge2);

    // Remove the edge and its half-edges
    halfEdgeMesh.data.edges.delete(this.edgeId);
    halfEdgeMesh.data.halfEdges.delete(halfEdge1.id);
    halfEdgeMesh.data.halfEdges.delete(halfEdge2.id);

    // Remove the second face (keep the first one)
    halfEdgeMesh.data.faces.delete(face2.id);
  }

  private mergeFaces(mesh: HalfEdgeMesh, face1: any, face2: any, halfEdge1: any, halfEdge2: any): void {
    // Get all vertices from both faces
    const face1Vertices = mesh.getFaceVertices(face1.id);
    const face2Vertices = mesh.getFaceVertices(face2.id);

    // Find the vertices that are shared by the edge being deleted
    const sharedVertex1 = mesh.getVertex(halfEdge1.vertex);
    const prevHalfEdge1 = halfEdge1.prev ? mesh.getHalfEdge(halfEdge1.prev) : null;
    const sharedVertex2 = prevHalfEdge1 ? mesh.getVertex(prevHalfEdge1.vertex) : null;

    if (!sharedVertex1 || !sharedVertex2) {
      throw new Error('Could not find shared vertices of edge');
    }

    // Create new vertex list by combining face loops, excluding the shared edge
    const newVertexIds = this.mergeVertexLoops(
      face1Vertices.map(v => v.id),
      face2Vertices.map(v => v.id),
      sharedVertex1.id,
      sharedVertex2.id
    );

    // Remove old half-edges from face1 (except those we're deleting)
    this.removeOldHalfEdges(mesh, face1.id, [halfEdge1.id]);

    // Remove old half-edges from face2 (except those we're deleting)  
    this.removeOldHalfEdges(mesh, face2.id, [halfEdge2.id]);

    // Create new half-edges for the merged face
    this.createMergedFaceHalfEdges(mesh, face1.id, newVertexIds);

    // Update face1 to reference one of the new half-edges
    const firstNewHalfEdge = Array.from(mesh.data.halfEdges.values())
      .find(he => he.face === face1.id);
    if (firstNewHalfEdge) {
      face1.halfEdge = firstNewHalfEdge.id;
    }
  }

  private mergeVertexLoops(
    face1VertexIds: string[],
    face2VertexIds: string[],
    sharedVertex1Id: string,
    sharedVertex2Id: string
  ): string[] {
    // Find positions of shared vertices in each face
    const face1Shared1Idx = face1VertexIds.indexOf(sharedVertex1Id);
    const face1Shared2Idx = face1VertexIds.indexOf(sharedVertex2Id);
    const face2Shared1Idx = face2VertexIds.indexOf(sharedVertex1Id);
    const face2Shared2Idx = face2VertexIds.indexOf(sharedVertex2Id);

    if (face1Shared1Idx === -1 || face1Shared2Idx === -1 || 
        face2Shared1Idx === -1 || face2Shared2Idx === -1) {
      throw new Error('Shared vertices not found in face vertex lists');
    }

    // Extract the portions of each face that don't include the shared edge
    const face1Portion = this.extractFacePortion(face1VertexIds, face1Shared1Idx, face1Shared2Idx);
    const face2Portion = this.extractFacePortion(face2VertexIds, face2Shared2Idx, face2Shared1Idx);

    // Combine the portions
    return [...face1Portion, ...face2Portion];
  }

  private extractFacePortion(vertexIds: string[], startIdx: number, endIdx: number): string[] {
    const result: string[] = [];
    const length = vertexIds.length;
    
    let currentIdx = startIdx;
    while (currentIdx !== endIdx) {
      result.push(vertexIds[currentIdx]);
      currentIdx = (currentIdx + 1) % length;
    }
    
    return result;
  }

  private removeOldHalfEdges(mesh: HalfEdgeMesh, faceId: string, excludeIds: string[]): void {
    const toRemove: string[] = [];
    
    for (const [id, halfEdge] of mesh.data.halfEdges.entries()) {
      if (halfEdge.face === faceId && !excludeIds.includes(id)) {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      mesh.data.halfEdges.delete(id);
    }
  }

  private createMergedFaceHalfEdges(mesh: HalfEdgeMesh, faceId: string, vertexIds: string[]): void {
    if (vertexIds.length < 3) {
      throw new Error('Merged face must have at least 3 vertices');
    }

    const halfEdgeIds: string[] = [];

    // Create half-edges for the merged face
    for (let i = 0; i < vertexIds.length; i++) {
      const halfEdgeId = generateId();
      halfEdgeIds.push(halfEdgeId);

      const halfEdge = {
        id: halfEdgeId,
        vertex: vertexIds[(i + 1) % vertexIds.length], // Target vertex
        face: faceId,
        next: undefined,
        prev: undefined,
        twin: undefined as any,
        edge: undefined as any,
      };

      mesh.data.halfEdges.set(halfEdgeId, halfEdge);
    }

    // Link next/prev pointers
    for (let i = 0; i < halfEdgeIds.length; i++) {
      const halfEdge = mesh.data.halfEdges.get(halfEdgeIds[i]);
      if (halfEdge) {
        halfEdge.next = halfEdgeIds[(i + 1) % halfEdgeIds.length];
        halfEdge.prev = halfEdgeIds[(i - 1 + halfEdgeIds.length) % halfEdgeIds.length];
      }
    }

    // Update vertex half-edge references if needed
    for (let i = 0; i < vertexIds.length; i++) {
      const vertex = mesh.getVertex(vertexIds[i]);
      if (vertex && !vertex.halfEdge) {
        vertex.halfEdge = halfEdgeIds[i];
      }
    }

    // Create edges for boundary half-edges (simplified approach)
    for (const halfEdgeId of halfEdgeIds) {
      const halfEdge = mesh.data.halfEdges.get(halfEdgeId);
      if (halfEdge && !halfEdge.edge) {
        const edgeId = generateId();
        const edge = {
          id: edgeId,
          halfEdge: halfEdgeId,
        };
        mesh.data.edges.set(edgeId, edge);
        halfEdge.edge = edgeId as any;
      }
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo - no original state stored');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices.clear();
    halfEdgeMesh.data.halfEdges.clear();
    halfEdgeMesh.data.edges.clear();
    halfEdgeMesh.data.faces.clear();

    for (const [id, vertex] of originalState.vertices) {
      halfEdgeMesh.data.vertices.set(id, vertex);
    }
    for (const [id, halfEdge] of originalState.halfEdges) {
      halfEdgeMesh.data.halfEdges.set(id, halfEdge);
    }
    for (const [id, edge] of originalState.edges) {
      halfEdgeMesh.data.edges.set(id, edge);
    }
    for (const [id, face] of originalState.faces) {
      halfEdgeMesh.data.faces.set(id, face);
    }
  }

  canExecute(mesh: Mesh): boolean {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const edge = halfEdgeMesh.getEdge(this.edgeId);
    if (!edge) return false;

    const halfEdge1 = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge1) return false;

    const halfEdge2 = halfEdge1.twin ? halfEdgeMesh.getHalfEdge(halfEdge1.twin) : null;
    
    // Can only delete edges that have two faces (not boundary edges)
    return halfEdge2 !== null && 
           halfEdge1.face !== undefined && 
           halfEdge2!.face !== undefined && 
           halfEdge1.face !== halfEdge2!.face;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.originalMeshState !== undefined;
  }
}