import { generateId } from '../utils/id.js';

export class HalfEdge {
  public readonly id: string;
  public vertex: string;     // Target vertex
  public edge: string;       // Parent edge
  public face?: string;      // Left face (optional for boundary edges)
  public next?: string;      // Next half-edge in face loop
  public prev?: string;      // Previous half-edge in face loop
  public twin?: string;      // Opposite half-edge

  constructor(
    vertexId: string,
    edgeId: string,
    faceId?: string,
    id?: string
  ) {
    this.id = id || generateId();
    this.vertex = vertexId;
    this.edge = edgeId;
    this.face = faceId;
  }

  clone(): HalfEdge {
    const cloned = new HalfEdge(this.vertex, this.edge, this.face, this.id);
    cloned.next = this.next;
    cloned.prev = this.prev;
    cloned.twin = this.twin;
    return cloned;
  }

  isBoundary(): boolean {
    return this.face === undefined;
  }

  setNext(halfEdgeId: string): void {
    this.next = halfEdgeId;
  }

  setPrev(halfEdgeId: string): void {
    this.prev = halfEdgeId;
  }

  setTwin(halfEdgeId: string): void {
    this.twin = halfEdgeId;
  }
}