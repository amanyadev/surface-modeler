import { describe, it, expect } from 'vitest';
import { createPlane, createCube, createCylinder } from '../src/primitives';

describe('Primitives', () => {
  describe('createPlane', () => {
    it('should create a plane with correct vertices and faces', () => {
      const plane = createPlane(2, 2);
      
      expect(plane.vertices()).toHaveLength(4);
      expect(plane.faces()).toHaveLength(1);
      
      const vertices = plane.vertices();
      expect(vertices[0].pos).toEqual({ x: -1, y: 0, z: -1 });
      expect(vertices[1].pos).toEqual({ x: 1, y: 0, z: -1 });
      expect(vertices[2].pos).toEqual({ x: 1, y: 0, z: 1 });
      expect(vertices[3].pos).toEqual({ x: -1, y: 0, z: 1 });
    });

    it('should create a plane with default size', () => {
      const plane = createPlane();
      
      expect(plane.vertices()).toHaveLength(4);
      expect(plane.faces()).toHaveLength(1);
      
      const vertices = plane.vertices();
      expect(vertices[0].pos).toEqual({ x: -0.5, y: 0, z: -0.5 });
    });
  });

  describe('createCube', () => {
    it('should create a cube with correct vertices and faces', () => {
      const cube = createCube(2);
      
      expect(cube.vertices()).toHaveLength(8);
      expect(cube.faces()).toHaveLength(6);
      
      const vertices = cube.vertices();
      // Check some key vertices
      expect(vertices[0].pos).toEqual({ x: -1, y: -1, z: -1 });
      expect(vertices[6].pos).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('should create a cube with default size', () => {
      const cube = createCube();
      
      expect(cube.vertices()).toHaveLength(8);
      expect(cube.faces()).toHaveLength(6);
      
      const vertices = cube.vertices();
      expect(vertices[0].pos).toEqual({ x: -0.5, y: -0.5, z: -0.5 });
    });
  });

  describe('createCylinder', () => {
    it('should create a cylinder with correct structure', () => {
      const cylinder = createCylinder(1, 2, 8);
      
      // 8 vertices on bottom + 8 on top + 2 centers = 18 vertices
      expect(cylinder.vertices()).toHaveLength(18);
      
      // 8 bottom cap triangles + 8 top cap triangles + 8 side quads = 24 faces
      expect(cylinder.faces()).toHaveLength(24);
    });

    it('should create a cylinder with correct radius and height', () => {
      const cylinder = createCylinder(2, 4, 6);
      const vertices = cylinder.vertices();
      
      // Check that we have the right number of vertices for 6 segments
      expect(vertices).toHaveLength(14); // 6 bottom + 6 top + 2 centers
      
      // Check that vertices are at correct height
      const bottomVertices = vertices.filter(v => v.pos.y === -2);
      const topVertices = vertices.filter(v => v.pos.y === 2);
      
      expect(bottomVertices.length).toBeGreaterThan(0);
      expect(topVertices.length).toBeGreaterThan(0);
    });

    it('should create a cylinder with default parameters', () => {
      const cylinder = createCylinder();
      
      expect(cylinder.vertices()).toHaveLength(18); // 8 segments by default
      expect(cylinder.faces()).toHaveLength(24);
    });
  });
});