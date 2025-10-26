import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store';
import { MoveVertexCommand } from '@half-edge/kernel';

interface VertexDragGizmoProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
}

export const VertexDragGizmo: React.FC<VertexDragGizmoProps> = ({ scene, camera, renderer }) => {
  const { selectedVertexId, mesh, executeCommand } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, z: 0 });
  const gizmoRef = useRef<THREE.Group>();
  const sphereRef = useRef<THREE.Mesh>();
  const isDraggingRef = useRef(false);
  const originalPositionRef = useRef<THREE.Vector3>();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const dragPlaneRef = useRef<THREE.Plane>();

  useEffect(() => {
    if (!selectedVertexId || !mesh) {
      // Remove gizmo if no vertex is selected
      if (gizmoRef.current) {
        scene.remove(gizmoRef.current);
        gizmoRef.current = undefined;
      }
      setIsDragging(false);
      return;
    }

    // Get the selected vertex
    const vertex = mesh.getVertex(selectedVertexId);
    if (!vertex) return;

    const position = vertex.pos;

    // Create or update gizmo
    if (!gizmoRef.current) {
      gizmoRef.current = new THREE.Group();
      scene.add(gizmoRef.current);
    }

    // Clear existing gizmo
    gizmoRef.current.clear();

    // Create sphere gizmo at vertex position
    const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600, 
      transparent: true, 
      opacity: 0.8 
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    sphere.position.set(position.x, position.y, position.z);
    sphere.userData = { type: 'vertexDragGizmo' };
    sphereRef.current = sphere;
    gizmoRef.current.add(sphere);

    // Add wireframe outline for better visibility
    const wireframeGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframe.position.set(position.x, position.y, position.z);
    gizmoRef.current.add(wireframe);

  }, [selectedVertexId, mesh, scene]);

  useEffect(() => {
    if (!renderer.domElement) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!gizmoRef.current || !camera || !selectedVertexId || !mesh) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(gizmoRef.current.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0];
        if (intersected.object.userData.type === 'vertexDragGizmo') {
          isDraggingRef.current = true;
          setIsDragging(true);
          
          // Store original vertex position
          const vertex = mesh.getVertex(selectedVertexId);
          if (vertex) {
            originalPositionRef.current = new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z);
          }

          // Create a drag plane perpendicular to camera
          const cameraDirection = new THREE.Vector3();
          camera.getWorldDirection(cameraDirection);
          dragPlaneRef.current = new THREE.Plane();
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(cameraDirection, intersected.point);
          
          // Stop all event propagation to prevent other handlers from interfering
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragPlaneRef.current || !sphereRef.current || !selectedVertexId || !mesh) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      const intersectionPoint = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionPoint)) {
        // Update sphere position for visual feedback
        sphereRef.current.position.copy(intersectionPoint);
        
        // Calculate offset from original position
        if (originalPositionRef.current) {
          const offset = intersectionPoint.clone().sub(originalPositionRef.current);
          setDragOffset({ x: offset.x, y: offset.y, z: offset.z });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && originalPositionRef.current && selectedVertexId && sphereRef.current) {
        // Execute the move vertex command with the final position
        const finalPosition = sphereRef.current.position;
        const command = new MoveVertexCommand(selectedVertexId, {
          x: finalPosition.x,
          y: finalPosition.y,
          z: finalPosition.z
        });
        executeCommand(command);
      }
      
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0, z: 0 });
      originalPositionRef.current = undefined;
      dragPlaneRef.current = undefined;
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
  }, [selectedVertexId, executeCommand, camera, renderer, mesh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gizmoRef.current) {
        scene.remove(gizmoRef.current);
      }
    };
  }, [scene]);

  // Show position feedback during dragging
  if (isDragging && originalPositionRef.current) {
    const newPos = originalPositionRef.current.clone().add(new THREE.Vector3(dragOffset.x, dragOffset.y, dragOffset.z));
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        Position: ({newPos.x.toFixed(2)}, {newPos.y.toFixed(2)}, {newPos.z.toFixed(2)})
      </div>
    );
  }

  return null;
};