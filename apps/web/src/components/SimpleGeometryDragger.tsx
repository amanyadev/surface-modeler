import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../store';
import { VertexTransformCommand, FaceTransformCommand } from '@half-edge/kernel';


interface SimpleGeometryDraggerProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
}

export const SimpleGeometryDragger: React.FC<SimpleGeometryDraggerProps> = ({ 
  scene, 
  camera, 
  renderer 
}) => {
  const { 
    selectedVertexId, 
    selectedEdgeId, 
    selectedFaceId, 
    mesh, 
    executeCommand,
    selectionMode 
  } = useAppStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<THREE.Vector3 | null>(null);
  
  // Refs for Three.js objects
  const gizmoGroupRef = useRef<THREE.Group>();
  const gizmoMeshRef = useRef<THREE.Mesh>();
  const dragPlaneRef = useRef<THREE.Plane>();
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // State refs to avoid stale closures
  const isDraggingRef = useRef(false);
  const originalPositionRef = useRef<THREE.Vector3>();

  const currentSelection = selectedVertexId || selectedEdgeId || selectedFaceId;
  
  console.log('🚀 SimpleGeometryDragger render:', { 
    selectionMode, 
    selectedVertexId, 
    selectedEdgeId, 
    selectedFaceId,
    currentSelection,
    mesh: !!mesh 
  });

  // Create or update the geometry gizmo based on selection type
  useEffect(() => {
    console.log('🔧 SimpleGeometryDragger effect - currentSelection:', currentSelection, 'selectionMode:', selectionMode);
    
    if (!currentSelection || !mesh) {
      console.log('❌ No selection or no mesh, removing gizmo');
      // Remove gizmo if nothing is selected
      if (gizmoGroupRef.current) {
        scene.remove(gizmoGroupRef.current);
        gizmoGroupRef.current = undefined;
      }
      return;
    }

    let gizmoPosition: THREE.Vector3 | null = null;
    let gizmoColor = 0xff0000; // Default red
    let gizmoSize = 0.25;

    // Calculate gizmo position and appearance based on selection type
    if (selectionMode === 'vertex' && selectedVertexId) {
      const vertex = mesh.getVertex(selectedVertexId);
      if (vertex) {
        gizmoPosition = new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z);
        gizmoColor = 0xff0000; // Red for vertices
        gizmoSize = 0.25;
        console.log('✅ Found vertex:', selectedVertexId, 'at position:', vertex.pos);
      }
    } else if (selectionMode === 'edge' && selectedEdgeId) {
      // Calculate edge midpoint
      const edge = mesh.getEdge(selectedEdgeId);
      if (edge) {
        const halfEdge = mesh.getHalfEdge(edge.halfEdge);
        if (halfEdge) {
          const targetVertex = mesh.getVertex(halfEdge.vertex);
          const prevHalfEdge = halfEdge.prev ? mesh.getHalfEdge(halfEdge.prev) : null;
          const sourceVertex = prevHalfEdge ? mesh.getVertex(prevHalfEdge.vertex) : null;
          
          if (targetVertex && sourceVertex) {
            gizmoPosition = new THREE.Vector3(
              (sourceVertex.pos.x + targetVertex.pos.x) / 2,
              (sourceVertex.pos.y + targetVertex.pos.y) / 2,
              (sourceVertex.pos.z + targetVertex.pos.z) / 2
            );
            gizmoColor = 0x00ff00; // Green for edges
            gizmoSize = 0.2;
            console.log('✅ Found edge:', selectedEdgeId, 'at midpoint:', gizmoPosition);
          }
        }
      }
    } else if (selectionMode === 'face' && selectedFaceId) {
      // Calculate face center
      const face = mesh.getFace(selectedFaceId);
      if (face) {
        const faceVertices = mesh.getFaceVertices(selectedFaceId);
        if (faceVertices.length > 0) {
          const center = { x: 0, y: 0, z: 0 };
          for (const vertex of faceVertices) {
            center.x += vertex.pos.x;
            center.y += vertex.pos.y;
            center.z += vertex.pos.z;
          }
          center.x /= faceVertices.length;
          center.y /= faceVertices.length;
          center.z /= faceVertices.length;
          
          gizmoPosition = new THREE.Vector3(center.x, center.y, center.z);
          gizmoColor = 0x0066ff; // Blue for faces
          gizmoSize = 0.3;
          console.log('✅ Found face:', selectedFaceId, 'at center:', center);
        }
      }
    }

    if (!gizmoPosition) {
      console.log('❌ Could not calculate gizmo position');
      return;
    }

    // Create or update gizmo group
    if (!gizmoGroupRef.current) {
      gizmoGroupRef.current = new THREE.Group();
      scene.add(gizmoGroupRef.current);
      console.log('🏗️ Created new gizmo group');
    }

    // Clear existing gizmo
    gizmoGroupRef.current.clear();

    // Create user-friendly gizmo shapes
    let geometry: THREE.BufferGeometry;
    
    if (selectionMode === 'vertex') {
      // Vertex: Large sphere with inner core (like a ball bearing)
      geometry = new THREE.SphereGeometry(gizmoSize, 16, 16);
    } else if (selectionMode === 'edge') {
      // Edge: Arrow-like shape pointing along the edge direction
      geometry = new THREE.ConeGeometry(gizmoSize * 0.6, gizmoSize * 1.5, 8);
    } else { // face
      // Face: Diamond/rhombus shape (rotated cube)
      geometry = new THREE.OctahedronGeometry(gizmoSize * 1.2);
    }

    const material = new THREE.MeshBasicMaterial({ 
      color: gizmoColor,
      transparent: false,
      opacity: 1.0,
      depthTest: false, // Always show on top
    });
    
    const gizmoMesh = new THREE.Mesh(geometry, material);
    gizmoMesh.position.copy(gizmoPosition);
    gizmoMesh.userData = { 
      type: 'geometryDragger', 
      selectionType: selectionMode,
      selectionId: currentSelection 
    };
    gizmoMesh.renderOrder = 1000; // High render order to show on top
    
    gizmoMeshRef.current = gizmoMesh;
    gizmoGroupRef.current.add(gizmoMesh);
    console.log(`🎯 Created ${gizmoColor === 0xff0000 ? 'red' : gizmoColor === 0x00ff00 ? 'green' : 'blue'} ${selectionMode} gizmo at:`, gizmoPosition);

    // Add wireframe outline for better visibility
    const wireGeometry = geometry.clone();
    const wireMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true,
      transparent: false,
      opacity: 1.0,
      depthTest: false,
    });
    
    const wireframeMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    wireframeMesh.position.copy(gizmoPosition);
    wireframeMesh.userData = { 
      type: 'geometryDragger', 
      selectionType: selectionMode,
      selectionId: currentSelection 
    };
    wireframeMesh.renderOrder = 999;
    gizmoGroupRef.current.add(wireframeMesh);
    console.log('⚪ Added wireframe outline');

    console.log('🔍 Gizmo group children:', gizmoGroupRef.current.children.map(child => ({
      type: child.type,
      userData: child.userData,
      position: child.position
    })));

  }, [currentSelection, selectionMode, mesh, scene]);

  // Mouse event handlers
  useEffect(() => {
    if (!renderer.domElement) {
      console.log('❌ No renderer DOM element');
      return;
    }

    console.log('🖱️ Setting up mouse event handlers');

    const handleMouseDown = (event: MouseEvent) => {
      console.log('🎯 Gizmo mouse down check');
      
      if (!gizmoGroupRef.current || !camera || !currentSelection || !mesh) {
        console.log('🎯 No gizmo/selection, allowing click-through for selection');
        return; // Allow click-through for selection
      }

      // Calculate mouse position
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Only raycast against gizmo objects
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(gizmoGroupRef.current.children, true);

      console.log('🎯 Gizmo intersects:', intersects.length);

      // Only intercept if we actually hit a gizmo
      if (intersects.length > 0) {
        const intersected = intersects[0];
        console.log('🎯 Hit gizmo:', intersected.object.userData);
        
        if (intersected.object.userData.type === 'geometryDragger') {
          console.log(`✅ Starting ${selectionMode} drag!`);
          
          // Start dragging
          isDraggingRef.current = true;
          setIsDragging(true);
          
          // Store original position
          originalPositionRef.current = intersected.point.clone();
          setDragStartPosition(originalPositionRef.current.clone());
          console.log('💾 Stored original position:', originalPositionRef.current);

          // Create a drag plane perpendicular to camera
          const cameraDirection = new THREE.Vector3();
          camera.getWorldDirection(cameraDirection);
          dragPlaneRef.current = new THREE.Plane();
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(cameraDirection, intersected.point);
          console.log('📐 Created drag plane');
          
          // Prevent event propagation only when we actually start dragging
          event.preventDefault();
          event.stopPropagation();
        }
      } else {
        console.log('🎯 No gizmo hit, allowing click-through for selection');
        // Don't prevent default - allow selection to work
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragPlaneRef.current || !gizmoMeshRef.current) {
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
        // Update gizmo position for visual feedback
        gizmoMeshRef.current.position.copy(intersectionPoint);
        // Also update wireframe if it exists
        if (gizmoGroupRef.current && gizmoGroupRef.current.children[1]) {
          gizmoGroupRef.current.children[1].position.copy(intersectionPoint);
        }
        console.log('🔄 Updated gizmo position:', intersectionPoint);
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) {
        return;
      }

      console.log('🖱️ Mouse up - ending drag');

      if (originalPositionRef.current && gizmoMeshRef.current && currentSelection) {
        const finalPosition = gizmoMeshRef.current.position;
        console.log('📍 Final position:', finalPosition);
        console.log('📍 Original position:', originalPositionRef.current);
        
        // Only execute command if position actually changed
        const threshold = 0.001;
        const moved = originalPositionRef.current.distanceTo(finalPosition) > threshold;
        
        if (moved) {
          console.log(`🚀 Executing ${selectionMode} command`);
          console.log('📋 Command details:', {
            selectionType: selectionMode,
            selectionId: currentSelection,
            oldPos: originalPositionRef.current,
            newPos: finalPosition,
            distance: originalPositionRef.current.distanceTo(finalPosition)
          });
          
          try {
            if (selectionMode === 'vertex' && selectedVertexId) {
              const command = new VertexTransformCommand(selectedVertexId, {
                x: finalPosition.x,
                y: finalPosition.y,
                z: finalPosition.z
              });
              console.log('📦 Created VertexTransformCommand:', command);
              executeCommand(command);
              
            } else if (selectionMode === 'face' && selectedFaceId) {
              // For face movement, calculate the offset
              const offset = finalPosition.clone().sub(originalPositionRef.current);
              const command = new FaceTransformCommand(selectedFaceId, {
                x: offset.x,
                y: offset.y,
                z: offset.z
              });
              console.log('📦 Created FaceTransformCommand:', command);
              executeCommand(command);
              
            } else if (selectionMode === 'edge' && selectedEdgeId) {
              // For edge movement, calculate the offset from the original midpoint
              const offset = finalPosition.clone().sub(originalPositionRef.current);
              
              // Create EdgeTransformCommand manually since import has issues
              const command = {
                type: 'edge_transform',
                edgeId: selectedEdgeId,
                offset: {
                  x: offset.x,
                  y: offset.y,
                  z: offset.z
                },
                do: function(mesh: any) {
                  console.log('🔧 Manual EdgeTransform.do() called');
                  const edge = mesh.getEdge(this.edgeId);
                  if (!edge) return;
                  
                  const halfEdge = mesh.getHalfEdge(edge.halfEdge);
                  if (!halfEdge) return;
                  
                  const targetVertex = mesh.getVertex(halfEdge.vertex);
                  const prevHalfEdge = halfEdge.prev ? mesh.getHalfEdge(halfEdge.prev) : null;
                  const sourceVertex = prevHalfEdge ? mesh.getVertex(prevHalfEdge.vertex) : null;
                  
                  if (targetVertex && sourceVertex) {
                    // Move both vertices by the offset
                    mesh.updateVertex(sourceVertex.id, {
                      x: sourceVertex.pos.x + this.offset.x,
                      y: sourceVertex.pos.y + this.offset.y,
                      z: sourceVertex.pos.z + this.offset.z
                    });
                    
                    mesh.updateVertex(targetVertex.id, {
                      x: targetVertex.pos.x + this.offset.x,
                      y: targetVertex.pos.y + this.offset.y,
                      z: targetVertex.pos.z + this.offset.z
                    });
                    
                    if (mesh.recalculateNormals) {
                      mesh.recalculateNormals();
                    }
                  }
                },
                undo: function() { /* TODO: implement undo */ }
              };
              
              console.log('📦 Created manual EdgeTransformCommand:', command);
              executeCommand(command);
            }
            
            console.log('✅ Command executed successfully');
          } catch (error) {
            console.error('❌ Command execution failed:', error);
          }
        } else {
          console.log('⚠️ Geometry didn\'t move enough, not executing command');
        }
      }
      
      // Reset state
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragStartPosition(null);
      originalPositionRef.current = undefined;
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
  }, [currentSelection, selectionMode, executeCommand, camera, renderer, mesh]);

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
  if (isDragging && dragStartPosition && gizmoMeshRef.current) {
    const currentPos = gizmoMeshRef.current.position;
    const distance = dragStartPosition.distanceTo(currentPos);
    
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        <div>Dragging {selectionMode}: {currentSelection}</div>
        <div>Position: ({currentPos.x.toFixed(2)}, {currentPos.y.toFixed(2)}, {currentPos.z.toFixed(2)})</div>
        <div>Distance: {distance.toFixed(3)}</div>
      </div>
    );
  }

  return null;
};