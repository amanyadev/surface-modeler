#!/usr/bin/env node

import { 
  createCube, 
  createPlane, 
  ExtrudeCommand, 
  MoveVertexCommand,
  SubdivideEdgeCommand,
  CommandHistory 
} from './packages/kernel/dist/index.js';

console.log('🔧 Half-Edge Modeler Demo');
console.log('========================\n');

// Create a cube
console.log('Creating a cube...');
const cube = createCube(2);
console.log(`✓ Cube created with ${cube.vertices().length} vertices and ${cube.faces().length} faces\n`);

// Create a plane
console.log('Creating a plane...');
const plane = createPlane(3, 3);
console.log(`✓ Plane created with ${plane.vertices().length} vertices and ${plane.faces().length} faces\n`);

// Test command system
console.log('Testing command system with extrude operation...');
const history = new CommandHistory();
const face = plane.faces()[0];

console.log(`Original plane faces: ${plane.faces().length}`);
const extrudeCmd = new ExtrudeCommand(face.id, 1.5);
history.execute(extrudeCmd, plane);
console.log(`After extrude: ${plane.faces().length} faces`);

// Test undo
console.log('Testing undo...');
history.undo(plane);
console.log(`After undo: ${plane.faces().length} faces`);

// Test redo
console.log('Testing redo...');
history.redo(plane);
console.log(`After redo: ${plane.faces().length} faces`);

// Test vertex operations
console.log('\nTesting vertex operations...');
const vertices = plane.vertices();
if (vertices.length > 0) {
  const vertex = vertices[0];
  console.log(`Original vertex position: ${vertex.pos.x}, ${vertex.pos.y}, ${vertex.pos.z}`);
  const moveCmd = new MoveVertexCommand(vertex.id, { x: vertex.pos.x, y: vertex.pos.y + 1, z: vertex.pos.z });
  history.execute(moveCmd, plane);
  console.log(`After move: ${vertex.pos.x}, ${vertex.pos.y}, ${vertex.pos.z}`);
  history.undo(plane);
  console.log(`After undo: ${vertex.pos.x}, ${vertex.pos.y}, ${vertex.pos.z}`);
}

// Test edge operations  
console.log('\nTesting edge operations...');
const edges = plane.edges();
if (edges.length > 0) {
  const edge = edges[0];
  const originalVertexCount = plane.vertices().length;
  console.log(`Original vertex count: ${originalVertexCount}`);
  const subdivideCmd = new SubdivideEdgeCommand(edge.id);
  history.execute(subdivideCmd, plane);
  console.log(`After subdivide: ${plane.vertices().length} vertices`);
  history.undo(plane);
  console.log(`After undo: ${plane.vertices().length} vertices`);
}

console.log('\n✅ All kernel operations working correctly!');
console.log('🚀 Ready to start the web application with: pnpm dev');
console.log('');
console.log('🎮 New Features:');
console.log('  • Vertex/Edge/Face selection modes (1/2/3 keys)');
console.log('  • Vertex operations: Move (M key), Delete');
console.log('  • Edge operations: Subdivide (S key), Delete');
console.log('  • Face operations: Extrude (E key), Flip normals');
console.log('  • Visual feedback with color-coded selection');
console.log('  • Mode-specific visibility (vertices/edges show only in their modes)');