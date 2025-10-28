import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { HalfEdgeMesh } from '@half-edge/kernel';

/**
 * Convert Three.js BufferGeometry to Half-Edge Mesh
 */
export function bufferGeometryToHalfEdge(geometry: THREE.BufferGeometry): HalfEdgeMesh | null {
  try {
    // Ensure we have position attributes
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) {
      console.error('Geometry has no position attribute');
      return null;
    }

    // Get vertices
    const positions = positionAttribute.array;
    const vertices: Array<{ x: number; y: number; z: number }> = [];
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Validate coordinates
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' &&
          isFinite(x) && isFinite(y) && isFinite(z)) {
        vertices.push({ x, y, z });
      } else {
        console.warn('Skipping invalid vertex coordinates:', { x, y, z });
      }
    }

    // Get faces (triangles)
    const faces: Array<number[]> = [];
    
    if (geometry.index) {
      // Indexed geometry
      const indices = geometry.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        faces.push([indices[i], indices[i + 1], indices[i + 2]]);
      }
    } else {
      // Non-indexed geometry
      for (let i = 0; i < vertices.length; i += 3) {
        faces.push([i, i + 1, i + 2]);
      }
    }

    // Create half-edge mesh
    const mesh = new HalfEdgeMesh();
    
    // Add vertices
    const vertexIds: string[] = [];
    vertices.forEach((vertex, index) => {
      const id = mesh.addVertex(vertex);
      vertexIds[index] = id;
    });

    // Add faces
    faces.forEach(face => {
      if (face.length >= 3) {
        // Check that all vertex indices are valid
        const validIndices = face.filter(index => index < vertexIds.length && vertexIds[index]);
        if (validIndices.length >= 3) {
          const faceVertexIds = validIndices.map(vertexIndex => vertexIds[vertexIndex]);
          try {
            mesh.addFace(faceVertexIds);
          } catch (error) {
            console.warn('Failed to add face:', error, 'vertices:', faceVertexIds);
          }
        } else {
          console.warn('Face has invalid vertex indices:', face, 'valid count:', validIndices.length);
        }
      }
    });

    return mesh;
  } catch (error) {
    console.error('Error converting BufferGeometry to HalfEdge:', error);
    return null;
  }
}

/**
 * Convert Half-Edge Mesh to Three.js BufferGeometry
 */
export function halfEdgeToBufferGeometry(mesh: HalfEdgeMesh): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Get all vertices
  const vertices = mesh.vertices();
  const faces = mesh.faces();
  
  // Create arrays for positions and indices
  const positions: number[] = [];
  const indices: number[] = [];
  const vertexMap = new Map<string, number>();
  
  // Add vertices to position array
  vertices.forEach((vertex, index) => {
    positions.push(vertex.pos.x, vertex.pos.y, vertex.pos.z);
    vertexMap.set(vertex.id, index);
  });
  
  // Add faces to indices array
  faces.forEach(face => {
    const faceVertices = mesh.getFaceVertices(face.id);
    if (faceVertices.length >= 3) {
      // Triangulate the face (fan triangulation)
      for (let i = 1; i < faceVertices.length - 1; i++) {
        const v0 = vertexMap.get(faceVertices[0].id);
        const v1 = vertexMap.get(faceVertices[i].id);
        const v2 = vertexMap.get(faceVertices[i + 1].id);
        
        if (v0 !== undefined && v1 !== undefined && v2 !== undefined) {
          indices.push(v0, v1, v2);
        }
      }
    }
  });
  
  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Load OBJ file and convert to Half-Edge Mesh
 */
export function loadOBJFile(file: File): Promise<HalfEdgeMesh | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const objContent = event.target?.result as string;
        const loader = new OBJLoader();
        const object = loader.parse(objContent);
        
        // Find the first mesh in the object
        let mesh: THREE.Mesh | null = null;
        object.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
            mesh = child;
            return;
          }
        });
        
        if (mesh && mesh.geometry instanceof THREE.BufferGeometry) {
          const halfEdgeMesh = bufferGeometryToHalfEdge(mesh.geometry);
          resolve(halfEdgeMesh);
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Load GLTF file and convert to Half-Edge Mesh
 */
export function loadGLTFFile(file: File): Promise<HalfEdgeMesh | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const loader = new GLTFLoader();
        
        loader.parse(arrayBuffer, '', (gltf: any) => {
          // Find the first mesh in the scene
          let mesh: THREE.Mesh | null = null;
          gltf.scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
              mesh = child;
              return;
            }
          });
          
          if (mesh && mesh.geometry instanceof THREE.BufferGeometry) {
            const halfEdgeMesh = bufferGeometryToHalfEdge(mesh.geometry);
            resolve(halfEdgeMesh);
          } else {
            resolve(null);
          }
        }, (error: any) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export Half-Edge Mesh as OBJ file
 */
export function exportAsOBJ(mesh: HalfEdgeMesh, filename: string = 'mesh.obj'): void {
  try {
    const geometry = halfEdgeToBufferGeometry(mesh);
    const threeMesh = new THREE.Mesh(geometry);
    
    const exporter = new OBJExporter();
    const objContent = exporter.parse(threeMesh);
    
    // Create and download file
    const blob = new Blob([objContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting OBJ:', error);
  }
}

/**
 * Export Half-Edge Mesh as GLTF file
 */
export function exportAsGLTF(mesh: HalfEdgeMesh, filename: string = 'mesh.gltf'): void {
  try {
    const geometry = halfEdgeToBufferGeometry(mesh);
    const threeMesh = new THREE.Mesh(geometry);
    
    const exporter = new GLTFExporter();
    exporter.parse(threeMesh, (gltf: any) => {
      const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }, (error: any) => {
      console.error('Error exporting GLTF:', error);
    }, { binary: false });
  } catch (error) {
    console.error('Error exporting GLTF:', error);
  }
}

/**
 * Export Half-Edge Mesh as GLB (binary GLTF) file
 */
export function exportAsGLB(mesh: HalfEdgeMesh, filename: string = 'mesh.glb'): void {
  try {
    const geometry = halfEdgeToBufferGeometry(mesh);
    const threeMesh = new THREE.Mesh(geometry);
    
    const exporter = new GLTFExporter();
    exporter.parse(threeMesh, (glb: any) => {
      const blob = new Blob([glb as ArrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }, (error: any) => {
      console.error('Error exporting GLB:', error);
    }, { binary: true });
  } catch (error) {
    console.error('Error exporting GLB:', error);
  }
}

/**
 * Detect file type and load accordingly
 */
export function loadMeshFile(file: File): Promise<HalfEdgeMesh | null> {
  const extension = file.name.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'obj':
      return loadOBJFile(file);
    case 'gltf':
    case 'glb':
      return loadGLTFFile(file);
    default:
      return Promise.reject(new Error(`Unsupported file format: ${extension}`));
  }
}