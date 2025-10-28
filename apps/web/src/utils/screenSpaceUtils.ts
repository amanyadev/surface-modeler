import * as THREE from 'three';

/**
 * Calculate screen-space scale factor for gizmos to maintain consistent pixel size
 * regardless of camera distance and zoom level.
 */
export function getScreenSpaceScale(
  position: THREE.Vector3,
  camera: THREE.Camera,
  targetPixelSize: number = 8
): number {
  if (camera instanceof THREE.PerspectiveCamera) {
    // For perspective cameras, scale based on distance from camera
    const distance = camera.position.distanceTo(position);
    const fov = camera.fov * Math.PI / 180; // Convert to radians
    const height = 2 * Math.tan(fov / 2) * distance;
    const pixelSize = height / window.innerHeight;
    return (targetPixelSize * pixelSize);
  } else if (camera instanceof THREE.OrthographicCamera) {
    // For orthographic cameras, scale based on zoom level
    const height = (camera.top - camera.bottom) / camera.zoom;
    const pixelSize = height / window.innerHeight;
    return (targetPixelSize * pixelSize);
  }
  
  return 1.0; // Fallback
}

/**
 * Unity ProBuilder-style color schemes for gizmos
 */
export const GizmoColors = {
  vertex: {
    normal: 0x4a90e2,      // Blue
    hover: 0x7fb3ff,       // Light blue
    selected: 0xffa500,    // Orange
  },
  edge: {
    normal: 0x666666,      // Gray
    hover: 0x999999,       // Light gray
    selected: 0xffa500,    // Orange
  },
  face: {
    normal: 0x4a90e2,      // Blue (transparent)
    hover: 0x7fb3ff,       // Light blue (transparent)
    selected: 0xffa500,    // Orange (transparent)
  }
} as const;

/**
 * Create a screen-space vertex gizmo (circle)
 */
export function createVertexGizmo(
  position: THREE.Vector3,
  camera: THREE.Camera,
  state: 'normal' | 'hover' | 'selected' = 'normal',
  pixelSize: number = 8
): THREE.Mesh {
  const scale = getScreenSpaceScale(position, camera, pixelSize);
  
  // Use a simple circle geometry
  const geometry = new THREE.CircleGeometry(scale, 16);
  
  // Create material based on state
  const color = GizmoColors.vertex[state];
  const material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: state === 'selected' ? 1.0 : 0.8,
    depthWrite: false,
    depthTest: true
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  
  // Make the circle always face the camera
  mesh.lookAt(camera.position);
  
  return mesh;
}

/**
 * Create a screen-space edge gizmo (line with consistent thickness)
 */
export function createEdgeGizmo(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  camera: THREE.Camera,
  state: 'normal' | 'hover' | 'selected' = 'normal',
  pixelThickness: number = 2
): THREE.Mesh {
  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const scale = getScreenSpaceScale(midPoint, camera, pixelThickness);
  
  // Create a tube geometry for the edge
  const curve = new THREE.LineCurve3(startPos, endPos);
  const geometry = new THREE.TubeGeometry(curve, 1, scale, 8, false);
  
  // Create material based on state
  const color = GizmoColors.edge[state];
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: state === 'normal' ? 0.6 : (state === 'hover' ? 0.8 : 1.0),
    depthWrite: false,
    depthTest: true
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Create a screen-space face highlight
 */
export function createFaceGizmo(
  vertices: THREE.Vector3[],
  state: 'normal' | 'hover' | 'selected' = 'normal'
): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  
  // Triangulate the face
  const positions: number[] = [];
  for (let i = 1; i < vertices.length - 1; i++) {
    // Fan triangulation
    positions.push(
      vertices[0].x, vertices[0].y, vertices[0].z,
      vertices[i].x, vertices[i].y, vertices[i].z,
      vertices[i + 1].x, vertices[i + 1].y, vertices[i + 1].z
    );
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  
  // Create material based on state
  const color = GizmoColors.face[state];
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: state === 'normal' ? 0.1 : (state === 'hover' ? 0.2 : 0.4),
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Update gizmo scale based on camera changes
 */
export function updateGizmoScale(
  gizmo: THREE.Mesh,
  position: THREE.Vector3,
  camera: THREE.Camera,
  pixelSize: number = 8
): void {
  const scale = getScreenSpaceScale(position, camera, pixelSize);
  
  if (gizmo.geometry instanceof THREE.CircleGeometry) {
    // For vertex gizmos, update the scale
    gizmo.scale.setScalar(scale / gizmo.geometry.parameters.radius);
    // Update orientation to face camera
    gizmo.lookAt(camera.position);
  } else if (gizmo.geometry instanceof THREE.TubeGeometry) {
    // For edge gizmos, we need to recreate the geometry with new radius
    // This is more expensive, so we might want to do this less frequently
    const oldGeometry = gizmo.geometry;
    const curve = (oldGeometry as any).parameters.path;
    const newGeometry = new THREE.TubeGeometry(curve, 1, scale, 8, false);
    gizmo.geometry = newGeometry;
    oldGeometry.dispose();
  }
}