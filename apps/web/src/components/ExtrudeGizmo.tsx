import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store';
import { ExtrudeCommand } from '@half-edge/kernel';

interface ExtrudeGizmoProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  orbitControls?: any; // OrbitControls instance
  transformControls?: any; // TransformControls instance
}

export const ExtrudeGizmo: React.FC<ExtrudeGizmoProps> = ({ scene, camera, renderer, orbitControls, transformControls }) => {
  const { selectedFaceId, mesh, executeCommand } = useAppStore();
  const [isExtruding, setIsExtruding] = useState(false);
  const [extrudeDistance, setExtrudeDistance] = useState(0);
  const gizmoRef = useRef<THREE.Group>();
  const arrowRef = useRef<THREE.ArrowHelper>();
  const isDraggingRef = useRef(false);
  const startPositionRef = useRef<THREE.Vector3>();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    if (!selectedFaceId || !mesh) {
      // Remove gizmo if no face is selected
      if (gizmoRef.current) {
        scene.remove(gizmoRef.current);
        gizmoRef.current = undefined;
      }
      setIsExtruding(false);
      return;
    }

    // Get the selected face
    const face = mesh.getFace(selectedFaceId);
    if (!face) return;

    // Calculate face center and normal
    const faceVertices = mesh.getFaceVertices(selectedFaceId);
    if (faceVertices.length === 0) return;

    const center = { x: 0, y: 0, z: 0 };
    for (const vertex of faceVertices) {
      center.x += vertex.pos.x;
      center.y += vertex.pos.y;
      center.z += vertex.pos.z;
    }
    center.x /= faceVertices.length;
    center.y /= faceVertices.length;
    center.z /= faceVertices.length;

    const normal = face.normal || { x: 0, y: 1, z: 0 };

    // Create or update gizmo
    if (!gizmoRef.current) {
      gizmoRef.current = new THREE.Group();
      scene.add(gizmoRef.current);
    }

    // Clear existing gizmo
    gizmoRef.current.clear();

    // Create arrow gizmo
    const direction = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
    const origin = new THREE.Vector3(center.x, center.y, center.z);
    const length = 1.0;
    const color = 0x00ff00; // Green
    const headLength = 0.2;
    const headWidth = 0.1;

    const arrow = new THREE.ArrowHelper(direction, origin, length, color, headLength, headWidth);
    arrowRef.current = arrow;
    gizmoRef.current.add(arrow);

    // Add invisible collision mesh for easier clicking
    const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.3 
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    
    // Position and orient the cylinder along the arrow
    cylinder.position.copy(origin).add(direction.clone().multiplyScalar(length / 2));
    cylinder.lookAt(origin.clone().add(direction));
    cylinder.rotateX(Math.PI / 2);
    cylinder.userData = { type: 'extrudeGizmo' };
    
    gizmoRef.current.add(cylinder);

  }, [selectedFaceId, mesh, scene]);

  useEffect(() => {
    if (!renderer.domElement) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!gizmoRef.current || !camera) return;
      
      // Check if transform controls are currently being used
      if (transformControls && transformControls.dragging) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(gizmoRef.current.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0];
        if (intersected.object.userData.type === 'extrudeGizmo') {
          isDraggingRef.current = true;
          setIsExtruding(true);
          startPositionRef.current = intersected.point;
          
          // Disable orbit controls while extruding
          if (orbitControls) {
            orbitControls.enabled = false;
          }
          
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !startPositionRef.current || !arrowRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Create a plane perpendicular to the camera for consistent dragging
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const plane = new THREE.Plane(cameraDirection, 0);
      plane.setFromNormalAndCoplanarPoint(cameraDirection, startPositionRef.current);

      const currentPoint = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(plane, currentPoint)) {
        // Calculate distance along the extrude direction
        const arrow = arrowRef.current;
        const arrowDirection = new THREE.Vector3();
        arrow.getWorldDirection(arrowDirection);
        
        const startToMouse = currentPoint.clone().sub(startPositionRef.current);
        const distance = startToMouse.dot(arrowDirection);
        
        setExtrudeDistance(Math.max(0, distance));
        
        // Update arrow length to show preview
        const newLength = 1.0 + Math.max(0, distance);
        arrow.setLength(newLength, newLength * 0.2, newLength * 0.1);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && extrudeDistance > 0) {
        // Execute the extrude command
        if (selectedFaceId) {
          const command = new ExtrudeCommand(selectedFaceId, extrudeDistance);
          executeCommand(command);
        }
      }
      
      isDraggingRef.current = false;
      setIsExtruding(false);
      setExtrudeDistance(0);
      
      // Re-enable orbit controls
      if (orbitControls) {
        orbitControls.enabled = true;
      }
      
      // Reset arrow length
      if (arrowRef.current) {
        arrowRef.current.setLength(1.0, 0.2, 0.1);
      }
    };

    const element = renderer.domElement;
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedFaceId, extrudeDistance, executeCommand, camera, renderer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gizmoRef.current) {
        scene.remove(gizmoRef.current);
      }
    };
  }, [scene]);

  // Show distance feedback during extrusion
  if (isExtruding && extrudeDistance > 0) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        Extrude Distance: {extrudeDistance.toFixed(2)}
      </div>
    );
  }

  return null;
};