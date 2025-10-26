import { Vec3 } from './types.js';
import { Vertex } from './vertex.js';
import { HalfEdge } from './half-edge.js';
import { Edge } from './edge.js';
import { Face } from './face.js';
import { MeshHierarchy, MeshNode } from './mesh-node.js';
import { generateId } from '../utils/id.js';
import { calculateFaceNormal } from '../utils/math.js';

export interface MeshData {
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  edges: Map<string, Edge>;
  faces: Map<string, Face>;
}

export abstract class Mesh {
  abstract vertices(): Vertex[];
  abstract faces(): Face[];
  abstract edges(): Edge[];
  abstract getVertex(id: string): Vertex | undefined;
  abstract getFace(id: string): Face | undefined;
  abstract getEdge(id: string): Edge | undefined;
  abstract getHalfEdge(id: string): HalfEdge | undefined;
  abstract addVertex(position: Vec3): string;
  abstract addFace(vertexIds: string[]): string;
  abstract updateVertex(id: string, position: Vec3): void;
  abstract recalculateNormals(): void;
  abstract clone(): Mesh;
}

export class HalfEdgeMesh extends Mesh {
  public readonly id: string;
  public name: string;
  public data: MeshData;
  public hierarchy: MeshHierarchy;
  public nodeId?: string; // Reference to hierarchy node

  constructor(name: string = 'Mesh', id?: string) {
    super();
    this.id = id || generateId();
    this.name = name;
    this.data = {
      vertices: new Map(),
      halfEdges: new Map(),
      edges: new Map(),
      faces: new Map(),
    };
    this.hierarchy = new MeshHierarchy();
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

  getVertex(id: string): Vertex | undefined {
    return this.data.vertices.get(id);
  }

  getFace(id: string): Face | undefined {
    return this.data.faces.get(id);
  }

  getEdge(id: string): Edge | undefined {
    return this.data.edges.get(id);
  }

  getHalfEdge(id: string): HalfEdge | undefined {
    return this.data.halfEdges.get(id);
  }

  addVertex(position: Vec3): string {
    const vertex = new Vertex(position);
    this.data.vertices.set(vertex.id, vertex);
    return vertex.id;
  }

  updateVertex(id: string, position: Vec3): void {
    console.log('🧠 HalfEdgeMesh.updateVertex called:', { id, position });
    const vertex = this.data.vertices.get(id);
    console.log('🧠 Found vertex in mesh:', vertex);
    
    if (vertex) {
      console.log('🧠 Old vertex position:', vertex.pos);
      vertex.setPosition(position);
      console.log('🧠 New vertex position:', vertex.pos);
      console.log('✅ Vertex position updated in mesh');
    } else {
      console.error('❌ Vertex not found in mesh data:', id);
    }
  }

  addFace(vertexIds: string[]): string {
    if (vertexIds.length < 3) {
      throw new Error('Face must have at least 3 vertices');
    }

    // Validate vertices exist
    for (const vertexId of vertexIds) {
      if (!this.data.vertices.has(vertexId)) {
        throw new Error(`Vertex ${vertexId} not found`);
      }
    }

    const face = new Face('', generateId());
    const faceHalfEdges: HalfEdge[] = [];

    // Create half-edges for the face
    for (let i = 0; i < vertexIds.length; i++) {
      const currentVertexId = vertexIds[i];
      const nextVertexId = vertexIds[(i + 1) % vertexIds.length];

      // For now, always create new edges - shared edge detection can be added later
      // Create new edge and half-edges
      const edge = new Edge('');
      const halfEdge1 = new HalfEdge(nextVertexId, edge.id, face.id);
      const halfEdge2 = new HalfEdge(currentVertexId, edge.id); // boundary half-edge

      // Set twins
      halfEdge1.setTwin(halfEdge2.id);
      halfEdge2.setTwin(halfEdge1.id);

      // Set edge reference
      edge.setHalfEdge(halfEdge1.id);

      // Store in mesh
      this.data.halfEdges.set(halfEdge1.id, halfEdge1);
      this.data.halfEdges.set(halfEdge2.id, halfEdge2);
      this.data.edges.set(edge.id, edge);

      const faceHalfEdge = halfEdge1;

      faceHalfEdges.push(faceHalfEdge);
    }

    // Set next/prev relationships for face half-edges
    for (let i = 0; i < faceHalfEdges.length; i++) {
      const current = faceHalfEdges[i];
      const next = faceHalfEdges[(i + 1) % faceHalfEdges.length];
      const prev = faceHalfEdges[(i - 1 + faceHalfEdges.length) % faceHalfEdges.length];

      current.setNext(next.id);
      current.setPrev(prev.id);
    }

    // Update vertex half-edge references
    for (let i = 0; i < vertexIds.length; i++) {
      const vertex = this.data.vertices.get(vertexIds[i])!;
      if (!vertex.halfEdge) {
        vertex.halfEdge = faceHalfEdges[i].id;
      }
    }

    // Set face half-edge reference
    face.setHalfEdge(faceHalfEdges[0].id);

    // Calculate face normal
    const vertices = vertexIds
      .map(id => this.data.vertices.get(id))
      .filter(v => v !== undefined)
      .map(v => v!.pos);
    if (vertices.length >= 3) {
      face.setNormal(calculateFaceNormal(vertices));
    }

    this.data.faces.set(face.id, face);
    return face.id;
  }

  getFaceVertices(faceId: string): Vertex[] {
    const face = this.data.faces.get(faceId);
    if (!face) return [];

    const vertices: Vertex[] = [];
    let currentHalfEdge = this.data.halfEdges.get(face.halfEdge);
    const startHalfEdge = currentHalfEdge;

    if (!currentHalfEdge) return [];

    do {
      const vertex = this.data.vertices.get(currentHalfEdge.vertex);
      if (vertex) {
        vertices.push(vertex);
      }

      currentHalfEdge = currentHalfEdge.next 
        ? this.data.halfEdges.get(currentHalfEdge.next)
        : undefined;
    } while (currentHalfEdge && currentHalfEdge !== startHalfEdge);

    return vertices;
  }

  recalculateNormals(): void {
    for (const face of this.data.faces.values()) {
      const vertices = this.getFaceVertices(face.id);
      if (vertices.length >= 3) {
        const positions = vertices.map(v => v.pos);
        face.setNormal(calculateFaceNormal(positions));
      }
    }
  }

  // Hierarchy methods
  createHierarchyNode(name?: string): string {
    const node = this.hierarchy.createNode(name || this.name);
    this.nodeId = node.id;
    return node.id;
  }

  getHierarchyNode(): MeshNode | undefined {
    return this.nodeId ? this.hierarchy.getNode(this.nodeId) : undefined;
  }

  setHierarchyParent(parentId: string): boolean {
    if (!this.nodeId) {
      this.createHierarchyNode();
    }
    return this.hierarchy.addChild(parentId, this.nodeId!);
  }

  clone(): HalfEdgeMesh {
    const cloned = new HalfEdgeMesh(this.name + '_copy');
    
    // Clone vertices
    for (const [id, vertex] of this.data.vertices) {
      cloned.data.vertices.set(id, vertex.clone());
    }

    // Clone faces
    for (const [id, face] of this.data.faces) {
      cloned.data.faces.set(id, face.clone());
    }

    // Clone edges
    for (const [id, edge] of this.data.edges) {
      cloned.data.edges.set(id, edge.clone());
    }

    // Clone half-edges
    for (const [id, halfEdge] of this.data.halfEdges) {
      cloned.data.halfEdges.set(id, halfEdge.clone());
    }

    return cloned;
  }

  getBoundingBox(): { min: Vec3; max: Vec3 } | null {
    const vertices = this.vertices();
    if (vertices.length === 0) return null;

    const first = vertices[0].pos;
    const min = { ...first };
    const max = { ...first };

    for (const vertex of vertices) {
      const pos = vertex.pos;
      min.x = Math.min(min.x, pos.x);
      min.y = Math.min(min.y, pos.y);
      min.z = Math.min(min.z, pos.z);
      max.x = Math.max(max.x, pos.x);
      max.y = Math.max(max.y, pos.y);
      max.z = Math.max(max.z, pos.z);
    }

    return { min, max };
  }

  getCenter(): Vec3 {
    const bbox = this.getBoundingBox();
    if (!bbox) return { x: 0, y: 0, z: 0 };

    return {
      x: (bbox.min.x + bbox.max.x) / 2,
      y: (bbox.min.y + bbox.max.y) / 2,
      z: (bbox.min.z + bbox.max.z) / 2,
    };
  }
}