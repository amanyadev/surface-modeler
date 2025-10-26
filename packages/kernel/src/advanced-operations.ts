import { Vec3 } from './core/types.js';
import { BaseCommand } from './commands/base-command.js';
import { HalfEdgeMesh, Mesh } from './core/mesh.js';
import { vec3Add, vec3Scale, vec3Sub, vec3Normalize } from './utils/math.js';

export class FilletCommand extends BaseCommand {
  private edgeId: string;
  private radius: number;
  private originalMeshState?: string;

  constructor(edgeId: string, radius: number) {
    super('fillet');
    this.edgeId = edgeId;
    this.radius = radius;
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

    const edge = halfEdgeMesh.getEdge(this.edgeId);
    if (!edge) {
      throw new Error(`Edge ${this.edgeId} not found`);
    }

    const halfEdge = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge || !halfEdge.twin) {
      console.warn(`Invalid half-edge structure for edge ${this.edgeId}, skipping fillet`);
      return;
    }

    const twin = halfEdgeMesh.getHalfEdge(halfEdge.twin);
    if (!twin) {
      console.warn(`Twin half-edge not found for edge ${this.edgeId}, skipping fillet`);
      return;
    }

    // Get the edge vertices properly
    const vertex1 = halfEdgeMesh.getVertex(halfEdge.vertex);
    const vertex2 = halfEdgeMesh.getVertex(twin.vertex);
    
    if (!vertex1 || !vertex2) {
      console.warn(`Could not find edge vertices for fillet, skipping`);
      return;
    }

    // Calculate edge vector and length
    const edgeVec = vec3Sub(vertex2.pos, vertex1.pos);
    const edgeLength = Math.sqrt(edgeVec.x * edgeVec.x + edgeVec.y * edgeVec.y + edgeVec.z * edgeVec.z);
    
    // Skip if radius is too large relative to edge
    if (this.radius > edgeLength * 0.4) {
      console.warn(`Fillet radius too large for edge, skipping`);
      return;
    }

    // Create new vertices at fillet start and end points (inset from original vertices)
    const insetDist = this.radius;
    const edgeDir = vec3Normalize(edgeVec);
    
    const filletStart = vec3Add(vertex1.pos, vec3Scale(edgeDir, insetDist));
    const filletEnd = vec3Sub(vertex2.pos, vec3Scale(edgeDir, insetDist));
    
    // Create the fillet arc vertices
    const filletVertices: string[] = [];
    const segments = 4; // Keep it simple with 4 segments
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Linear interpolation between fillet start and end
      const pos = {
        x: filletStart.x + (filletEnd.x - filletStart.x) * t,
        y: filletStart.y + (filletEnd.y - filletStart.y) * t,
        z: filletStart.z + (filletEnd.z - filletStart.z) * t,
      };
      
      // Add slight perpendicular offset to create the rounding
      const offsetAmount = Math.sin(t * Math.PI) * this.radius * 0.3;
      
      // Simple perpendicular vector (cross product approximation)
      const perpVec = {
        x: -edgeDir.y,
        y: edgeDir.x,
        z: 0
      };
      
      const roundedPos = {
        x: pos.x + perpVec.x * offsetAmount,
        y: pos.y + perpVec.y * offsetAmount,
        z: pos.z + perpVec.z * offsetAmount,
      };
      
      const vertexId = halfEdgeMesh.addVertex(roundedPos);
      filletVertices.push(vertexId);
    }

    // Create faces to connect the fillet - simple strip
    for (let i = 0; i < filletVertices.length - 1; i++) {
      try {
        // Create quadrilateral faces if we have enough vertices
        if (i === 0) {
          // Connect to first original vertex
          halfEdgeMesh.addFace([
            vertex1.id,
            filletVertices[i],
            filletVertices[i + 1]
          ]);
        } else if (i === filletVertices.length - 2) {
          // Connect to second original vertex  
          halfEdgeMesh.addFace([
            filletVertices[i],
            filletVertices[i + 1], 
            vertex2.id
          ]);
        } else {
          // Middle segments - just connect adjacent fillet vertices
          halfEdgeMesh.addFace([
            filletVertices[i],
            filletVertices[i + 1],
            filletVertices[i]
          ]);
        }
      } catch (error) {
        // Ignore face creation errors
        console.warn('Failed to create fillet face segment:', error);
      }
    }

    // Force mesh to recalculate normals
    halfEdgeMesh.recalculateNormals();
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo FilletCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class ChamferCommand extends BaseCommand {
  private edgeId: string;
  private distance: number;
  private originalMeshState?: string;

  constructor(edgeId: string, distance: number) {
    super('chamfer');
    this.edgeId = edgeId;
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

    const edge = halfEdgeMesh.getEdge(this.edgeId);
    if (!edge) {
      throw new Error(`Edge ${this.edgeId} not found`);
    }

    const halfEdge = halfEdgeMesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge || !halfEdge.twin) {
      throw new Error(`Invalid half-edge structure for edge ${this.edgeId}`);
    }

    const twin = halfEdgeMesh.getHalfEdge(halfEdge.twin);
    if (!twin) {
      throw new Error(`Twin half-edge not found for edge ${this.edgeId}`);
    }

    // Get the two vertices of the edge
    const vertex1 = halfEdgeMesh.getVertex(halfEdge.vertex);
    const vertex2 = halfEdgeMesh.getVertex(twin.vertex);
    
    if (!vertex1 || !vertex2) {
      throw new Error(`Vertices not found for edge ${this.edgeId}`);
    }

    // Calculate edge direction and perpendicular
    const edgeDir = vec3Normalize(vec3Sub(vertex2.pos, vertex1.pos));
    const perpendicular = { x: -edgeDir.y, y: edgeDir.x, z: 0 }; // Simple 2D perpendicular

    // Create chamfer vertices
    const chamfer1 = vec3Add(vertex1.pos, vec3Scale(perpendicular, this.distance));
    const chamfer2 = vec3Add(vertex2.pos, vec3Scale(perpendicular, this.distance));

    const chamferVertex1Id = halfEdgeMesh.addVertex(chamfer1);
    const chamferVertex2Id = halfEdgeMesh.addVertex(chamfer2);

    // Create chamfer face
    halfEdgeMesh.addFace([
      vertex1.id,
      chamferVertex1Id,
      chamferVertex2Id,
      vertex2.id,
    ]);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo ChamferCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class LoftCommand extends BaseCommand {
  private profiles: Vec3[][];
  private originalMeshState?: string;

  constructor(profiles: Vec3[][]) {
    super('loft');
    this.profiles = profiles;
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

    if (this.profiles.length < 2) {
      throw new Error('Loft requires at least 2 profiles');
    }

    const vertexRings: string[][] = [];

    // Create vertex rings for each profile
    for (const profile of this.profiles) {
      const ring: string[] = [];
      for (const point of profile) {
        const vertexId = halfEdgeMesh.addVertex(point);
        ring.push(vertexId);
      }
      vertexRings.push(ring);
    }

    // Create faces between adjacent rings
    for (let ringIndex = 0; ringIndex < vertexRings.length - 1; ringIndex++) {
      const currentRing = vertexRings[ringIndex];
      const nextRing = vertexRings[ringIndex + 1];

      const minLength = Math.min(currentRing.length, nextRing.length);

      for (let i = 0; i < minLength; i++) {
        const next = (i + 1) % minLength;
        
        // Create quad face between rings
        halfEdgeMesh.addFace([
          currentRing[i],
          currentRing[next],
          nextRing[next],
          nextRing[i],
        ]);
      }
    }

    // Add end caps if profiles are closed
    if (this.profiles[0].length > 2) {
      halfEdgeMesh.addFace(vertexRings[0]);
      halfEdgeMesh.addFace([...vertexRings[vertexRings.length - 1]].reverse());
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo LoftCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class ShellCommand extends BaseCommand {
  private thickness: number;
  private originalMeshState?: string;

  constructor(thickness: number) {
    super('shell');
    this.thickness = thickness;
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

    // Create offset vertices
    const offsetVertices = new Map<string, string>();

    for (const [vertexId, vertex] of halfEdgeMesh.data.vertices) {
      // Calculate average normal at vertex (simplified)
      let averageNormal = { x: 0, y: 0, z: 1 }; // Default upward normal
      
      // Offset vertex along normal
      const offsetPos = vec3Add(vertex.pos, vec3Scale(averageNormal, this.thickness));
      const offsetVertexId = halfEdgeMesh.addVertex(offsetPos);
      offsetVertices.set(vertexId, offsetVertexId);
    }

    // Create offset faces
    const originalFaces = Array.from(halfEdgeMesh.data.faces.entries());
    for (const [faceId] of originalFaces) {
      const faceVertices = halfEdgeMesh.getFaceVertices(faceId);
      const offsetFaceVertices = faceVertices
        .map(v => offsetVertices.get(v.id))
        .filter(id => id !== undefined) as string[];

      if (offsetFaceVertices.length === faceVertices.length) {
        // Create offset face with reversed winding
        halfEdgeMesh.addFace([...offsetFaceVertices].reverse());
      }
    }

    // Create side walls connecting original and offset vertices
    for (const [vertexId] of halfEdgeMesh.data.vertices) {
      const offsetVertexId = offsetVertices.get(vertexId);
      if (!offsetVertexId) continue;

      // Find adjacent vertices (simplified approach)
      // In a real implementation, you'd traverse the half-edge structure
      // This is a placeholder for the side wall creation
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo ShellCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class MirrorCommand extends BaseCommand {
  private plane: { point: Vec3; normal: Vec3 };
  private originalMeshState?: string;

  constructor(plane: { point: Vec3; normal: Vec3 }) {
    super('mirror');
    this.plane = plane;
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

    const mirroredVertices = new Map<string, string>();

    // Mirror all vertices
    for (const [vertexId, vertex] of halfEdgeMesh.data.vertices) {
      const mirroredPos = this.mirrorPoint(vertex.pos, this.plane);
      const mirroredVertexId = halfEdgeMesh.addVertex(mirroredPos);
      mirroredVertices.set(vertexId, mirroredVertexId);
    }

    // Mirror all faces
    const originalFaces = Array.from(halfEdgeMesh.data.faces.entries());
    for (const [faceId] of originalFaces) {
      const faceVertices = halfEdgeMesh.getFaceVertices(faceId);
      const mirroredFaceVertices = faceVertices
        .map(v => mirroredVertices.get(v.id))
        .filter(id => id !== undefined) as string[];

      if (mirroredFaceVertices.length === faceVertices.length) {
        // Create mirrored face with reversed winding
        halfEdgeMesh.addFace([...mirroredFaceVertices].reverse());
      }
    }
  }

  private mirrorPoint(point: Vec3, plane: { point: Vec3; normal: Vec3 }): Vec3 {
    // Mirror point across plane
    const toPoint = vec3Sub(point, plane.point);
    const distance = vec3Scale(plane.normal, 2 * (toPoint.x * plane.normal.x + toPoint.y * plane.normal.y + toPoint.z * plane.normal.z));
    return vec3Sub(point, distance);
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo MirrorCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}

export class LinearPatternCommand extends BaseCommand {
  private direction: Vec3;
  private count: number;
  private spacing: number;
  private originalMeshState?: string;

  constructor(direction: Vec3, count: number, spacing: number) {
    super('linear_pattern');
    this.direction = vec3Normalize(direction);
    this.count = count;
    this.spacing = spacing;
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

    const originalVertices = Array.from(halfEdgeMesh.data.vertices.entries());
    const originalFaces = Array.from(halfEdgeMesh.data.faces.entries());

    // Create pattern instances
    for (let i = 1; i < this.count; i++) {
      const offset = vec3Scale(this.direction, i * this.spacing);
      const instanceVertices = new Map<string, string>();

      // Create offset vertices for this instance
      for (const [vertexId, vertex] of originalVertices) {
        const offsetPos = vec3Add(vertex.pos, offset);
        const offsetVertexId = halfEdgeMesh.addVertex(offsetPos);
        instanceVertices.set(vertexId, offsetVertexId);
      }

      // Create offset faces for this instance
      for (const [faceId] of originalFaces) {
        const faceVertices = halfEdgeMesh.getFaceVertices(faceId);
        const offsetFaceVertices = faceVertices
          .map(v => instanceVertices.get(v.id))
          .filter(id => id !== undefined) as string[];

        if (offsetFaceVertices.length === faceVertices.length) {
          halfEdgeMesh.addFace(offsetFaceVertices);
        }
      }
    }
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo LinearPatternCommand - no original state');
    }

    // Restore original mesh state
    const originalState = JSON.parse(this.originalMeshState);
    
    halfEdgeMesh.data.vertices = new Map(originalState.vertices);
    halfEdgeMesh.data.halfEdges = new Map(originalState.halfEdges);
    halfEdgeMesh.data.edges = new Map(originalState.edges);
    halfEdgeMesh.data.faces = new Map(originalState.faces);
  }
}