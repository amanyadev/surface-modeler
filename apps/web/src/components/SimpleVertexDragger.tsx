import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store';
import { VertexTransformCommand } from '@half-edge/kernel';

interface SimpleVertexDraggerProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
}

export const SimpleVertexDragger: React.FC<SimpleVertexDraggerProps> = ({ 
  scene, 
  camera, 
  renderer 
}) => {
  const { selectedVertexId, mesh, executeCommand } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<THREE.Vector3 | null>(null);
  
  // Refs for Three.js objects
  const gizmoGroupRef = useRef<THREE.Group>();
  const vertexSphereRef = useRef<THREE.Mesh>();
  const dragPlaneRef = useRef<THREE.Plane>();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // State refs to avoid stale closures
  const isDraggingRef = useRef(false);
  const originalVertexPositionRef = useRef<THREE.Vector3>();

  console.log('🚀 SimpleVertexDragger render:', { selectedVertexId, mesh: !!mesh });

  // Create or update the vertex gizmo
  useEffect(() => {
    console.log('🔧 SimpleVertexDragger effect - selectedVertexId:', selectedVertexId);
    
    if (!selectedVertexId || !mesh) {
      console.log('❌ No vertex selected or no mesh, removing gizmo');
      // Remove gizmo if no vertex is selected
      if (gizmoGroupRef.current) {
        scene.remove(gizmoGroupRef.current);
        gizmoGroupRef.current = undefined;
      }
      return;
    }

    // Get the selected vertex
    const vertex = mesh.getVertex(selectedVertexId);
    if (!vertex) {
      console.log('❌ Vertex not found:', selectedVertexId);
      return;
    }

    console.log('✅ Found vertex:', vertex.id, 'at position:', vertex.pos);

    // Create or update gizmo group
    if (!gizmoGroupRef.current) {
      gizmoGroupRef.current = new THREE.Group();
      scene.add(gizmoGroupRef.current);
      console.log('🏗️ Created new gizmo group');
    }

    // Clear existing gizmo
    gizmoGroupRef.current.clear();

    // Create a bright sphere at the vertex position
    const sphereGeometry = new THREE.SphereGeometry(0.25, 16, 16); // Bigger
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, // Bright red
      transparent: false, // No transparency for better visibility
      opacity: 1.0,
      depthTest: false, // Always show on top
    });
    
    const vertexSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    vertexSphere.position.set(vertex.pos.x, vertex.pos.y, vertex.pos.z);
    vertexSphere.userData = { type: 'vertexDragger', vertexId: selectedVertexId };
    vertexSphere.renderOrder = 1000; // High render order to show on top
    
    vertexSphereRef.current = vertexSphere;
    gizmoGroupRef.current.add(vertexSphere);
    console.log('🔴 Added red sphere to scene at:', vertexSphere.position);

    // Add a wireframe outline for better visibility
    const wireGeometry = new THREE.SphereGeometry(0.28, 16, 16); // Bigger wireframe
    const wireMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true,
      transparent: false,
      opacity: 1.0,
      depthTest: false,
    });
    
    const wireframeSphere = new THREE.Mesh(wireGeometry, wireMaterial);
    wireframeSphere.position.set(vertex.pos.x, vertex.pos.y, vertex.pos.z);
    wireframeSphere.userData = { type: 'vertexDragger', vertexId: selectedVertexId }; // Add userData to wireframe too
    wireframeSphere.renderOrder = 999;
    gizmoGroupRef.current.add(wireframeSphere);
    console.log('⚪ Added white wireframe to scene at:', wireframeSphere.position);

    console.log('🎯 Created vertex gizmo at:', vertex.pos);
    console.log('🔍 Gizmo group children:', gizmoGroupRef.current.children.map(child => ({
      type: child.type,
      userData: child.userData,
      position: child.position
    })));

  }, [selectedVertexId, mesh, scene]);

  // Mouse event handlers
  useEffect(() => {
    if (!renderer.domElement) {
      console.log('❌ No renderer DOM element');
      return;
    }

    console.log('🖱️ Setting up mouse event handlers');

    const handleMouseDown = (event: MouseEvent) => {
      console.log('🖱️ Mouse down');
      
      if (!gizmoGroupRef.current || !camera || !selectedVertexId || !mesh) {
        console.log('❌ Missing refs for mouse down:', {
          gizmo: !!gizmoGroupRef.current,
          camera: !!camera,
          selectedVertexId,
          mesh: !!mesh
        });
        return;
      }

      // Calculate mouse position
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      console.log('🖱️ Mouse position:', mouseRef.current);

      // Raycast to check if we clicked on the gizmo
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(gizmoGroupRef.current.children, true);

      console.log('🎯 Raycast intersects:', intersects.length);

      if (intersects.length > 0) {
        console.log('🎯 All intersects:', intersects.map(i => ({
          object: i.object,
          userData: i.object.userData,
          distance: i.distance
        })));
        
        const intersected = intersects[0];
        console.log('🎯 First intersected object:', intersected.object);
        console.log('🎯 First intersected userData:', intersected.object.userData);
        
        if (intersected.object.userData.type === 'vertexDragger') {
          console.log('✅ Starting vertex drag!');
          
          // Start dragging
          isDraggingRef.current = true;
          setIsDragging(true);
          
          // Store original vertex position
          const vertex = mesh.getVertex(selectedVertexId);
          if (vertex) {
            originalVertexPositionRef.current = new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z);
            setDragStartPosition(originalVertexPositionRef.current.clone());
            console.log('💾 Stored original position:', originalVertexPositionRef.current);
          }

          // Create a drag plane perpendicular to camera
          const cameraDirection = new THREE.Vector3();
          camera.getWorldDirection(cameraDirection);
          dragPlaneRef.current = new THREE.Plane();
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(cameraDirection, intersected.point);
          console.log('📐 Created drag plane');
          
          // Prevent event propagation
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragPlaneRef.current || !vertexSphereRef.current) {
        return;
      }

      console.log('🖱️ Mouse move during drag');

      // Update mouse position
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast to drag plane
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      const intersectionPoint = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectionPoint)) {
        // Update sphere position for visual feedback
        vertexSphereRef.current.position.copy(intersectionPoint);
        console.log('🔄 Updated sphere position:', intersectionPoint);
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) {
        return;
      }

      console.log('🖱️ Mouse up - ending drag');

      if (originalVertexPositionRef.current && vertexSphereRef.current && selectedVertexId) {
        const finalPosition = vertexSphereRef.current.position;
        console.log('📍 Final position:', finalPosition);
        console.log('📍 Original position:', originalVertexPositionRef.current);
        
        // Only execute command if position actually changed
        const threshold = 0.001;
        const moved = originalVertexPositionRef.current.distanceTo(finalPosition) > threshold;
        
        if (moved) {
          console.log('🚀 Executing VertexTransformCommand');
          console.log('📋 Command details:', {
            vertexId: selectedVertexId,
            oldPos: originalVertexPositionRef.current,
            newPos: finalPosition,
            distance: originalVertexPositionRef.current.distanceTo(finalPosition)
          });
          
          const command = new VertexTransformCommand(selectedVertexId, {
            x: finalPosition.x,
            y: finalPosition.y,
            z: finalPosition.z
          });
          
          console.log('📦 Created command:', command);
          console.log('🎯 Calling executeCommand...');
          
          try {
            executeCommand(command);
            console.log('✅ Command executed successfully');
          } catch (error) {
            console.error('❌ Command execution failed:', error);
          }
        } else {
          console.log('⚠️ Vertex didn\'t move enough, not executing command');
        }
      }
      
      // Reset state
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragStartPosition(null);
      originalVertexPositionRef.current = undefined;
      dragPlaneRef.current = undefined;
      
      console.log('🔄 Reset drag state');
    };

    // Add event listeners
    const element = renderer.domElement;
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    console.log('✅ Added mouse event listeners');

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      console.log('🧹 Removed mouse event listeners');
    };
  }, [selectedVertexId, executeCommand, camera, renderer, mesh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gizmoGroupRef.current) {
        scene.remove(gizmoGroupRef.current);
        console.log('🧹 Cleaned up gizmo on unmount');
      }
    };
  }, [scene]);

  // Show drag feedback
  if (isDragging && dragStartPosition && vertexSphereRef.current) {
    const currentPos = vertexSphereRef.current.position;
    const distance = dragStartPosition.distanceTo(currentPos);
    
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        <div>Dragging Vertex: {selectedVertexId}</div>
        <div>Position: ({currentPos.x.toFixed(2)}, {currentPos.y.toFixed(2)}, {currentPos.z.toFixed(2)})</div>
        <div>Distance: {distance.toFixed(3)}</div>
      </div>
    );
  }

  return null;
};