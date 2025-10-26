import { describe, it, expect } from 'vitest';
import { HalfEdgeMesh } from '../src/mesh';
import { ExtrudeCommand, FlipNormalsCommand } from '../src/operations';
import { vec3 } from '../src/utils';

describe('ExtrudeCommand', () => {
  it('should extrude a face', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    const originalFaceCount = mesh.faces().length;
    const originalVertexCount = mesh.vertices().length;
    
    const extrudeCommand = new ExtrudeCommand(face!.id, 1.0);
    extrudeCommand.do(mesh);
    
    // Should have more faces and vertices after extrusion
    expect(mesh.faces().length).toBeGreaterThan(originalFaceCount);
    expect(mesh.vertices().length).toBeGreaterThan(originalVertexCount);
    
    // Should have created 4 new vertices (one for each corner of the face)
    expect(mesh.vertices().length).toBe(originalVertexCount + 4);
  });

  it('should undo extrusion', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    const originalState = {
      faces: mesh.faces().length,
      vertices: mesh.vertices().length,
      halfEdges: mesh.halfEdges().length,
      edges: mesh.edges().length,
    };
    
    const extrudeCommand = new ExtrudeCommand(face!.id, 1.0);
    extrudeCommand.do(mesh);
    extrudeCommand.undo(mesh);
    
    // Should be back to original state
    expect(mesh.faces().length).toBe(originalState.faces);
    expect(mesh.vertices().length).toBe(originalState.vertices);
    expect(mesh.halfEdges().length).toBe(originalState.halfEdges);
    expect(mesh.edges().length).toBe(originalState.edges);
  });
});

describe('FlipNormalsCommand', () => {
  it('should flip face normals', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(0.5, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id]);
    const originalNormal = face!.normal ? { ...face!.normal } : undefined;
    
    const flipCommand = new FlipNormalsCommand(face!.id);
    flipCommand.do(mesh);
    
    const updatedFace = mesh.getFace(face!.id);
    if (originalNormal && updatedFace?.normal) {
      expect(updatedFace.normal.x).toBeCloseTo(-originalNormal.x);
      expect(updatedFace.normal.y).toBeCloseTo(-originalNormal.y);
      expect(updatedFace.normal.z).toBeCloseTo(-originalNormal.z);
    }
  });

  it('should undo normal flip', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(0.5, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id]);
    const originalNormal = face!.normal ? { ...face!.normal } : undefined;
    
    const flipCommand = new FlipNormalsCommand(face!.id);
    flipCommand.do(mesh);
    flipCommand.undo(mesh);
    
    const restoredFace = mesh.getFace(face!.id);
    if (originalNormal && restoredFace?.normal) {
      expect(restoredFace.normal.x).toBeCloseTo(originalNormal.x);
      expect(restoredFace.normal.y).toBeCloseTo(originalNormal.y);
      expect(restoredFace.normal.z).toBeCloseTo(originalNormal.z);
    }
  });
});