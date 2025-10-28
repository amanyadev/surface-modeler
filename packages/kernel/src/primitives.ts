import { HalfEdgeMesh, Mesh } from './core/mesh.js';
import { vec3 } from './utils/math.js';

export function createPlane(width = 1, height = 1): Mesh {
  const mesh = new HalfEdgeMesh();
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Create vertices
  const v1 = mesh.addVertex(vec3(-halfWidth, 0, -halfHeight));
  const v2 = mesh.addVertex(vec3(halfWidth, 0, -halfHeight));
  const v3 = mesh.addVertex(vec3(halfWidth, 0, halfHeight));
  const v4 = mesh.addVertex(vec3(-halfWidth, 0, halfHeight));
  
  // Create face
  mesh.addFace([v1, v2, v3, v4]);
  
  return mesh;
}

export function createCube(size = 1): Mesh {
  const mesh = new HalfEdgeMesh();
  const half = size / 2;
  
  // Create vertices
  const vertices = [
    mesh.addVertex(vec3(-half, -half, -half)), // 0
    mesh.addVertex(vec3(half, -half, -half)),  // 1
    mesh.addVertex(vec3(half, half, -half)),   // 2
    mesh.addVertex(vec3(-half, half, -half)),  // 3
    mesh.addVertex(vec3(-half, -half, half)),  // 4
    mesh.addVertex(vec3(half, -half, half)),   // 5
    mesh.addVertex(vec3(half, half, half)),    // 6
    mesh.addVertex(vec3(-half, half, half)),   // 7
  ];
  
  const v = vertices;
  
  // Create faces (counter-clockwise when viewed from outside)
  mesh.addFace([v[0], v[1], v[2], v[3]]); // Bottom
  mesh.addFace([v[4], v[7], v[6], v[5]]); // Top
  mesh.addFace([v[0], v[4], v[5], v[1]]); // Front
  mesh.addFace([v[2], v[6], v[7], v[3]]); // Back
  mesh.addFace([v[0], v[3], v[7], v[4]]); // Left
  mesh.addFace([v[1], v[5], v[6], v[2]]); // Right
  
  return mesh;
}

export function createCylinder(radius = 0.5, height = 1, segments = 16): Mesh {
  const mesh = new HalfEdgeMesh();
  const halfHeight = height / 2;
  
  // Create vertices
  const bottomVertices: string[] = [];
  const topVertices: string[] = [];
  
  // Bottom and top circle vertices with better distribution
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    const bottomVertex = mesh.addVertex(vec3(x, -halfHeight, z));
    const topVertex = mesh.addVertex(vec3(x, halfHeight, z));
    
    bottomVertices.push(bottomVertex);
    topVertices.push(topVertex);
  }
  
  // Center vertices for caps
  const bottomCenter = mesh.addVertex(vec3(0, -halfHeight, 0));
  const topCenter = mesh.addVertex(vec3(0, halfHeight, 0));
  
  // Create bottom cap faces (correct winding)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    mesh.addFace([bottomCenter, bottomVertices[i], bottomVertices[next]]);
  }
  
  // Create top cap faces (correct winding)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    mesh.addFace([topCenter, topVertices[next], topVertices[i]]);
  }
  
  // Create side faces with consistent winding
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    mesh.addFace([
      bottomVertices[i],
      topVertices[i],
      topVertices[next],
      bottomVertices[next],
    ]);
  }
  
  return mesh;
}

export function createSphere(radius = 0.5, segments = 24, rings = 16): Mesh {
  const mesh = new HalfEdgeMesh();
  
  const vertices: string[] = [];
  
  // Create vertices for sphere using spherical coordinates
  for (let ring = 0; ring <= rings; ring++) {
    const phi = (ring / rings) * Math.PI; // 0 to PI
    const y = Math.cos(phi) * radius;
    const ringRadius = Math.sin(phi) * radius;
    
    for (let segment = 0; segment < segments; segment++) {
      const theta = (segment / segments) * Math.PI * 2; // 0 to 2*PI
      const x = Math.cos(theta) * ringRadius;
      const z = Math.sin(theta) * ringRadius;
      
      const vertex = mesh.addVertex(vec3(x, y, z));
      vertices.push(vertex);
    }
  }
  
  // Create faces with better topology
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const current = ring * segments + segment;
      const next = ring * segments + ((segment + 1) % segments);
      const below = (ring + 1) * segments + segment;
      const belowNext = (ring + 1) * segments + ((segment + 1) % segments);
      
      if (ring === 0) {
        // Top cap triangles - avoid degenerate quads at pole
        mesh.addFace([vertices[current], vertices[next], vertices[belowNext]]);
      } else if (ring === rings - 1) {
        // Bottom cap triangles - avoid degenerate quads at pole
        mesh.addFace([vertices[current], vertices[below], vertices[next]]);
      } else {
        // Middle section quads
        mesh.addFace([vertices[current], vertices[next], vertices[belowNext], vertices[below]]);
      }
    }
  }
  
  return mesh;
}

export function createTorus(majorRadius = 0.5, minorRadius = 0.2, majorSegments = 24, minorSegments = 12): Mesh {
  const mesh = new HalfEdgeMesh();
  
  const vertices: string[][] = [];
  
  // Create vertices for torus with improved parameterization
  for (let i = 0; i < majorSegments; i++) {
    vertices[i] = [];
    const u = (i / majorSegments) * Math.PI * 2;
    
    for (let j = 0; j < minorSegments; j++) {
      const v = (j / minorSegments) * Math.PI * 2;
      
      const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
      const y = minorRadius * Math.sin(v);
      const z = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
      
      const vertex = mesh.addVertex(vec3(x, y, z));
      vertices[i][j] = vertex;
    }
  }
  
  // Create faces with consistent winding
  for (let i = 0; i < majorSegments; i++) {
    for (let j = 0; j < minorSegments; j++) {
      const nextI = (i + 1) % majorSegments;
      const nextJ = (j + 1) % minorSegments;
      
      mesh.addFace([
        vertices[i][j],
        vertices[i][nextJ],
        vertices[nextI][nextJ],
        vertices[nextI][j]
      ]);
    }
  }
  
  return mesh;
}

export function createIcosahedron(radius = 0.5): Mesh {
  const mesh = new HalfEdgeMesh();
  
  // Golden ratio
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = radius / Math.sqrt(phi * phi + 1);
  const b = a * phi;
  
  // Create the 12 vertices of icosahedron
  const vertices = [
    mesh.addVertex(vec3(0, a, b)),
    mesh.addVertex(vec3(0, a, -b)),
    mesh.addVertex(vec3(0, -a, b)),
    mesh.addVertex(vec3(0, -a, -b)),
    mesh.addVertex(vec3(a, b, 0)),
    mesh.addVertex(vec3(a, -b, 0)),
    mesh.addVertex(vec3(-a, b, 0)),
    mesh.addVertex(vec3(-a, -b, 0)),
    mesh.addVertex(vec3(b, 0, a)),
    mesh.addVertex(vec3(-b, 0, a)),
    mesh.addVertex(vec3(b, 0, -a)),
    mesh.addVertex(vec3(-b, 0, -a))
  ];
  
  // Create the 20 triangular faces
  const faces = [
    [0, 8, 4], [0, 4, 6], [0, 6, 9], [0, 9, 2], [0, 2, 8],
    [3, 10, 5], [3, 5, 7], [3, 7, 11], [3, 11, 1], [3, 1, 10],
    [4, 8, 10], [6, 4, 1], [9, 6, 11], [2, 9, 7], [8, 2, 5],
    [10, 8, 5], [1, 4, 10], [11, 6, 1], [7, 9, 11], [5, 2, 7]
  ];
  
  for (const face of faces) {
    mesh.addFace([vertices[face[0]], vertices[face[1]], vertices[face[2]]]);
  }
  
  return mesh;
}

export function createPyramid(baseSize = 1, height = 1): Mesh {
  const mesh = new HalfEdgeMesh();
  const half = baseSize / 2;
  
  // Create vertices
  const base1 = mesh.addVertex(vec3(-half, 0, -half));
  const base2 = mesh.addVertex(vec3(half, 0, -half));
  const base3 = mesh.addVertex(vec3(half, 0, half));
  const base4 = mesh.addVertex(vec3(-half, 0, half));
  const apex = mesh.addVertex(vec3(0, height, 0));
  
  // Create faces
  mesh.addFace([base1, base2, base3, base4]); // Base
  mesh.addFace([base1, apex, base2]); // Side 1
  mesh.addFace([base2, apex, base3]); // Side 2
  mesh.addFace([base3, apex, base4]); // Side 3
  mesh.addFace([base4, apex, base1]); // Side 4
  
  return mesh;
}

export function createOctahedron(size = 0.5): Mesh {
  const mesh = new HalfEdgeMesh();
  
  // Create vertices
  const top = mesh.addVertex(vec3(0, size, 0));
  const bottom = mesh.addVertex(vec3(0, -size, 0));
  const front = mesh.addVertex(vec3(0, 0, size));
  const back = mesh.addVertex(vec3(0, 0, -size));
  const right = mesh.addVertex(vec3(size, 0, 0));
  const left = mesh.addVertex(vec3(-size, 0, 0));
  
  // Create triangular faces
  mesh.addFace([top, front, right]);
  mesh.addFace([top, right, back]);
  mesh.addFace([top, back, left]);
  mesh.addFace([top, left, front]);
  mesh.addFace([bottom, right, front]);
  mesh.addFace([bottom, back, right]);
  mesh.addFace([bottom, left, back]);
  mesh.addFace([bottom, front, left]);
  
  return mesh;
}

export function createDodecahedron(radius = 0.5): Mesh {
  const mesh = new HalfEdgeMesh();
  
  // Golden ratio
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;
  
  const a = radius / Math.sqrt(3);
  const b = a * invPhi;
  const c = a * phi;
  
  // Create the 20 vertices of dodecahedron
  const vertices = [
    // (±1, ±1, ±1)
    mesh.addVertex(vec3(a, a, a)),
    mesh.addVertex(vec3(a, a, -a)),
    mesh.addVertex(vec3(a, -a, a)),
    mesh.addVertex(vec3(a, -a, -a)),
    mesh.addVertex(vec3(-a, a, a)),
    mesh.addVertex(vec3(-a, a, -a)),
    mesh.addVertex(vec3(-a, -a, a)),
    mesh.addVertex(vec3(-a, -a, -a)),
    // (0, ±φ, ±1/φ)
    mesh.addVertex(vec3(0, c, b)),
    mesh.addVertex(vec3(0, c, -b)),
    mesh.addVertex(vec3(0, -c, b)),
    mesh.addVertex(vec3(0, -c, -b)),
    // (±1/φ, 0, ±φ)
    mesh.addVertex(vec3(b, 0, c)),
    mesh.addVertex(vec3(-b, 0, c)),
    mesh.addVertex(vec3(b, 0, -c)),
    mesh.addVertex(vec3(-b, 0, -c)),
    // (±φ, ±1/φ, 0)
    mesh.addVertex(vec3(c, b, 0)),
    mesh.addVertex(vec3(c, -b, 0)),
    mesh.addVertex(vec3(-c, b, 0)),
    mesh.addVertex(vec3(-c, -b, 0))
  ];
  
  // Create the 12 pentagonal faces
  const faces = [
    [0, 16, 1, 9, 8],
    [0, 8, 4, 13, 12],
    [0, 12, 2, 17, 16],
    [1, 14, 3, 17, 2],
    [1, 16, 17, 3, 14],
    [2, 12, 13, 6, 10],
    [3, 11, 7, 19, 17],
    [4, 8, 9, 5, 18],
    [5, 9, 1, 14, 15],
    [6, 13, 4, 18, 19],
    [7, 11, 10, 6, 19],
    [8, 0, 2, 10, 11]
  ];
  
  for (const face of faces) {
    mesh.addFace(face.map(i => vertices[i]));
  }
  
  return mesh;
}