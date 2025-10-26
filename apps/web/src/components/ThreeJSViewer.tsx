import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { 
  HalfEdgeMesh, 
  CreateQuadCommand, 
  CreateCircleCommand 
} from '@half-edge/kernel';
import { useAppStore } from '../store';
import { HalfEdgeVisualization } from './HalfEdgeVisualization';
// import { VertexDragGizmo } from './VertexDragGizmo';
// import { SimpleVertexDragger } from './SimpleVertexDragger';
import { SimpleGeometryDragger } from './SimpleGeometryDragger';

interface ThreeJSViewerProps {
  width: number;
  height: number;
}

export const ThreeJSViewer: React.FC<ThreeJSViewerProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>();
  const meshObjectRef = useRef<THREE.Group>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();
  const orbitControlsRef = useRef<OrbitControls>();
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  
  
  const { 
    mesh, 
    viewMode, 
    cameraMode, 
    controlMode,
    selectionMode,
    selectedFaceId, 
    selectedFaceIds,
    selectedVertexId,
    selectedEdgeId,
    selectedMeshId,
    drawMode,
    sketchVertices,
    addSketchVertex,
    createVertexAt,
    updateCounter,
    setSelectedFaceId,
    setSelectedVertexId,
    setSelectedEdgeId,
    setSelectedMeshId,
    toggleFaceSelection,
    executeCommand
  } = useAppStore();

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f2937); // Dark background to match theme
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Setup cameras with better positioning
    const perspectiveCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const orthographicCamera = new THREE.OrthographicCamera(
      -5, 5, 5, -5, 0.1, 1000
    );
    
    perspectiveCamera.position.set(5, 5, 5);
    perspectiveCamera.lookAt(0, 0, 0);
    
    orthographicCamera.position.set(5, 5, 5);
    orthographicCamera.lookAt(0, 0, 0);
    
    cameraRef.current = cameraMode === 'perspective' ? perspectiveCamera : orthographicCamera;

    // Create simple manual camera controls instead of OrbitControls
    const cameraControls = {
      isRotating: false,
      isPanning: false,
      lastMouse: { x: 0, y: 0 },
      spherical: new THREE.Spherical(),
      panOffset: new THREE.Vector3(),
      target: new THREE.Vector3(0, 0, 0)
    };
    
    // Initialize spherical coordinates from current camera position
    const offset = new THREE.Vector3().subVectors(cameraRef.current.position, cameraControls.target);
    cameraControls.spherical.setFromVector3(offset);
    
    orbitControlsRef.current = cameraControls as any; // Store for reference

    // Transform controls - DISABLED for debugging, using SimpleVertexDragger instead
    /*
    const transformControls = new TransformControls(cameraRef.current, canvasRef.current);
    transformControls.setMode('translate');
    transformControls.setSize(1);
    transformControls.setSpace('world');
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    // Disable orbit controls when transform controls are being used
    transformControls.addEventListener('dragging-changed', (event: any) => {
      orbitControls.enabled = !event.value;
    });
    */

    // Add better lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Key light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0x4477ff, 0.2);
    rimLight.position.set(-2, -2, 8);
    scene.add(rimLight);

    // Setup raycaster for picking
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Create mesh group
    meshObjectRef.current = new THREE.Group();
    scene.add(meshObjectRef.current);

    return () => {
      // No cleanup needed for custom camera controls
      // Transform controls cleanup disabled
      /*
      if (transformControlsRef.current) {
        scene.remove(transformControlsRef.current);
        transformControlsRef.current.dispose();
      }
      */
      renderer.dispose();
    };
  }, [width, height, cameraMode]);

  // Handle camera mode changes
  useEffect(() => {
    if (!cameraRef.current) return;
    
    const perspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const orthographicCamera = new THREE.OrthographicCamera(
      -5, 5, 5, -5, 0.1, 1000
    );
    
    if (cameraMode === 'perspective') {
      perspectiveCamera.position.set(5, 5, 5);
      perspectiveCamera.lookAt(0, 0, 0);
      cameraRef.current = perspectiveCamera;
    } else {
      if (viewMode === '2d') {
        orthographicCamera.position.set(0, 10, 0);
        orthographicCamera.lookAt(0, 0, 0);
      }
      cameraRef.current = orthographicCamera;
    }
  }, [cameraMode, viewMode, width, height]);

  // Transform controls code - DISABLED for debugging
  /*
  // Handle transform mode changes
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Handle selection changes for transform controls
  useEffect(() => {
    console.log('🎯 Selection changed:', { selectedVertexId, selectedEdgeId, selectedFaceId, selectedMeshId });
    console.log('🎯 selectedObjectRef.current:', selectedObjectRef.current);
    console.log('🎯 transformControlsRef.current:', transformControlsRef.current);
    
    if (!transformControlsRef.current) {
      console.log('❌ No transform controls ref');
      return;
    }

    const hasSelection = selectedVertexId || selectedEdgeId || selectedFaceId || selectedMeshId;
    console.log('🎯 Has selection:', hasSelection);
    
    if (hasSelection && selectedObjectRef.current) {
      console.log('✅ Attaching transform controls to:', selectedObjectRef.current);
      transformControlsRef.current.attach(selectedObjectRef.current);
      transformControlsRef.current.visible = true;
      (transformControlsRef.current as any).enabled = true;
    } else {
      console.log('❌ Detaching transform controls');
      transformControlsRef.current.detach();
      transformControlsRef.current.visible = false;
      (transformControlsRef.current as any).enabled = false;
    }
  }, [selectedVertexId, selectedEdgeId, selectedFaceId, selectedMeshId]);

  // Handle transform control changes
  useEffect(() => {
    if (!transformControlsRef.current) return;

    let isTransforming = false;
    let originalPosition: THREE.Vector3 | null = null;

    const handleDraggingChanged = (event: any) => {
      console.log('🔄 Transform dragging changed:', event.value);
      
      if (event.value) {
        // Start dragging - store original position
        console.log('🟢 Start dragging');
        isTransforming = true;
        if (selectedObjectRef.current) {
          originalPosition = selectedObjectRef.current.position.clone();
          console.log('💾 Stored original position:', originalPosition);
        }
      } else {
        // End dragging - execute command with final position
        console.log('🔴 End dragging');
        isTransforming = false;
        if (selectedVertexId && selectedObjectRef.current && mesh && originalPosition) {
          const newPosition = selectedObjectRef.current.position;
          console.log('📍 Final position:', newPosition);
          console.log('📍 Original position:', originalPosition);
          
          const command = new VertexTransformCommand(selectedVertexId, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z
          });
          console.log('🚀 Executing VertexTransformCommand:', command);
          executeCommand(command);
        } else if (selectedFaceId && selectedObjectRef.current && mesh) {
          const position = selectedObjectRef.current.position;
          console.log('📍 Face position offset:', position);
          const offset = {
            x: position.x,
            y: position.y, 
            z: position.z
          };
          const command = new FaceTransformCommand(selectedFaceId, offset);
          console.log('🚀 Executing FaceTransformCommand:', command);
          executeCommand(command);
          // Reset position to avoid double transformation
          selectedObjectRef.current.position.set(0, 0, 0);
        } else {
          console.log('❌ Cannot execute command:', {
            selectedVertexId,
            selectedFaceId,
            selectedObjectRef: selectedObjectRef.current,
            mesh,
            originalPosition
          });
        }
        originalPosition = null;
      }
    };

    transformControlsRef.current.addEventListener('dragging-changed', handleDraggingChanged);
    
    return () => {
      if (transformControlsRef.current) {
        transformControlsRef.current.removeEventListener('dragging-changed', handleDraggingChanged);
      }
    };
  }, [selectedVertexId, selectedFaceId, mesh, executeCommand]);
  */

  // Camera control event handlers
  useEffect(() => {
    const handleResetCamera = () => {
      if (!cameraRef.current || !orbitControlsRef.current) return;
      
      // Reset camera position based on mode
      if (cameraMode === 'perspective') {
        cameraRef.current.position.set(8, 6, 8);
        cameraRef.current.lookAt(0, 0, 0);
      } else {
        cameraRef.current.position.set(0, 10, 0);
        cameraRef.current.lookAt(0, 0, 0);
      }
      // Reset camera to initial position
      if (orbitControlsRef.current && cameraRef.current) {
        const controls = orbitControlsRef.current;
        controls.target.set(0, 0, 0);
        // Reset to initial camera position based on mode
        if (cameraMode === 'perspective') {
          cameraRef.current.position.set(5, 5, 5);
        } else {
          cameraRef.current.position.set(5, 5, 5);
        }
        cameraRef.current.lookAt(0, 0, 0);
        // Update spherical coordinates
        const offset = new THREE.Vector3().subVectors(cameraRef.current.position, controls.target);
        controls.spherical.setFromVector3(offset);
      }
    };

    const handleFitCamera = () => {
      if (!meshObjectRef.current || !cameraRef.current || !orbitControlsRef.current) return;
      
      // Calculate bounding box of all mesh objects
      const box = new THREE.Box3().setFromObject(meshObjectRef.current);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Position camera to fit the object
      const distance = maxDim * 2.5;
      if (cameraMode === 'perspective') {
        const direction = cameraRef.current.position.clone().sub(center).normalize();
        cameraRef.current.position.copy(center).add(direction.multiplyScalar(distance));
      }
      
      // Update camera target for fit operation
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(center);
        // Update spherical coordinates relative to new target
        const offset = new THREE.Vector3().subVectors(cameraRef.current.position, center);
        orbitControlsRef.current.spherical.setFromVector3(offset);
      }
    };

    const handleToggleWireframe = () => {
      if (!meshObjectRef.current) return;
      
      meshObjectRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.Material & { wireframe?: boolean };
          if ('wireframe' in material) {
            material.wireframe = !material.wireframe;
          }
        }
      });
    };

    const handlePresetCamera = (preset: string) => {
      if (!cameraRef.current || !orbitControlsRef.current) return;
      
      const distance = 10;
      let position = { x: 0, y: 0, z: 0 };
      
      switch (preset) {
        case 'front':
          position = { x: 0, y: 0, z: distance };
          break;
        case 'back':
          position = { x: 0, y: 0, z: -distance };
          break;
        case 'left':
          position = { x: -distance, y: 0, z: 0 };
          break;
        case 'right':
          position = { x: distance, y: 0, z: 0 };
          break;
        case 'top':
          position = { x: 0, y: distance, z: 0 };
          break;
        case 'bottom':
          position = { x: 0, y: -distance, z: 0 };
          break;
        case 'iso':
          position = { x: distance * 0.7, y: distance * 0.7, z: distance * 0.7 };
          break;
      }
      
      cameraRef.current.position.set(position.x, position.y, position.z);
      cameraRef.current.lookAt(0, 0, 0);
      // Update camera target for preset operation
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.set(0, 0, 0);
        // Update spherical coordinates for new position
        const offset = new THREE.Vector3().subVectors(cameraRef.current.position, orbitControlsRef.current.target);
        orbitControlsRef.current.spherical.setFromVector3(offset);
      }
    };

    // Keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return; // Don't trigger if typing in input
      
      switch (event.key.toLowerCase()) {
        case 'r':
          handleResetCamera();
          break;
        case 'f':
          handleFitCamera();
          break;
        case 'w':
          handleToggleWireframe();
          break;
      }
    };

    // Preset camera event handler
    const handlePresetCameraEvent = (event: CustomEvent) => {
      handlePresetCamera(event.detail);
    };

    // Add event listeners
    window.addEventListener('resetCamera', handleResetCamera);
    window.addEventListener('fitCamera', handleFitCamera);
    window.addEventListener('toggleWireframe', handleToggleWireframe);
    window.addEventListener('presetCamera', handlePresetCameraEvent as EventListener);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('resetCamera', handleResetCamera);
      window.removeEventListener('fitCamera', handleFitCamera);
      window.removeEventListener('toggleWireframe', handleToggleWireframe);
      window.removeEventListener('presetCamera', handlePresetCameraEvent as EventListener);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [cameraMode]);

  // Manual camera controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current) return;
    
    const cameraControls = orbitControlsRef.current;
    if (!cameraControls) return;
    
    const handleMouseDown = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+drag for rotation
        cameraControls.isRotating = true;
        cameraControls.lastMouse.x = event.clientX;
        cameraControls.lastMouse.y = event.clientY;
        event.preventDefault();
        console.log('🎮 Starting rotation');
      } else if (event.button === 2) {
        // Right-click for panning
        cameraControls.isPanning = true;
        cameraControls.lastMouse.x = event.clientX;
        cameraControls.lastMouse.y = event.clientY;
        event.preventDefault();
        console.log('🎮 Starting pan');
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!cameraRef.current) return;
      
      if (cameraControls.isRotating) {
        const deltaX = event.clientX - cameraControls.lastMouse.x;
        const deltaY = event.clientY - cameraControls.lastMouse.y;
        
        // Update spherical coordinates
        cameraControls.spherical.theta -= deltaX * 0.01;
        cameraControls.spherical.phi += deltaY * 0.01;
        
        // Clamp phi to prevent gimbal lock
        cameraControls.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, cameraControls.spherical.phi));
        
        // Update camera position
        const offset = new THREE.Vector3().setFromSpherical(cameraControls.spherical);
        cameraRef.current.position.copy(cameraControls.target).add(offset);
        cameraRef.current.lookAt(cameraControls.target);
        
        cameraControls.lastMouse.x = event.clientX;
        cameraControls.lastMouse.y = event.clientY;
        
        console.log('🎮 Rotating camera');
      } else if (cameraControls.isPanning) {
        const deltaX = event.clientX - cameraControls.lastMouse.x;
        const deltaY = event.clientY - cameraControls.lastMouse.y;
        
        // Pan in screen space
        const panSpeed = 0.005;
        const camera = cameraRef.current;
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        
        const panOffset = new THREE.Vector3()
          .addScaledVector(right, -deltaX * panSpeed)
          .addScaledVector(up, deltaY * panSpeed);
          
        camera.position.add(panOffset);
        cameraControls.target.add(panOffset);
        
        cameraControls.lastMouse.x = event.clientX;
        cameraControls.lastMouse.y = event.clientY;
        
        console.log('🎮 Panning camera');
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      if (cameraControls.isRotating) {
        cameraControls.isRotating = false;
        console.log('🎮 Stopped rotation');
      }
      if (cameraControls.isPanning) {
        cameraControls.isPanning = false;
        console.log('🎮 Stopped pan');
      }
    };
    
    const handleWheel = (event: WheelEvent) => {
      if (!cameraRef.current) return;
      
      const zoomSpeed = 0.1;
      const direction = new THREE.Vector3()
        .subVectors(cameraControls.target, cameraRef.current.position)
        .normalize();
        
      const distance = cameraRef.current.position.distanceTo(cameraControls.target);
      const zoomDelta = event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
      const newDistance = Math.max(0.1, Math.min(100, distance + zoomDelta));
      
      cameraRef.current.position.copy(cameraControls.target).add(direction.multiplyScalar(-newDistance));
      
      // Update spherical coordinates
      const offset = new THREE.Vector3().subVectors(cameraRef.current.position, cameraControls.target);
      cameraControls.spherical.setFromVector3(offset);
      
      event.preventDefault();
      console.log('🎮 Zooming camera');
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable context menu
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, []);

  // Convert kernel mesh to Three.js geometry
  const meshToThreeJS = (kernelMesh: HalfEdgeMesh): THREE.Group => {
    const group = new THREE.Group();
    
    if (!kernelMesh || typeof kernelMesh.faces !== 'function') {
      console.error('Invalid mesh object passed to meshToThreeJS');
      return group;
    }
    
    // Add faces
    const faces = kernelMesh.faces();
    faces.forEach((face, index) => {
      const faceVertices = kernelMesh.getFaceVertices(face.id);
      
      if (faceVertices.length >= 3) {
        const geometry = new THREE.BufferGeometry();
        
        // Create vertices for triangulation
        const positions: number[] = [];
        const normals: number[] = [];
        
        // Simple fan triangulation for convex faces
        for (let i = 1; i < faceVertices.length - 1; i++) {
          // Triangle: 0, i, i+1
          positions.push(
            faceVertices[0].pos.x, faceVertices[0].pos.y, faceVertices[0].pos.z,
            faceVertices[i].pos.x, faceVertices[i].pos.y, faceVertices[i].pos.z,
            faceVertices[i + 1].pos.x, faceVertices[i + 1].pos.y, faceVertices[i + 1].pos.z
          );
          
          // Use face normal for all vertices
          const normal = face.normal || { x: 0, y: 1, z: 0 };
          for (let j = 0; j < 3; j++) {
            normals.push(normal.x, normal.y, normal.z);
          }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        
        const isSelected = selectedFaceId === face.id || selectedFaceIds.includes(face.id);
        
        // Enhanced materials with better selection feedback
        let baseColor = 0xb0b8c4; // Slightly lighter gray for better visibility
        let opacity = 0.85;
        let emissive = 0x000000;
        
        if (isSelected) {
          baseColor = 0x3b82f6; // Bright blue for selection (more professional than red)
          opacity = 1.0;
          emissive = 0x1e40af; // Slight blue glow
        }
        
        const material = new THREE.MeshLambertMaterial({
          color: baseColor,
          emissive: emissive,
          side: THREE.DoubleSide,
          transparent: opacity < 1,
          opacity: opacity,
        });
        
        const faceMesh = new THREE.Mesh(geometry, material);
        faceMesh.userData = { 
          type: 'face', 
          faceId: face.id, 
          faceIndex: index,
          meshId: kernelMesh.id || 'default-mesh'
        };
        faceMesh.castShadow = true;
        faceMesh.receiveShadow = true;
        
        // Add wireframe edges for better visibility
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffffff : 0x374151,
          linewidth: isSelected ? 2 : 1,
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.userData = faceMesh.userData; // Same user data for selection
        
        // Store reference if selected or if in mesh mode and mesh is selected
        if (isSelected || (selectionMode === 'mesh' && selectedMeshId)) {
          selectedObjectRef.current = faceMesh;
        }
        
        group.add(faceMesh);
        group.add(wireframe);
      }
    });

    // Add vertices
    const vertices = kernelMesh.vertices();
    vertices.forEach((vertex, index) => {
      const isSelected = selectedVertexId === vertex.id;
      const isInSketch = sketchVertices.includes(vertex.id);
      
      // Enhanced vertex visualization based on state
      let geometry, material;
      
      if (isSelected) {
        // Larger, more prominent vertex when selected
        geometry = new THREE.SphereGeometry(0.15, 16, 12);
        material = new THREE.MeshStandardMaterial({
          color: 0xf59e0b, // Amber/orange for selected vertices
          emissive: 0xd97706,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 0.1,
        });
      } else if (isInSketch) {
        geometry = new THREE.SphereGeometry(0.1, 12, 8);
        material = new THREE.MeshLambertMaterial({
          color: 0x06b6d4, // Cyan for sketch vertices
        });
      } else {
        geometry = new THREE.SphereGeometry(0.08, 12, 8);
        material = new THREE.MeshLambertMaterial({
          color: 0x6b7280, // Better gray color
        });
      }
      
      const vertexMesh = new THREE.Mesh(geometry, material);
      vertexMesh.position.set(vertex.pos.x, vertex.pos.y, vertex.pos.z);
      vertexMesh.userData = { 
        type: 'vertex', 
        vertexId: vertex.id, 
        vertexIndex: index,
        meshId: kernelMesh.id || 'default-mesh'
      };
      vertexMesh.castShadow = true;
      
      // selectedObjectRef assignment disabled - using SimpleVertexDragger instead
      /*
      if (isSelected) {
        console.log('🎯 Setting selectedObjectRef to vertex:', vertex.id, vertexMesh);
        selectedObjectRef.current = vertexMesh;
      }
      */
      
      // Enhanced visibility logic
      const shouldShow = selectionMode === 'vertex' || isSelected || drawMode === 'sketch' || drawMode === 'vertex';
      vertexMesh.visible = shouldShow;
      
      // Add highlight ring for better visibility when in vertex mode
      if (selectionMode === 'vertex' && !isSelected) {
        const ringGeometry = new THREE.RingGeometry(0.12, 0.15, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(vertexMesh.position);
        if (cameraRef.current) {
          ring.lookAt(cameraRef.current.position);
        }
        ring.userData = vertexMesh.userData;
        ring.visible = shouldShow;
        group.add(ring);
      }
      
      group.add(vertexMesh);
    });

    // Add edges
    const edges = kernelMesh.edges();
    edges.forEach((edge, index) => {
      const halfEdge = kernelMesh.getHalfEdge(edge.halfEdge);
      if (!halfEdge) return;

      // Get source vertex (previous half-edge's target)
      const targetVertex = kernelMesh.getVertex(halfEdge.vertex);
      const prevHalfEdge = halfEdge.prev ? kernelMesh.getHalfEdge(halfEdge.prev) : null;
      const sourceVertex = prevHalfEdge ? kernelMesh.getVertex(prevHalfEdge.vertex) : null;

      if (targetVertex && sourceVertex) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
          sourceVertex.pos.x, sourceVertex.pos.y, sourceVertex.pos.z,
          targetVertex.pos.x, targetVertex.pos.y, targetVertex.pos.z,
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const isSelected = selectedEdgeId === edge.id;
        
        // Create edge visualization based on selection state
        const shouldShowEdges = selectionMode === 'edge';
        
        if (isSelected && shouldShowEdges) {
          // Create thick edge for selected
          const tubeGeometry = new THREE.TubeGeometry(
            new THREE.LineCurve3(
              new THREE.Vector3(sourceVertex.pos.x, sourceVertex.pos.y, sourceVertex.pos.z),
              new THREE.Vector3(targetVertex.pos.x, targetVertex.pos.y, targetVertex.pos.z)
            ),
            1,
            0.02,
            8,
            false
          );
          const material = new THREE.MeshStandardMaterial({
            color: 0x10b981, // Emerald green for selected edges
            emissive: 0x065f46,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.1,
          });
          const edgeMesh = new THREE.Mesh(tubeGeometry, material);
          edgeMesh.userData = { type: 'edge', edgeId: edge.id, edgeIndex: index };
          edgeMesh.castShadow = true;
          edgeMesh.visible = true;
          
          // Store reference if selected
          selectedObjectRef.current = edgeMesh;
          group.add(edgeMesh);
        } else if (shouldShowEdges) {
          // Regular thin line edge - only when in edge mode
          const material = new THREE.LineBasicMaterial({
            color: 0x64748b, // Slate gray, more visible
            linewidth: 2, // Thicker lines for better visibility
          });
          
          const edgeMesh = new THREE.Line(geometry, material);
          edgeMesh.userData = { type: 'edge', edgeId: edge.id, edgeIndex: index };
          edgeMesh.visible = true;
          group.add(edgeMesh);
        }
        // Don't add edges to the scene when not in edge mode to prevent invisible selection
      }
    });
    
    return group;
  };

  // Update mesh visualization
  useEffect(() => {
    if (!meshObjectRef.current || !mesh) return;

    // Clear previous mesh
    meshObjectRef.current.clear();
    
    // Add new mesh
    const threeJSMesh = meshToThreeJS(mesh);
    meshObjectRef.current.add(threeJSMesh);
  }, [mesh, selectedFaceId, selectedFaceIds, selectedVertexId, selectedEdgeId, selectedMeshId, selectionMode, drawMode, sketchVertices, updateCounter]);

  // Handle mouse clicks for selection
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current || !raycasterRef.current || !mouseRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('🖱️ Click at screen:', { x: event.clientX - rect.left, y: event.clientY - rect.top });
    console.log('🖱️ Normalized mouse:', mouseRef.current);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Only intersect with mesh objects, not gizmos or other UI elements
    const meshObjects = meshObjectRef.current ? [meshObjectRef.current] : [];
    const intersects = raycasterRef.current.intersectObjects(meshObjects, true);
    
    console.log('🎯 Intersects found:', intersects.length);
    console.log('🎯 All intersects:', intersects.map(i => ({
      object: i.object.type,
      userData: i.object.userData,
      distance: i.distance.toFixed(3)
    })));
    
    // Filter intersects by selection mode and find the closest valid one
    let validIntersect = null;
    for (const intersect of intersects) {
      const userData = intersect.object.userData;
      
      // Check if this intersect is valid for current selection mode
      const isValidIntersect = 
        (selectionMode === 'vertex' && userData.vertexId) ||
        (selectionMode === 'edge' && userData.edgeId) ||
        (selectionMode === 'face' && userData.faceId) ||
        (selectionMode === 'mesh' && (userData.meshId || mesh));
      
      if (isValidIntersect) {
        validIntersect = intersect;
        break; // Take the first (closest) valid intersect
      }
    }
    
    console.log('🎯 Valid intersect:', validIntersect ? {
      type: selectionMode,
      userData: validIntersect.object.userData,
      distance: validIntersect.distance.toFixed(3)
    } : null);
    
    // If no valid intersect found, clear selection
    if (!validIntersect) {
      console.log('🎯 No valid intersect - clearing selection');
      setSelectedVertexId(null);
      setSelectedEdgeId(null);
      setSelectedFaceId(null);
      setSelectedMeshId(null);
      return;
    }
    
    // Process the valid intersect
    for (const intersect of [validIntersect]) {
      const userData = intersect.object.userData;
      
      // Handle draw modes first
      if (drawMode === 'sketch' && userData.vertexId) {
        addSketchVertex(userData.vertexId);
        return;
      }

      // Handle shape drawing modes
      if (drawMode === 'vertex' || drawMode === 'quad' || drawMode === 'circle') {
        // Cast a ray to find intersection with a ground plane
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        
        // Create a ground plane for intersection
        const planeGeometry = new THREE.PlaneGeometry(100, 100);
        const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial());
        plane.rotation.x = -Math.PI / 2; // Horizontal plane
        
        const intersects = raycasterRef.current.intersectObject(plane);
        let point: THREE.Vector3;
        
        if (intersects.length > 0) {
          point = intersects[0].point;
        } else {
          // Fallback: create at a default distance from camera
          const direction = new THREE.Vector3();
          raycasterRef.current.ray.direction.normalize();
          direction.copy(raycasterRef.current.ray.direction).multiplyScalar(5);
          point = raycasterRef.current.ray.origin.clone().add(direction);
        }

        if (drawMode === 'vertex') {
          createVertexAt({ x: point.x, y: point.y, z: point.z });
        } else if (drawMode === 'quad') {
          const command = new CreateQuadCommand({ x: point.x, y: point.y, z: point.z }, 1);
          executeCommand(command);
        } else if (drawMode === 'circle') {
          const command = new CreateCircleCommand({ x: point.x, y: point.y, z: point.z }, 0.5, 8);
          executeCommand(command);
        }
        return;
      }

      // Handle selection based on current mode
      if (selectionMode === 'mesh') {
        // For mesh mode, select the mesh regardless of what component was clicked
        if (userData.meshId) {
          setSelectedMeshId(userData.meshId);
        } else if (mesh) {
          // Assign a default mesh ID if not present
          setSelectedMeshId(mesh.id || 'default-mesh');
        }
        return;
      } else if (selectionMode === 'face' && userData.faceId) {
        if (event.ctrlKey || event.metaKey) {
          toggleFaceSelection(userData.faceId);
        } else {
          setSelectedFaceId(userData.faceId);
        }
        return;
      } else if (selectionMode === 'vertex' && userData.vertexId) {
        console.log('🖱️ Selecting vertex:', userData.vertexId);
        setSelectedVertexId(userData.vertexId);
        return;
      } else if (selectionMode === 'edge' && userData.edgeId) {
        setSelectedEdgeId(userData.edgeId);
        return;
      }
    }
    
    // Clear selection if nothing was clicked
    if (selectionMode === 'face') setSelectedFaceId(null);
    else if (selectionMode === 'vertex') setSelectedVertexId(null);
    else if (selectionMode === 'edge') setSelectedEdgeId(null);
    else if (selectionMode === 'mesh') setSelectedMeshId(null);
  };

  // Render loop
  useEffect(() => {
    const animate = () => {
      // No OrbitControls update needed - using manual controls
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer"
        style={{ display: 'block' }}
      />
      
      {/* Camera Controls Help */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <div className="px-2 py-1 rounded text-xs font-medium bg-black/60 text-white">
          Ctrl+Drag: Rotate | Right+Drag: Pan | Wheel: Zoom
        </div>
      </div>

      {/* Half-Edge Visualization Controls */}
      {mesh && sceneRef.current && (
        <HalfEdgeVisualization 
          mesh={mesh}
          scene={sceneRef.current}
          selectedVertexId={selectedVertexId}
          selectedEdgeId={selectedEdgeId}
          selectedFaceId={selectedFaceId}
        />
      )}
      
      {/* Extrude Gizmo - Temporarily disabled for debugging */}
      {/* 
      {mesh && sceneRef.current && rendererRef.current && cameraRef.current && (
        <ExtrudeGizmo 
          scene={sceneRef.current}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          orbitControls={orbitControlsRef.current}
          transformControls={transformControlsRef.current}
        />
      )}
      */}
      
      {/* Simple Geometry Dragger - Always enabled, works with Ctrl+drag navigation */}
      {mesh && sceneRef.current && rendererRef.current && cameraRef.current && (
        <SimpleGeometryDragger 
          scene={sceneRef.current}
          camera={cameraRef.current}
          renderer={rendererRef.current}
        />
      )}
      
      {/* Transform Controls UI - DISABLED 
      {(selectedVertexId || selectedEdgeId || selectedFaceId) && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 rounded-lg p-3 space-y-2">
          <div className="text-white text-sm font-medium">Transform</div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTransformMode('translate')}
              className={`p-2 rounded text-xs ${
                transformMode === 'translate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
              title="Move (G)"
            >
              ⬄
            </button>
            <button
              onClick={() => setTransformMode('rotate')}
              className={`p-2 rounded text-xs ${
                transformMode === 'rotate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
              title="Rotate (R)"
            >
              ↻
            </button>
            <button
              onClick={() => setTransformMode('scale')}
              className={`p-2 rounded text-xs ${
                transformMode === 'scale'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
              title="Scale (S)"
            >
              ⊞
            </button>
          </div>
        </div>
      )}
      */}
    </div>
  );
};