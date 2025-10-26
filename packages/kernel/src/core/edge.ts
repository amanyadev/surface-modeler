import { generateId } from '../utils/id.js';

export class Edge {
  public readonly id: string;
  public halfEdge: string;   // Reference to one of the two half-edges

  constructor(halfEdgeId: string, id?: string) {
    this.id = id || generateId();
    this.halfEdge = halfEdgeId;
  }

  clone(): Edge {
    return new Edge(this.halfEdge, this.id);
  }

  setHalfEdge(halfEdgeId: string): void {
    this.halfEdge = halfEdgeId;
  }
}