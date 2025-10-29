# @amanyadev/half-edge

A pure TypeScript geometry and modeling kernel for 3D surface modeling applications. Provides robust half-edge mesh data structure with comprehensive modeling operations, selection tools, and file format support.

## Overview

The kernel provides a complete mesh data structure and modeling operations using the half-edge representation. It's designed to be platform-agnostic and can run in browsers, Node.js, or WebWorkers.

### Key Features

- **Half-Edge Mesh Structure**: Efficient mesh representation supporting complex topology operations
- **Selection System**: Vertex, edge, and face selection with robust connectivity tracking
- **Movement Operations**: Safe vertex, edge, and face transformation with topology preservation
- **Command Pattern**: Full undo/redo support for all modeling operations
- **File Format Support**: Seamless conversion to/from standard 3D file formats
- **Type Safety**: Complete TypeScript coverage with strict typing
- **Platform Agnostic**: No DOM dependencies, works in any JavaScript environment

## Installation

```bash
npm install @amanyadev16/half-edge
```

## Quick Start

```typescript
import { 
  HalfEdgeMesh, 
  createCube, 
  ExtrudeCommand, 
  CommandHistory 
} from '@half-edge/kernel';

// Create a cube primitive
const mesh = createCube(2);

// Setup command history for undo/redo
const history = new CommandHistory();

// Get a face to extrude
const face = mesh.faces()[0];

// Create and execute an extrude command
const extrudeCmd = new ExtrudeCommand(face.id, 1.0);
history.execute(extrudeCmd, mesh);

// Undo the operation
history.undo(mesh);
```

## API Reference

### Core Types

#### Vec3
```typescript
type Vec3 = { x: number; y: number; z: number };
```

#### Vertex
```typescript
interface Vertex {
  id: string;
  pos: Vec3;
  normal?: Vec3;
  uv?: Vec2;
  halfEdge?: string; // Reference to outgoing half-edge
}
```

#### HalfEdge
```typescript
interface HalfEdge {
  id: string;
  vertex: string;   // Target vertex
  twin?: string;    // Opposite half-edge
  next?: string;    // Next half-edge in face loop
  prev?: string;    // Previous half-edge in face loop
  face?: string;    // Face this half-edge bounds
  edge?: string;    // Parent edge
}
```

#### Face
```typescript
interface Face {
  id: string;
  halfEdge: string; // One of the bounding half-edges
  normal?: Vec3;
  materialId?: string;
}
```

### Mesh Operations

#### HalfEdgeMesh

The main mesh class implementing the half-edge data structure:

```typescript
const mesh = new HalfEdgeMesh();

// Add vertices
const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
const v3 = mesh.addVertex({ x: 0.5, y: 1, z: 0 });

// Add a triangular face
const face = mesh.addFace([v1.id, v2.id, v3.id]);

// Query the mesh
const vertices = mesh.vertices();
const faces = mesh.faces();
const faceVertices = mesh.getFaceVertices(face.id);

// Clone the mesh
const cloned = mesh.clone();
```

### Primitive Creation

Create common geometric primitives:

```typescript
import { createPlane, createCube, createCylinder } from '@half-edge/kernel';

// Create a 2x2 plane
const plane = createPlane(2, 2);

// Create a unit cube
const cube = createCube(1);

// Create a cylinder with radius=1, height=2, 8 segments
const cylinder = createCylinder(1, 2, 8);
```

### Command System

All modeling operations are implemented as commands supporting undo/redo:

```typescript
import { CommandHistory, ExtrudeCommand, FlipNormalsCommand } from '@half-edge/kernel';

const history = new CommandHistory();

// Execute commands
const extrudeCmd = new ExtrudeCommand(faceId, 1.5);
history.execute(extrudeCmd, mesh);

const flipCmd = new FlipNormalsCommand(faceId);
history.execute(flipCmd, mesh);

// Undo/redo
if (history.canUndo()) {
  history.undo(mesh);
}

if (history.canRedo()) {
  history.redo(mesh);
}

// Clear history
history.clear();
```

### Available Commands

#### ExtrudeCommand
Extrudes a face along its normal:

```typescript
const cmd = new ExtrudeCommand(faceId, distance);
```

#### FlipNormalsCommand
Reverses the orientation of a face:

```typescript
const cmd = new FlipNormalsCommand(faceId);
```

#### MoveVertexCommand
Moves a vertex to a new position:

```typescript
const cmd = new MoveVertexCommand(vertexId, newPosition);
```

#### SplitEdgeCommand
Splits an edge by inserting a new vertex:

```typescript
const cmd = new SplitEdgeCommand(edgeId, position);
```

#### DeleteElementCommand
Safely deletes vertices, edges, or faces:

```typescript
const cmd = new DeleteElementCommand(elementId, elementType);
```

### Custom Commands

Implement your own modeling operations:

```typescript
import { BaseCommand, Mesh } from '@half-edge/kernel';

export class MyCustomCommand extends BaseCommand {
  constructor(private param1: string, private param2: number) {
    super('my_custom_operation');
  }

  do(mesh: Mesh): void {
    // Store original state for undo
    this.originalState = /* serialize mesh state */;
    
    // Perform the operation
    /* modify mesh */
  }

  undo(mesh: Mesh): void {
    // Restore original state
    /* restore mesh from this.originalState */
  }
}
```

### Utility Functions

Vector math utilities:

```typescript
import { vec3, vec3Add, vec3Sub, vec3Scale, vec3Cross, vec3Normalize } from '@half-edge/kernel';

const a = vec3(1, 0, 0);
const b = vec3(0, 1, 0);

const sum = vec3Add(a, b);           // { x: 1, y: 1, z: 0 }
const cross = vec3Cross(a, b);       // { x: 0, y: 0, z: 1 }
const normalized = vec3Normalize(a); // { x: 1, y: 0, z: 0 }
```

## Half-Edge Data Structure

The half-edge representation provides efficient access to mesh connectivity:

### Benefits
- **Efficient Traversal**: Constant-time access to adjacent faces, edges, and vertices
- **Robust Operations**: Supports complex modeling operations like extrusion and boolean ops
- **Manifold Meshes**: Enforces topological consistency
- **Extensible**: Easy to add custom attributes and operations

### Structure
- Each edge is split into two directed half-edges
- Each half-edge points to its target vertex, twin half-edge, next/prev in face loop
- Each face references one of its bounding half-edges
- Each vertex references one of its outgoing half-edges

### Traversal Examples

```typescript
// Get all vertices of a face
const faceVertices = mesh.getFaceVertices(faceId);

// Walk around a vertex to find adjacent faces
function getVertexFaces(mesh: HalfEdgeMesh, vertexId: string): Face[] {
  const vertex = mesh.getVertex(vertexId);
  if (!vertex?.halfEdge) return [];
  
  const faces: Face[] = [];
  let currentHalfEdge = vertex.halfEdge;
  
  do {
    const halfEdge = mesh.getHalfEdge(currentHalfEdge);
    if (halfEdge?.face) {
      const face = mesh.getFace(halfEdge.face);
      if (face) faces.push(face);
    }
    
    // Move to next half-edge around vertex
    const twin = halfEdge?.twin;
    if (!twin) break;
    
    const twinHalfEdge = mesh.getHalfEdge(twin);
    currentHalfEdge = twinHalfEdge?.next;
  } while (currentHalfEdge && currentHalfEdge !== vertex.halfEdge);
  
  return faces;
}
```

## Performance Notes

- Operations are designed for interactive modeling (not batch processing)
- Large meshes may benefit from spatial indexing (not yet implemented)
- Command history stores full mesh snapshots (consider checkpointing for large operations)
- Half-edge traversal is O(1) for most operations

### Selection & Transformation APIs

The kernel provides comprehensive selection and transformation capabilities:

```typescript
// Selection management
const mesh = new HalfEdgeMesh();

// Select elements
mesh.selectVertex(vertexId);
mesh.selectEdge(edgeId);
mesh.selectFace(faceId);

// Get selection state
const selectedVertices = mesh.getSelectedVertices();
const selectedEdges = mesh.getSelectedEdges();  
const selectedFaces = mesh.getSelectedFaces();

// Transform selected elements
const moveCmd = new MoveVerticesCommand(selectedVertices, offset);
history.execute(moveCmd, mesh);
```

### File Format Integration

Seamless conversion between kernel mesh format and standard 3D file formats:

```typescript
import { bufferGeometryToHalfEdge, halfEdgeToBufferGeometry } from '@half-edge/kernel';

// Convert from Three.js BufferGeometry
const bufferGeom = loadedMesh.geometry;
const halfEdgeMesh = bufferGeometryToHalfEdge(bufferGeom);

// Convert to Three.js BufferGeometry for rendering
const outputGeometry = halfEdgeToBufferGeometry(halfEdgeMesh);
```

## Future Extensions

Planned additions to the kernel:

- **Boolean Operations**: Union, intersection, difference ✅ (Basic support)
- **Subdivision Surfaces**: Catmull-Clark and Loop subdivision
- **Spatial Indexing**: Octree and BVH for large meshes
- **Mesh Validation**: Topology checking and repair ✅ (Basic validation)
- **Advanced Primitives**: Torus, icosphere, etc.
- **Mesh Simplification**: LOD generation and decimation
- **Edge Operations**: Advanced edge splitting and merging ✅ (Basic support)
- **File Format Support**: Extended format support beyond OBJ/GLTF ✅ (OBJ, GLTF, GLB)

## Testing

The kernel includes comprehensive unit tests:

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

Test coverage includes:
- Mesh construction and modification
- Command execution and undo/redo
- Primitive generation
- Half-edge connectivity validation

## License

MIT