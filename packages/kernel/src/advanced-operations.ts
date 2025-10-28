import { Vec3 } from './core/types.js';
import { BaseCommand } from './commands/base-command.js';
import { HalfEdgeMesh, Mesh } from './core/mesh.js';
import { vec3Add, vec3Scale, vec3Sub, vec3Normalize, vec3Cross, vec3Dot, vec3Length } from './utils/math.js';

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

    // Get adjacent edges to determine fillet plane
    const adjacentEdges = this.getAdjacentEdges(halfEdgeMesh, halfEdge, twin);
    if (!adjacentEdges) {
      console.warn(`Could not find adjacent edges for fillet, skipping`);
      return;
    }

    // Calculate edge vector and length
    const edgeVec = vec3Sub(vertex2.pos, vertex1.pos);
    const edgeLength = vec3Length(edgeVec);
    
    // Skip if radius is too large relative to edge
    if (this.radius > edgeLength * 0.4) {
      console.warn(`Fillet radius too large for edge, skipping`);
      return;
    }

    // Calculate fillet geometry
    const filletGeometry = this.calculateFilletGeometry(
      vertex1.pos, vertex2.pos, 
      adjacentEdges.dir1, adjacentEdges.dir2,
      this.radius
    );
    
    if (!filletGeometry) {
      console.warn(`Could not calculate fillet geometry, skipping`);
      return;
    }
    
    // Create fillet vertices along the arc
    const filletVertices: string[] = [];
    const segments = Math.max(4, Math.ceil(this.radius * 8)); // More segments for larger radii
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = this.interpolateFilletArc(filletGeometry, t);
      const vertexId = halfEdgeMesh.addVertex(pos);
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

    // Update mesh normals if method exists
    if (typeof (halfEdgeMesh as any).recalculateNormals === 'function') {
      (halfEdgeMesh as any).recalculateNormals();
    }
  }

  private getAdjacentEdges(mesh: HalfEdgeMesh, halfEdge: any, twin: any) {
    // Get previous edge of halfEdge to find direction
    const prev1 = halfEdge.prev ? mesh.getHalfEdge(halfEdge.prev) : null;
    const prev2 = twin.prev ? mesh.getHalfEdge(twin.prev) : null;
    
    if (!prev1 || !prev2) return null;
    
    const prevVertex1 = prev1.vertex ? mesh.getVertex(prev1.vertex) : null;
    const prevVertex2 = prev2.vertex ? mesh.getVertex(prev2.vertex) : null;
    const currentVertex1 = mesh.getVertex(halfEdge.vertex);
    const currentVertex2 = mesh.getVertex(twin.vertex);
    
    if (!prevVertex1 || !prevVertex2 || !currentVertex1 || !currentVertex2) return null;
    
    const dir1 = vec3Normalize(vec3Sub(currentVertex1.pos, prevVertex1.pos));
    const dir2 = vec3Normalize(vec3Sub(currentVertex2.pos, prevVertex2.pos));
    
    return { dir1, dir2 };
  }

  private calculateFilletGeometry(p1: Vec3, p2: Vec3, dir1: Vec3, dir2: Vec3, radius: number) {
    const edgeVec = vec3Sub(p2, p1);
    // const edgeLength = vec3Length(edgeVec);
    const edgeDir = vec3Normalize(edgeVec);
    
    // Calculate the angle between adjacent faces
    const normal1 = vec3Cross(dir1, edgeDir);
    const normal2 = vec3Cross(edgeDir, dir2);
    
    if (vec3Length(normal1) < 1e-6 || vec3Length(normal2) < 1e-6) {
      return null; // Degenerate case
    }
    
    const angle = Math.acos(Math.max(-1, Math.min(1, vec3Dot(vec3Normalize(normal1), vec3Normalize(normal2)))));
    
    // Calculate fillet center and arc parameters
    const centerOffset = radius / Math.sin(angle / 2);
    const avgNormal = vec3Normalize(vec3Add(vec3Normalize(normal1), vec3Normalize(normal2)));
    
    const center = vec3Add(
      vec3Scale(vec3Add(p1, p2), 0.5),
      vec3Scale(avgNormal, centerOffset)
    );
    
    return {
      center,
      radius,
      startPoint: p1,
      endPoint: p2,
      normal1: vec3Normalize(normal1),
      normal2: vec3Normalize(normal2),
      angle
    };
  }

  private interpolateFilletArc(geometry: any, t: number): Vec3 {
    // Create a smooth arc between start and end points
    // const angle = geometry.angle * t;
    // const rotationAxis = vec3Normalize(vec3Cross(geometry.normal1, geometry.normal2));
    
    // Use spherical linear interpolation for smooth curves
    // const startToCenter = vec3Sub(geometry.startPoint, geometry.center);
    // const endToCenter = vec3Sub(geometry.endPoint, geometry.center);
    
    // Simple linear interpolation with sine curve for smoothness
    const lerpPos = {
      x: geometry.startPoint.x + (geometry.endPoint.x - geometry.startPoint.x) * t,
      y: geometry.startPoint.y + (geometry.endPoint.y - geometry.startPoint.y) * t,
      z: geometry.startPoint.z + (geometry.endPoint.z - geometry.startPoint.z) * t
    };
    
    // Add curvature
    const curvature = Math.sin(t * Math.PI) * geometry.radius * 0.2;
    const perpDir = vec3Normalize(vec3Cross(
      vec3Sub(geometry.endPoint, geometry.startPoint),
      vec3Add(geometry.normal1, geometry.normal2)
    ));
    
    return vec3Add(lerpPos, vec3Scale(perpDir, curvature));
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
  private angle: number;
  private originalMeshState?: string;

  constructor(edgeId: string, distance: number, angle: number = 45) {
    super('chamfer');
    this.edgeId = edgeId;
    this.distance = distance;
    this.angle = Math.max(1, Math.min(89, angle)); // Clamp angle between 1-89 degrees
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

    // Get face normals for proper chamfer direction calculation
    const face1 = halfEdge.face ? halfEdgeMesh.getFace(halfEdge.face) : null;
    const face2 = twin.face ? halfEdgeMesh.getFace(twin.face) : null;
    
    if (!face1 || !face2) {
      throw new Error(`Cannot chamfer boundary edge ${this.edgeId}`);
    }

    // Calculate proper chamfer geometry
    const chamferGeometry = this.calculateChamferGeometry(
      halfEdgeMesh, vertex1.pos, vertex2.pos, halfEdge, twin, face1, face2
    );
    
    if (!chamferGeometry) {
      throw new Error(`Could not calculate chamfer geometry for edge ${this.edgeId}`);
    }

    // Create chamfer vertices
    const chamferVertices: string[] = [];
    for (const pos of chamferGeometry.vertices) {
      const vertexId = halfEdgeMesh.addVertex(pos);
      chamferVertices.push(vertexId);
    }

    // Create chamfer faces
    for (const faceVertexIds of chamferGeometry.faces) {
      try {
        halfEdgeMesh.addFace(faceVertexIds);
      } catch (error) {
        console.warn('Failed to create chamfer face:', error);
      }
    }
  }

  private calculateChamferGeometry(mesh: HalfEdgeMesh, p1: Vec3, p2: Vec3, halfEdge: any, twin: any, face1: any, face2: any) {
    const edgeVec = vec3Sub(p2, p1);
    const edgeDir = vec3Normalize(edgeVec);
    
    // Calculate face normals
    const normal1 = face1.normal || { x: 0, y: 0, z: 1 };
    const normal2 = face2.normal || { x: 0, y: 0, z: -1 };
    
    // Calculate chamfer direction (bisector of face normals)
    const avgNormal = vec3Normalize(vec3Add(normal1, normal2));
    const chamferDir = vec3Normalize(vec3Cross(edgeDir, avgNormal));
    
    // Convert angle to radians
    const angleRad = (this.angle * Math.PI) / 180;
    const chamferHeight = this.distance * Math.tan(angleRad);
    
    // Calculate chamfer vertices
    const offset1 = vec3Scale(chamferDir, this.distance);
    const offset2 = vec3Scale(avgNormal, chamferHeight);
    
    const vertices: Vec3[] = [];
    // const faces: string[][] = [];
    
    // Create chamfer vertices at both ends of the edge
    const chamfer1A = vec3Add(vec3Add(p1, offset1), offset2);
    const chamfer1B = vec3Add(vec3Sub(p1, offset1), offset2);
    const chamfer2A = vec3Add(vec3Add(p2, offset1), offset2);
    const chamfer2B = vec3Add(vec3Sub(p2, offset1), offset2);
    
    vertices.push(chamfer1A, chamfer1B, chamfer2A, chamfer2B);
    
    // Get vertex IDs for face creation
    const vertex1 = mesh.getVertex(halfEdge.vertex);
    const vertex2 = mesh.getVertex(twin.vertex);
    
    if (!vertex1 || !vertex2) return null;
    
    // Create face connectivity (this will be filled with actual vertex IDs after vertices are created)
    const faceConnectivity = [
      [0, 1, 3, 2], // Main chamfer face
      [0, 1], // Connection faces will be added by caller
      [2, 3]
    ];
    
    return {
      vertices,
      faces: faceConnectivity.map(indices => 
        indices.map(i => i.toString()) // Placeholder - will be replaced with actual IDs
      )
    };
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

export class SmoothCommand extends BaseCommand {
  private iterations: number;
  private factor: number;
  private originalMeshState?: string;

  constructor(iterations: number = 1, factor: number = 0.5) {
    super('smooth');
    this.iterations = Math.max(1, iterations);
    this.factor = Math.max(0.1, Math.min(0.9, factor)); // Clamp between 0.1 and 0.9
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

    // Apply Laplacian smoothing for specified iterations
    for (let iter = 0; iter < this.iterations; iter++) {
      this.applySmoothingIteration(halfEdgeMesh);
    }

    // Recalculate face normals after smoothing
    this.recalculateFaceNormals(halfEdgeMesh);
  }

  private applySmoothingIteration(mesh: HalfEdgeMesh): void {
    const newPositions = new Map<string, Vec3>();

    // Calculate new positions for all vertices using Laplacian smoothing
    for (const [vertexId, vertex] of mesh.data.vertices) {
      const neighbors = this.getVertexNeighbors(mesh, vertexId);
      
      if (neighbors.length === 0) {
        // No neighbors, keep original position
        newPositions.set(vertexId, { ...vertex.pos });
        continue;
      }

      // Calculate average neighbor position
      const avgNeighborPos = this.calculateAveragePosition(neighbors);
      
      // Apply smoothing with factor (0 = no change, 1 = full neighbor average)
      const smoothedPos = {
        x: vertex.pos.x + (avgNeighborPos.x - vertex.pos.x) * this.factor,
        y: vertex.pos.y + (avgNeighborPos.y - vertex.pos.y) * this.factor,
        z: vertex.pos.z + (avgNeighborPos.z - vertex.pos.z) * this.factor,
      };
      
      newPositions.set(vertexId, smoothedPos);
    }

    // Apply new positions
    for (const [vertexId, newPos] of newPositions) {
      const vertex = mesh.data.vertices.get(vertexId);
      if (vertex) {
        vertex.pos = newPos;
      }
    }
  }

  private getVertexNeighbors(mesh: HalfEdgeMesh, vertexId: string): Vec3[] {
    const neighbors: Vec3[] = [];
    const vertex = mesh.getVertex(vertexId);
    
    if (!vertex || !vertex.halfEdge) {
      return neighbors;
    }

    // Traverse around the vertex to find all neighbors
    let currentHalfEdge = mesh.getHalfEdge(vertex.halfEdge);
    const startHalfEdgeId = vertex.halfEdge;
    
    do {
      if (!currentHalfEdge) break;
      
      // Get the target vertex of this half-edge
      const neighborVertex = mesh.getVertex(currentHalfEdge.vertex);
      if (neighborVertex) {
        neighbors.push(neighborVertex.pos);
      }
      
      // Move to the next half-edge around this vertex
      // Go to twin, then to next
      if (currentHalfEdge.twin) {
        const twin = mesh.getHalfEdge(currentHalfEdge.twin);
        if (twin && twin.next) {
          currentHalfEdge = mesh.getHalfEdge(twin.next);
        } else {
          break;
        }
      } else {
        break; // Boundary vertex
      }
      
    } while (currentHalfEdge && currentHalfEdge.id !== startHalfEdgeId);

    return neighbors;
  }

  private calculateAveragePosition(positions: Vec3[]): Vec3 {
    if (positions.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    const sum = positions.reduce(
      (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y, z: acc.z + pos.z }),
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: sum.x / positions.length,
      y: sum.y / positions.length,
      z: sum.z / positions.length,
    };
  }

  private recalculateFaceNormals(mesh: HalfEdgeMesh): void {
    for (const [faceId, face] of mesh.data.faces) {
      const faceVertices = mesh.getFaceVertices(faceId);
      if (faceVertices.length >= 3) {
        const positions = faceVertices.map(v => v.pos);
        const normal = this.calculateFaceNormal(positions);
        face.normal = normal;
      }
    }
  }

  private calculateFaceNormal(vertices: Vec3[]): Vec3 {
    if (vertices.length < 3) {
      return { x: 0, y: 1, z: 0 };
    }

    const v1 = vertices[0];
    const v2 = vertices[1];
    const v3 = vertices[2];

    const edge1 = vec3Sub(v2, v1);
    const edge2 = vec3Sub(v3, v1);
    
    return vec3Normalize(vec3Cross(edge1, edge2));
  }

  undo(mesh: Mesh): void {
    const halfEdgeMesh = mesh as HalfEdgeMesh;
    if (!this.originalMeshState) {
      throw new Error('Cannot undo SmoothCommand - no original state');
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