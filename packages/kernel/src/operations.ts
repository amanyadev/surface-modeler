import { Vec3 } from './core/types.js';
import { BaseCommand } from './commands/base-command.js';
import { HalfEdgeMesh, Mesh } from './core/mesh.js';
import { vec3Add, vec3Scale, calculateFaceNormal } from './utils/math.js';

export class ExtrudeCommand extends BaseCommand {
  private faceId: string;
  private distance: number;
  private originalMeshState?: string;
  private newFaceIds: string[] = [];

  constructor(faceId: string, distance: number) {
    super('extrude');
    this.faceId = faceId;
    this.distance = distance;
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

    const face = halfEdgeMesh.getFace(this.faceId);
    if (!face) {
      throw new Error(`Face ${this.faceId} not found`);
    }

    // Get face vertices
    const faceVertices = halfEdgeMesh.getFaceVertices(this.faceId);
    if (faceVertices.length === 0) {
      throw new Error(`No vertices found for face ${this.faceId}`);
    }

    // Validate that all vertices have valid positions
    for (let i = 0; i < faceVertices.length; i++) {
      const vertex = faceVertices[i];
      if (!vertex) {
        throw new Error(`Vertex at index ${i} is null/undefined for face ${this.faceId}`);
      }
      if (!vertex.pos) {
        throw new Error(`Vertex at index ${i} for face ${this.faceId} has no pos property`);
      }
    }

    // Calculate extrusion direction (face normal)
    const positions = faceVertices.map(v => v.pos);
    const normal = face.normal || calculateFaceNormal(positions);
    const extrusionVector = vec3Scale(normal, this.distance);

    // Create new vertices by extruding existing ones
    const newVertexIds: string[] = [];
    for (const vertex of faceVertices) {
      const newPos = vec3Add(vertex.pos, extrusionVector);
      const newVertexId = halfEdgeMesh.addVertex(newPos);
      newVertexIds.push(newVertexId);
    }

    // Create new top face
    const newTopFaceId = halfEdgeMesh.addFace(newVertexIds);
    if (newTopFaceId) {
      this.newFaceIds.push(newTopFaceId);
    }

    // Create side faces connecting old and new vertices
    for (let i = 0; i < faceVertices.length; i++) {
      const next = (i + 1) % faceVertices.length;
      const sideFaceId = halfEdgeMesh.addFace([
        faceVertices[i].id,
        faceVertices[next].id,
        newVertexIds[next],
        newVertexIds[i],
      ]);
      if (sideFaceId) {
        this.newFaceIds.push(sideFaceId);
      }
    }

    // Remove the original face
    halfEdgeMesh.data.faces.delete(this.faceId);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo ExtrudeCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class FlipNormalsCommand extends BaseCommand {
  private faceId: string;
  private originalNormal?: Vec3;

  constructor(faceId: string) {
    super('flip_normals');
    this.faceId = faceId;
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const face = halfEdgeMesh.getFace(this.faceId);
    if (!face) return;

    // Store original normal for undo
    this.originalNormal = face.normal ? { ...face.normal } : undefined;

    // Flip the normal
    if (face.normal) {
      face.normal.x = -face.normal.x;
      face.normal.y = -face.normal.y;
      face.normal.z = -face.normal.z;
    }

    // Also reverse the half-edge loop to maintain correct winding
    const faceVertices = halfEdgeMesh.getFaceVertices(this.faceId);
    if (faceVertices.length > 0) {
      // Remove the face
      halfEdgeMesh.data.faces.delete(this.faceId);
      
      // Re-add with reversed vertex order
      const reversedVertexIds = faceVertices.map(v => v.id).reverse();
      halfEdgeMesh.addFace(reversedVertexIds);
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const face = halfEdgeMesh.getFace(this.faceId);
    if (!face) return;

    // Restore original normal
    if (this.originalNormal) {
      face.normal = { ...this.originalNormal };
    }

    // Flip back by reversing vertices again
    const faceVertices = halfEdgeMesh.getFaceVertices(this.faceId);
    if (faceVertices.length > 0) {
      halfEdgeMesh.data.faces.delete(this.faceId);
      const reversedVertexIds = faceVertices.map(v => v.id).reverse();
      halfEdgeMesh.addFace(reversedVertexIds);
    }
  }
}

export class RevolveCommand extends BaseCommand {
  private faceId: string;
  private axis: Vec3;
  private angle: number;
  private segments: number;
  private originalMeshState?: string;
  private newFaceIds: string[] = [];

  constructor(faceId: string, axis: Vec3, angle: number = Math.PI * 2, segments: number = 16) {
    super('revolve');
    this.faceId = faceId;
    this.axis = axis;
    this.angle = angle;
    this.segments = segments;
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

    const face = halfEdgeMesh.getFace(this.faceId);
    if (!face) {
      throw new Error(`Face ${this.faceId} not found`);
    }

    // Get face vertices
    const faceVertices = halfEdgeMesh.getFaceVertices(this.faceId);
    if (faceVertices.length === 0) {
      throw new Error(`No vertices found for face ${this.faceId}`);
    }

    const angleStep = this.angle / this.segments;
    const vertexRings: string[][] = [];

    // Create vertex rings by rotating the original face vertices
    for (let segment = 0; segment <= this.segments; segment++) {
      const currentAngle = segment * angleStep;
      const ring: string[] = [];

      for (const vertex of faceVertices) {
        const rotatedPos = this.rotateAroundAxis(vertex.pos, this.axis, currentAngle);
        const newVertexId = halfEdgeMesh.addVertex(rotatedPos);
        ring.push(newVertexId);
      }
      
      vertexRings.push(ring);
    }

    // Create side faces connecting adjacent rings
    for (let segment = 0; segment < this.segments; segment++) {
      const currentRing = vertexRings[segment];
      const nextRing = vertexRings[segment + 1];

      for (let i = 0; i < currentRing.length; i++) {
        const next = (i + 1) % currentRing.length;
        
        // Create quad face
        const faceId = halfEdgeMesh.addFace([
          currentRing[i],
          currentRing[next],
          nextRing[next],
          nextRing[i],
        ]);
        
        if (faceId) {
          this.newFaceIds.push(faceId);
        }
      }
    }

    // Remove the original face if it's a complete revolution
    if (this.angle >= Math.PI * 2 - 0.01) {
      halfEdgeMesh.data.faces.delete(this.faceId);
    }
  }

  private rotateAroundAxis(point: Vec3, axis: Vec3, angle: number): Vec3 {
    // Rodrigues' rotation formula
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const oneMinusCos = 1 - cosAngle;

    const dotProduct = point.x * axis.x + point.y * axis.y + point.z * axis.z;
    const crossX = axis.y * point.z - axis.z * point.y;
    const crossY = axis.z * point.x - axis.x * point.z;
    const crossZ = axis.x * point.y - axis.y * point.x;

    return {
      x: point.x * cosAngle + crossX * sinAngle + axis.x * dotProduct * oneMinusCos,
      y: point.y * cosAngle + crossY * sinAngle + axis.y * dotProduct * oneMinusCos,
      z: point.z * cosAngle + crossZ * sinAngle + axis.z * dotProduct * oneMinusCos,
    };
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo RevolveCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class SweepCommand extends BaseCommand {
  private faceId: string;
  private path: Vec3[];
  private originalMeshState?: string;
  private newFaceIds: string[] = [];

  constructor(faceId: string, path: Vec3[]) {
    super('sweep');
    this.faceId = faceId;
    this.path = path;
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

    const face = halfEdgeMesh.getFace(this.faceId);
    if (!face) {
      throw new Error(`Face ${this.faceId} not found`);
    }

    // Get face vertices
    const faceVertices = halfEdgeMesh.getFaceVertices(this.faceId);
    if (faceVertices.length === 0) {
      throw new Error(`No vertices found for face ${this.faceId}`);
    }

    const vertexRings: string[][] = [];

    // Create vertex rings along the sweep path
    for (const pathPoint of this.path) {
      const ring: string[] = [];

      for (const vertex of faceVertices) {
        const newPos = vec3Add(vertex.pos, pathPoint);
        const newVertexId = halfEdgeMesh.addVertex(newPos);
        ring.push(newVertexId);
      }
      
      vertexRings.push(ring);
    }

    // Create side faces connecting adjacent rings
    for (let segment = 0; segment < vertexRings.length - 1; segment++) {
      const currentRing = vertexRings[segment];
      const nextRing = vertexRings[segment + 1];

      for (let i = 0; i < currentRing.length; i++) {
        const next = (i + 1) % currentRing.length;
        
        // Create quad face
        const faceId = halfEdgeMesh.addFace([
          currentRing[i],
          currentRing[next],
          nextRing[next],
          nextRing[i],
        ]);
        
        if (faceId) {
          this.newFaceIds.push(faceId);
        }
      }
    }

    // Add cap faces
    if (vertexRings.length > 0) {
      // Start cap
      const startFaceId = halfEdgeMesh.addFace(vertexRings[0]);
      if (startFaceId) this.newFaceIds.push(startFaceId);

      // End cap
      const endRing = [...vertexRings[vertexRings.length - 1]].reverse();
      const endFaceId = halfEdgeMesh.addFace(endRing);
      if (endFaceId) this.newFaceIds.push(endFaceId);
    }

    // Remove the original face
    halfEdgeMesh.data.faces.delete(this.faceId);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo SweepCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class BooleanUnionCommand extends BaseCommand {
  private meshB: Mesh;
  private originalMeshState?: string;

  constructor(meshB: Mesh) {
    super('boolean_union');
    this.meshB = meshB;
  }

  do(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    const halfEdgeMeshB = this.meshB as HalfEdgeMesh;
    
    // Store original state for undo
    this.originalMeshState = JSON.stringify({
      vertices: Array.from(halfEdgeMesh.data.vertices.entries()),
      halfEdges: Array.from(halfEdgeMesh.data.halfEdges.entries()),
      edges: Array.from(halfEdgeMesh.data.edges.entries()),
      faces: Array.from(halfEdgeMesh.data.faces.entries()),
    });

    // Simple union: merge all vertices, edges, and faces from meshB into mesh
    // This is a basic implementation - a full CSG implementation would handle intersections
    
    // Copy vertices from meshB
    for (const [id, vertex] of halfEdgeMeshB.data.vertices) {
      if (!halfEdgeMesh.data.vertices.has(id)) {
        halfEdgeMesh.data.vertices.set(id, vertex.clone());
      }
    }

    // Copy half-edges from meshB
    for (const [id, halfEdge] of halfEdgeMeshB.data.halfEdges) {
      if (!halfEdgeMesh.data.halfEdges.has(id)) {
        halfEdgeMesh.data.halfEdges.set(id, halfEdge.clone());
      }
    }

    // Copy edges from meshB
    for (const [id, edge] of halfEdgeMeshB.data.edges) {
      if (!halfEdgeMesh.data.edges.has(id)) {
        halfEdgeMesh.data.edges.set(id, edge.clone());
      }
    }

    // Copy faces from meshB
    for (const [id, face] of halfEdgeMeshB.data.faces) {
      if (!halfEdgeMesh.data.faces.has(id)) {
        halfEdgeMesh.data.faces.set(id, face.clone());
      }
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo BooleanUnionCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class BooleanDifferenceCommand extends BaseCommand {
  private meshB: Mesh;
  private originalMeshState?: string;

  constructor(meshB: Mesh) {
    super('boolean_difference');
    this.meshB = meshB;
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

    // Simple difference: remove faces that are inside meshB
    // This is a placeholder - full CSG would calculate actual intersections
    const meshBBounds = (this.meshB as HalfEdgeMesh).getBoundingBox();
    if (!meshBBounds) return;

    const facesToRemove: string[] = [];
    
    for (const [faceId] of halfEdgeMesh.data.faces) {
      const faceVertices = halfEdgeMesh.getFaceVertices(faceId);
      if (faceVertices.length === 0) continue;

      // Check if face center is inside meshB bounds (simplified check)
      const center = { x: 0, y: 0, z: 0 };
      for (const vertex of faceVertices) {
        center.x += vertex.pos.x;
        center.y += vertex.pos.y;
        center.z += vertex.pos.z;
      }
      center.x /= faceVertices.length;
      center.y /= faceVertices.length;
      center.z /= faceVertices.length;

      // Simple inside check using bounding box
      if (center.x >= meshBBounds.min.x && center.x <= meshBBounds.max.x &&
          center.y >= meshBBounds.min.y && center.y <= meshBBounds.max.y &&
          center.z >= meshBBounds.min.z && center.z <= meshBBounds.max.z) {
        facesToRemove.push(faceId);
      }
    }

    // Remove faces
    for (const faceId of facesToRemove) {
      halfEdgeMesh.data.faces.delete(faceId);
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo BooleanDifferenceCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class SubdivideCommand extends BaseCommand {
  private faceId: string;
  private originalMeshState?: string;

  constructor(faceId: string) {
    super('subdivide');
    this.faceId = faceId;
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

    const face = halfEdgeMesh.getFace(this.faceId);
    if (!face) {
      throw new Error(`Face ${this.faceId} not found`);
    }

    // Get face vertices
    const faceVertices = halfEdgeMesh.getFaceVertices(this.faceId);
    if (faceVertices.length < 3) {
      throw new Error(`Face must have at least 3 vertices for subdivision`);
    }

    // Calculate face center
    const center = { x: 0, y: 0, z: 0 };
    for (const vertex of faceVertices) {
      center.x += vertex.pos.x;
      center.y += vertex.pos.y;
      center.z += vertex.pos.z;
    }
    center.x /= faceVertices.length;
    center.y /= faceVertices.length;
    center.z /= faceVertices.length;

    // Add center vertex
    const centerVertexId = halfEdgeMesh.addVertex(center);

    // Remove original face
    halfEdgeMesh.data.faces.delete(this.faceId);

    // Create new triangular faces from center to each edge
    for (let i = 0; i < faceVertices.length; i++) {
      const current = faceVertices[i];
      const next = faceVertices[(i + 1) % faceVertices.length];

      halfEdgeMesh.addFace([current.id, next.id, centerVertexId]);
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo SubdivideCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}