import { describe, it, expect } from 'vitest';
import { HalfEdgeMesh } from '../src/mesh.js';
import { SubdivideEdgeCommand } from '../src/edge-operations.js';
import { FilletCommand, ChamferCommand, SmoothCommand } from '../src/advanced-operations.js';

describe('New Operations', () => {
  describe('SubdivideEdgeCommand', () => {
    it('should create command with subdivisions parameter', () => {
      const command = new SubdivideEdgeCommand('edge-1', 3);
      expect(command).toBeDefined();
      expect(command.name).toBe('subdivide_edge');
    });

    it('should handle single subdivision by default', () => {
      const command = new SubdivideEdgeCommand('edge-1');
      expect(command).toBeDefined();
    });
  });

  describe('FilletCommand', () => {
    it('should create fillet command with edge and radius', () => {
      const command = new FilletCommand('edge-1', 0.5);
      expect(command).toBeDefined();
      expect(command.name).toBe('fillet');
    });
  });

  describe('ChamferCommand', () => {
    it('should create chamfer command with distance and angle', () => {
      const command = new ChamferCommand('edge-1', 0.5, 45);
      expect(command).toBeDefined();
      expect(command.name).toBe('chamfer');
    });

    it('should handle default angle', () => {
      const command = new ChamferCommand('edge-1', 0.5);
      expect(command).toBeDefined();
    });
  });

  describe('SmoothCommand', () => {
    it('should create smooth command with iterations and factor', () => {
      const command = new SmoothCommand(3, 0.6);
      expect(command).toBeDefined();
      expect(command.name).toBe('smooth');
    });

    it('should handle default parameters', () => {
      const command = new SmoothCommand();
      expect(command).toBeDefined();
    });

    it('should execute on a simple mesh', () => {
      const mesh = new HalfEdgeMesh();
      
      // Create a simple triangle
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
      const v3 = mesh.addVertex({ x: 0.5, y: 1, z: 0 });
      
      const face = mesh.addFace([v1.id, v2.id, v3.id]);
      expect(face).toBeTruthy();
      
      const command = new SmoothCommand(1, 0.1);
      
      // Should not throw
      expect(() => command.do(mesh)).not.toThrow();
      
      // Mesh should still have the same number of vertices
      expect(mesh.vertices().length).toBe(3);
    });
  });

  describe('Mesh Integration', () => {
    it('should create a simple mesh and apply operations', () => {
      const mesh = new HalfEdgeMesh();
      
      // Create a simple quad
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 });
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 });
      const v3 = mesh.addVertex({ x: 1, y: 1, z: 0 });
      const v4 = mesh.addVertex({ x: 0, y: 1, z: 0 });
      
      const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
      expect(face).toBeTruthy();
      
      // Test that smooth operation doesn't break the mesh
      const smoothCommand = new SmoothCommand(1, 0.2);
      expect(() => smoothCommand.do(mesh)).not.toThrow();
      
      // Mesh should still be valid
      expect(mesh.vertices().length).toBe(4);
      expect(mesh.faces().length).toBe(1);
    });
  });
});