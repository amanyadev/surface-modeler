export type Vec3 = { x: number; y: number; z: number };
export type Vec2 = { x: number; y: number };

export interface Vertex {
  id: string;
  pos: Vec3;
  normal?: Vec3;
  uv?: Vec2;
  halfEdge?: string; // Reference to an outgoing half-edge
}

export interface HalfEdge {
  id: string;
  vertex: string; // Target vertex
  twin?: string; // Opposite half-edge
  next?: string; // Next half-edge in the face loop
  prev?: string; // Previous half-edge in the face loop
  face?: string; // Face this half-edge bounds
  edge?: string; // Parent edge
}

export interface Edge {
  id: string;
  halfEdge: string; // One of the two half-edges
}

export interface Face {
  id: string;
  halfEdge: string; // One of the half-edges bounding this face
  normal?: Vec3;
  materialId?: string;
}

export interface MeshData {
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  edges: Map<string, Edge>;
  faces: Map<string, Face>;
}

export interface Command {
  id: string;
  type: string;
  do(mesh: Mesh): Promise<void> | void;
  undo(mesh: Mesh): Promise<void> | void;
}

export interface Mesh {
  id: string;
  data: MeshData;
  vertices(): Vertex[];
  faces(): Face[];
  edges(): Edge[];
  halfEdges(): HalfEdge[];
  clone(): Mesh;
  applyCommand(cmd: Command): void;
  getVertex(id: string): Vertex | undefined;
  getFace(id: string): Face | undefined;
  getHalfEdge(id: string): HalfEdge | undefined;
  getEdge(id: string): Edge | undefined;
}

export interface MeshImporter {
  import(buffer: ArrayBuffer, options?: any): Promise<Mesh>;
}

export interface CommandManager {
  history: Command[];
  currentIndex: number;
  execute(command: Command, mesh: Mesh): void;
  undo(mesh: Mesh): boolean;
  redo(mesh: Mesh): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}