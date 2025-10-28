// Core types
export type { Vec3, Vec2, Transform, BoundingBox } from './core/types.js';

// Core classes
export { HalfEdgeMesh, Mesh } from './core/mesh.js';
export { Vertex } from './core/vertex.js';
export { Face } from './core/face.js';
export { Edge } from './core/edge.js';
export { HalfEdge } from './core/half-edge.js';
export { MeshHierarchy, type MeshNode } from './core/mesh-node.js';

// Command system
export { BaseCommand, CommandHistory, type Command } from './commands/base-command.js';
export { VertexTransformCommand } from './commands/vertex-transform-command.js';
export { EdgeTransformCommand } from './commands/edge-transform-command.js';
export { FaceTransformCommand } from './commands/face-transform-command.js';

// Drawing commands
export { 
  CreateVertexCommand,
  CreateFaceFromVerticesCommand,
  CreateQuadCommand,
  CreateCircleCommand
} from './commands/drawing-commands.js';

// Legacy compatibility - re-export old command classes
export { CommandHistory as CommandManager } from './commands/base-command.js';

// Operations
export {
  ExtrudeCommand,
  RevolveCommand,
  SweepCommand,
  FlipNormalsCommand,
  BooleanUnionCommand,
  BooleanDifferenceCommand,
  SubdivideCommand,
} from './operations.js';

// Advanced Operations
export {
  FilletCommand,
  ChamferCommand,
  LoftCommand,
  ShellCommand,
  MirrorCommand,
  LinearPatternCommand,
  SmoothCommand,
} from './advanced-operations.js';

// Edge Utilities
export {
  SplitEdgeCommand,
  WeldVerticesCommand,
  CollapseEdgeCommand,
  MeshUtilities,
} from './edge-utilities.js';

// Vertex Operations
export {
  MoveVertexCommand,
  DeleteVertexCommand,
} from './vertex-operations.js';

// Edge Operations
export {
  SubdivideEdgeCommand,
  DeleteEdgeCommand,
} from './edge-operations.js';

// Face Operations
export {
  MergeFacesCommand,
  SplitFaceCommand,
} from './face-operations.js';

// Mesh Operations
export {
  TransformMeshCommand,
} from './mesh-operations.js';

// Primitives
export {
  createPlane,
  createCube,
  createCylinder,
  createTorus,
  createSphere,
  createIcosahedron,
  createPyramid,
  createDodecahedron,
  createOctahedron,
} from './primitives.js';

// Utils
export { generateId, resetIdCounter } from './utils/id.js';
export {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Cross,
  vec3Dot,
  vec3Length,
  vec3Normalize,
  calculateFaceNormal,
} from './utils/math.js';