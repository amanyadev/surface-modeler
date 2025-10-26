import { Mesh, Vec3 } from './types.js';
import { BaseCommand } from './command.js';
import { HalfEdgeMesh } from './mesh.js';

export class TransformMeshCommand extends BaseCommand {
  private translation: Vec3;
  private rotation: Vec3;
  private scale: Vec3;
  private originalMeshState?: string;

  constructor(translation: Vec3, rotation: Vec3, scale: Vec3) {
    super('transform_mesh');
    this.translation = translation;
    this.rotation = rotation;
    this.scale = scale;
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    
    // Store original state for undo
    this.originalMeshState = JSON.stringify({
      vertices: Array.from(halfEdgeMesh.data.vertices.entries()),
      halfEdges: Array.from(halfEdgeMesh.data.halfEdges.entries()),
      edges: Array.from(halfEdgeMesh.data.edges.entries()),
      faces: Array.from(halfEdgeMesh.data.faces.entries()),
    });

    // Apply transformations to all vertices
    halfEdgeMesh.data.vertices.forEach((vertex) => {
      // Apply scale
      vertex.pos.x *= this.scale.x;
      vertex.pos.y *= this.scale.y;
      vertex.pos.z *= this.scale.z;

      // Apply rotation (simple Euler rotation)
      if (this.rotation.x !== 0 || this.rotation.y !== 0 || this.rotation.z !== 0) {
        const cos = Math.cos;
        const sin = Math.sin;
        
        // Rotation around Y axis
        if (this.rotation.y !== 0) {
          const newX = vertex.pos.x * cos(this.rotation.y) + vertex.pos.z * sin(this.rotation.y);
          const newZ = -vertex.pos.x * sin(this.rotation.y) + vertex.pos.z * cos(this.rotation.y);
          vertex.pos.x = newX;
          vertex.pos.z = newZ;
        }
        
        // Rotation around X axis
        if (this.rotation.x !== 0) {
          const newY = vertex.pos.y * cos(this.rotation.x) - vertex.pos.z * sin(this.rotation.x);
          const newZ = vertex.pos.y * sin(this.rotation.x) + vertex.pos.z * cos(this.rotation.x);
          vertex.pos.y = newY;
          vertex.pos.z = newZ;
        }
        
        // Rotation around Z axis
        if (this.rotation.z !== 0) {
          const newX = vertex.pos.x * cos(this.rotation.z) - vertex.pos.y * sin(this.rotation.z);
          const newY = vertex.pos.x * sin(this.rotation.z) + vertex.pos.y * cos(this.rotation.z);
          vertex.pos.x = newX;
          vertex.pos.y = newY;
        }
      }

      // Apply translation
      vertex.pos.x += this.translation.x;
      vertex.pos.y += this.translation.y;
      vertex.pos.z += this.translation.z;
    });

    // Recalculate face normals
    halfEdgeMesh.data.faces.forEach((face) => {
      const vertices = halfEdgeMesh.getFaceVertices(face.id);
      if (vertices.length >= 3) {
        const v1 = vertices[0].pos;
        const v2 = vertices[1].pos;
        const v3 = vertices[2].pos;
        
        const edge1 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
        const edge2 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
        
        const normal = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x
        };
        
        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        if (length > 0) {
          face.normal = {
            x: normal.x / length,
            y: normal.y / length,
            z: normal.z / length
          };
        }
      }
    });
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo TransformMeshCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}