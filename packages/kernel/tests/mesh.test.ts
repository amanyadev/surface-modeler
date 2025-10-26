import { describe, it, expect } from 'vitest';
import { HalfEdgeMesh } from '../src/mesh';
import { vec3 } from '../src/utils';

describe('HalfEdgeMesh', () => {
  it('should create an empty mesh', () => {
    const mesh = new HalfEdgeMesh();
    expect(mesh.vertices()).toHaveLength(0);
    expect(mesh.faces()).toHaveLength(0);
    expect(mesh.edges()).toHaveLength(0);
    expect(mesh.halfEdges()).toHaveLength(0);
  });

  it('should add vertices', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    
    expect(mesh.vertices()).toHaveLength(2);
    expect(v1.pos).toEqual({ x: 0, y: 0, z: 0 });
    expect(v2.pos).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('should add a triangular face', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(0.5, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id]);
    
    expect(face).not.toBeNull();
    expect(mesh.faces()).toHaveLength(1);
    expect(mesh.halfEdges()).toHaveLength(3);
    expect(mesh.edges()).toHaveLength(3);
  });

  it('should add a quadrilateral face', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    
    expect(face).not.toBeNull();
    expect(mesh.faces()).toHaveLength(1);
    expect(mesh.halfEdges()).toHaveLength(4);
    expect(mesh.edges()).toHaveLength(4);
  });

  it('should get face vertices in correct order', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    
    const face = mesh.addFace([v1.id, v2.id, v3.id]);
    const faceVertices = mesh.getFaceVertices(face!.id);
    
    expect(faceVertices).toHaveLength(3);
    expect(faceVertices[0].id).toBe(v2.id);
    expect(faceVertices[1].id).toBe(v3.id);
    expect(faceVertices[2].id).toBe(v1.id);
  });

  it('should clone mesh correctly', () => {
    const mesh = new HalfEdgeMesh();
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(0.5, 1, 0));
    mesh.addFace([v1.id, v2.id, v3.id]);
    
    const cloned = mesh.clone();
    
    expect(cloned.vertices()).toHaveLength(3);
    expect(cloned.faces()).toHaveLength(1);
    expect(cloned.halfEdges()).toHaveLength(3);
    expect(cloned.edges()).toHaveLength(3);
    
    // Ensure it's a deep clone
    mesh.addVertex(vec3(2, 2, 2));
    expect(cloned.vertices()).toHaveLength(3);
  });
});