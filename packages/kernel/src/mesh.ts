import {
  Mesh,
  MeshData,
  Vertex,
  HalfEdge,
  Edge,
  Face,
  Command,
  Vec3,
} from './types.js';
import { generateId, calculateFaceNormal } from './utils.js';

export class HalfEdgeMesh implements Mesh {
  id: string;
  data: MeshData;

  constructor(id?: string) {
    this.id = id || generateId();
    this.data = {
      vertices: new Map(),
      halfEdges: new Map(),
      edges: new Map(),
      faces: new Map(),
    };
  }

  vertices(): Vertex[] {
    return Array.from(this.data.vertices.values());
  }

  faces(): Face[] {
    return Array.from(this.data.faces.values());
  }

  edges(): Edge[] {
    return Array.from(this.data.edges.values());
  }

  halfEdges(): HalfEdge[] {
    return Array.from(this.data.halfEdges.values());
  }

  getVertex(id: string): Vertex | undefined {
    return this.data.vertices.get(id);
  }

  getFace(id: string): Face | undefined {
    return this.data.faces.get(id);
  }

  getHalfEdge(id: string): HalfEdge | undefined {
    return this.data.halfEdges.get(id);
  }

  getEdge(id: string): Edge | undefined {
    return this.data.edges.get(id);
  }

  addVertex(pos: Vec3, id?: string): Vertex {
    const vertex: Vertex = {
      id: id || generateId(),
      pos: { ...pos },
    };
    this.data.vertices.set(vertex.id, vertex);
    return vertex;
  }

  addFace(vertexIds: string[], id?: string): Face | null {
    if (vertexIds.length < 3) return null;

    const faceId = id || generateId();
    const halfEdgeIds: string[] = [];

    // Create half-edges for this face
    for (let i = 0; i < vertexIds.length; i++) {
      const halfEdgeId = generateId();
      halfEdgeIds.push(halfEdgeId);

      const halfEdge: HalfEdge = {
        id: halfEdgeId,
        vertex: vertexIds[(i + 1) % vertexIds.length], // Target vertex
        face: faceId,
      };

      this.data.halfEdges.set(halfEdgeId, halfEdge);
    }

    // Link next/prev pointers
    for (let i = 0; i < halfEdgeIds.length; i++) {
      const halfEdge = this.data.halfEdges.get(halfEdgeIds[i])!;
      halfEdge.next = halfEdgeIds[(i + 1) % halfEdgeIds.length];
      halfEdge.prev = halfEdgeIds[(i - 1 + halfEdgeIds.length) % halfEdgeIds.length];
    }

    // Update vertex half-edge references
    for (let i = 0; i < vertexIds.length; i++) {
      const vertex = this.data.vertices.get(vertexIds[i]);
      if (vertex && !vertex.halfEdge) {
        vertex.halfEdge = halfEdgeIds[i];
      }
    }

    // Create edges and link twins
    for (let i = 0; i < halfEdgeIds.length; i++) {
      const halfEdgeId = halfEdgeIds[i];
      const halfEdge = this.data.halfEdges.get(halfEdgeId)!;
      
      // Find twin half-edge
      const sourceVertex = vertexIds[i];
      const targetVertex = halfEdge.vertex;
      
      // Look for existing twin
      for (const [existingId, existingHalfEdge] of this.data.halfEdges) {
        if (
          existingId !== halfEdgeId &&
          !existingHalfEdge.twin &&
          existingHalfEdge.vertex === sourceVertex
        ) {
          // Check if this could be a twin by traversing to find source
          const twinSource = this.getHalfEdgeSourceVertex(existingId);
          if (twinSource === targetVertex) {
            halfEdge.twin = existingId;
            existingHalfEdge.twin = halfEdgeId;
            
            // Create edge if it doesn't exist
            if (!halfEdge.edge) {
              const edgeId = generateId();
              const edge: Edge = { id: edgeId, halfEdge: halfEdgeId };
              this.data.edges.set(edgeId, edge);
              halfEdge.edge = edgeId;
              existingHalfEdge.edge = edgeId;
            }
            break;
          }
        }
      }
      
      // If no twin found, create edge anyway
      if (!halfEdge.edge) {
        const edgeId = generateId();
        const edge: Edge = { id: edgeId, halfEdge: halfEdgeId };
        this.data.edges.set(edgeId, edge);
        halfEdge.edge = edgeId;
      }
    }

    // Calculate face normal
    const faceVertices = vertexIds.map(id => {
      const vertex = this.data.vertices.get(id);
      if (!vertex) {
        throw new Error(`Vertex with id ${id} not found`);
      }
      return vertex.pos;
    });
    const normal = calculateFaceNormal(faceVertices);

    const face: Face = {
      id: faceId,
      halfEdge: halfEdgeIds[0],
      normal,
    };

    this.data.faces.set(faceId, face);
    return face;
  }

  private getHalfEdgeSourceVertex(halfEdgeId: string): string | null {
    const halfEdge = this.data.halfEdges.get(halfEdgeId);
    if (!halfEdge?.prev) return null;
    
    const prevHalfEdge = this.data.halfEdges.get(halfEdge.prev);
    if (!prevHalfEdge) return null;
    
    return prevHalfEdge.vertex;
  }

  getFaceVertices(faceId: string): Vertex[] {
    const face = this.data.faces.get(faceId);
    if (!face) return [];

    const vertices: Vertex[] = [];
    let currentHalfEdgeId = face.halfEdge;
    const startHalfEdgeId = currentHalfEdgeId;

    do {
      const halfEdge = this.data.halfEdges.get(currentHalfEdgeId);
      if (!halfEdge) break;

      const vertex = this.data.vertices.get(halfEdge.vertex);
      if (vertex) vertices.push(vertex);

      currentHalfEdgeId = halfEdge.next || '';
    } while (currentHalfEdgeId && currentHalfEdgeId !== startHalfEdgeId);

    return vertices;
  }

  clone(): Mesh {
    const cloned = new HalfEdgeMesh();
    
    // Deep clone all data
    cloned.data.vertices = new Map(
      Array.from(this.data.vertices.entries()).map(([id, vertex]) => [
        id,
        { ...vertex, pos: { ...vertex.pos } },
      ])
    );
    
    cloned.data.halfEdges = new Map(
      Array.from(this.data.halfEdges.entries()).map(([id, halfEdge]) => [
        id,
        { ...halfEdge },
      ])
    );
    
    cloned.data.edges = new Map(
      Array.from(this.data.edges.entries()).map(([id, edge]) => [
        id,
        { ...edge },
      ])
    );
    
    cloned.data.faces = new Map(
      Array.from(this.data.faces.entries()).map(([id, face]) => [
        id,
        { ...face, normal: face.normal ? { ...face.normal } : undefined },
      ])
    );

    return cloned;
  }

  applyCommand(cmd: Command): void {
    cmd.do(this);
  }
}