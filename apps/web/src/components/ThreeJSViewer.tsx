import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
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
import { EnhancedGrid } from './EnhancedGrid';
import { GizmoManager } from './GizmoManager';

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
  const orbitControlsRef = useRef<any>();
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  const gizmoManagerRef = useRef<GizmoManager | null>(null);
  
  
  const { 
    mesh, 
    viewMode, 
    cameraMode, 
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
    executeCommand,
    gridSettings,
    updateGridSettings,
    lightingSettings
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
    renderer.shadowMap.enabled = lightingSettings.shadowsEnabled;
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

    // Store lighting references for dynamic updates
    const lightingRefs = {
      ambient: new THREE.AmbientLight(0x404040, lightingSettings.ambientIntensity),
      directional: new THREE.DirectionalLight(0xffffff, lightingSettings.directionalIntensity),
      fill: new THREE.DirectionalLight(0xffffff, lightingSettings.fillIntensity),
      rim: new THREE.DirectionalLight(0x6699ff, lightingSettings.rimIntensity),
    };

    // Ambient light
    scene.add(lightingRefs.ambient);

    // Key light (directional)
    lightingRefs.directional.position.set(10, 10, 5);
    lightingRefs.directional.castShadow = lightingSettings.shadowsEnabled;
    lightingRefs.directional.shadow.mapSize.width = lightingSettings.shadowMapSize;
    lightingRefs.directional.shadow.mapSize.height = lightingSettings.shadowMapSize;
    lightingRefs.directional.shadow.camera.near = 0.5;
    lightingRefs.directional.shadow.camera.far = 50;
    lightingRefs.directional.visible = lightingSettings.directionalEnabled;
    scene.add(lightingRefs.directional);

    // Fill light
    lightingRefs.fill.position.set(-5, 5, -5);
    lightingRefs.fill.visible = lightingSettings.fillEnabled;
    scene.add(lightingRefs.fill);

    // Rim light
    lightingRefs.rim.position.set(-2, -2, 8);
    lightingRefs.rim.visible = lightingSettings.rimEnabled;
    scene.add(lightingRefs.rim);

    // Store references for later updates
    (scene as any).lightingRefs = lightingRefs;

    // Setup raycaster for picking
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Enhanced grid will be added via the EnhancedGrid component

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

  // Update lighting when settings change
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const lightingRefs = (scene as any).lightingRefs;
    
    if (lightingRefs) {
      // Update lighting intensities
      lightingRefs.ambient.intensity = lightingSettings.ambientIntensity;
      lightingRefs.directional.intensity = lightingSettings.directionalIntensity;
      lightingRefs.fill.intensity = lightingSettings.fillIntensity;
      lightingRefs.rim.intensity = lightingSettings.rimIntensity;
      
      // Update lighting visibility
      lightingRefs.directional.visible = lightingSettings.directionalEnabled;
      lightingRefs.fill.visible = lightingSettings.fillEnabled;
      lightingRefs.rim.visible = lightingSettings.rimEnabled;
      
      // Update shadow settings
      lightingRefs.directional.castShadow = lightingSettings.shadowsEnabled;
      lightingRefs.directional.shadow.mapSize.width = lightingSettings.shadowMapSize;
      lightingRefs.directional.shadow.mapSize.height = lightingSettings.shadowMapSize;
      
      // Update renderer shadow settings
      renderer.shadowMap.enabled = lightingSettings.shadowsEnabled;
    }
  }, [lightingSettings]);

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
        case 'h':
          updateGridSettings({ visible: !gridSettings.visible });
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
        isDraggingCameraRef.current = true;
        event.preventDefault();
        console.log('🎮 Starting rotation');
      } else if (event.button === 2) {
        // Right-click for panning
        cameraControls.isPanning = true;
        cameraControls.lastMouse.x = event.clientX;
        cameraControls.lastMouse.y = event.clientY;
        isDraggingCameraRef.current = true;
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
        
        // Update gizmo scales when camera moves
        updateGizmoScales();
        
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
        
        // Update gizmo scales when camera moves
        updateGizmoScales();
        
        cameraControls.lastMouse.x = event.clientX;
        cameraControls.lastMouse.y = event.clientY;
        
        console.log('🎮 Panning camera');
      }
    };
    
    const handleMouseUp = (_event: MouseEvent) => {
      if (cameraControls.isRotating) {
        cameraControls.isRotating = false;
        console.log('🎮 Stopped rotation');
      }
      if (cameraControls.isPanning) {
        cameraControls.isPanning = false;
        console.log('🎮 Stopped pan');
      }
      // Reset dragging flag after a brief delay to prevent immediate selection
      setTimeout(() => {
        isDraggingCameraRef.current = false;
      }, 50);
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
      
      // Update gizmo scales when camera moves
      updateGizmoScales();
      
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

  // Create material based on shading mode and lighting settings
  const createMaterial = (isSelected: boolean) => {
    const baseColor = isSelected ? 0x3b82f6 : 0xe5e7eb;
    const emissiveColor = isSelected ? 0x1e40af : 0x111827;
    const emissiveIntensity = isSelected ? 0.3 : 0.1;

    const materialProps = {
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      wireframe: lightingSettings.wireframe,
    };

    switch (lightingSettings.shadingMode) {
      case 'flat':
        return new THREE.MeshLambertMaterial({
          ...materialProps,
          flatShading: true,
        });
        
      case 'gouraud':
        // Use Lambert material for Gouraud-like shading
        return new THREE.MeshLambertMaterial({
          ...materialProps,
          flatShading: false,
        });
        
      case 'phong':
        // Enhanced Phong shading with better parameters
        return new THREE.MeshPhongMaterial({
          ...materialProps,
          shininess: Math.max(1, (1.0 - lightingSettings.roughness) * 100),
          specular: new THREE.Color().setHSL(0, 0, lightingSettings.metalness),
        });
        
      case 'toon':
        return new THREE.MeshToonMaterial({
          ...materialProps,
        });
        
      default:
        return new THREE.MeshStandardMaterial({
          ...materialProps,
          roughness: lightingSettings.roughness,
          metalness: lightingSettings.metalness,
        });
    }
  };

  // Create unified geometry for smooth shading
  const createUnifiedMeshGeometry = (kernelMesh: HalfEdgeMesh): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    
    let vertexIndex = 0;
    const vertexMap = new Map<string, number>();
    
    const faces = kernelMesh.faces();
    
    faces.forEach(face => {
      const faceVertices = kernelMesh.getFaceVertices(face.id);
      
      if (faceVertices.length >= 3) {
        const faceIndices: number[] = [];
        
        // Add vertices and build index mapping
        faceVertices.forEach(vertex => {
          // Check for valid position coordinates
          if (!vertex.pos || 
              typeof vertex.pos.x !== 'number' || 
              typeof vertex.pos.y !== 'number' || 
              typeof vertex.pos.z !== 'number' ||
              !isFinite(vertex.pos.x) || 
              !isFinite(vertex.pos.y) || 
              !isFinite(vertex.pos.z)) {
            console.warn('Invalid vertex position:', vertex.pos, 'for vertex:', vertex.id, 'types:', typeof vertex.pos?.x, typeof vertex.pos?.y, typeof vertex.pos?.z);
            return; // Skip this vertex
          }
          
          const key = `${vertex.pos.x.toFixed(6)}_${vertex.pos.y.toFixed(6)}_${vertex.pos.z.toFixed(6)}`;
          
          if (!vertexMap.has(key)) {
            positions.push(vertex.pos.x, vertex.pos.y, vertex.pos.z);
            vertexMap.set(key, vertexIndex);
            vertexIndex++;
          }
          
          faceIndices.push(vertexMap.get(key)!);
        });
        
        // Only create face if we have enough valid vertices
        if (faceIndices.length >= 3) {
          // Triangulate face
          if (faceIndices.length === 4) {
            // Quad: create two triangles
            indices.push(faceIndices[0], faceIndices[1], faceIndices[2]);
            indices.push(faceIndices[0], faceIndices[2], faceIndices[3]);
          } else {
            // Fan triangulation for other polygons
            for (let i = 1; i < faceIndices.length - 1; i++) {
              indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
            }
          }
        } else {
          console.warn('Face has insufficient valid vertices:', faceIndices.length, 'for face:', face.id);
        }
      }
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals(); // This creates smooth normals across the entire mesh
    
    return geometry;
  };

  // Convert kernel mesh to Three.js geometry
  const meshToThreeJS = (kernelMesh: HalfEdgeMesh): THREE.Group => {
    const group = new THREE.Group();
    
    if (!kernelMesh || typeof kernelMesh.faces !== 'function') {
      console.error('Invalid mesh object passed to meshToThreeJS');
      return group;
    }
    
    // For smooth shading modes (phong, gouraud), create a unified mesh
    if (lightingSettings.shadingMode === 'phong' || lightingSettings.shadingMode === 'gouraud') {
      const unifiedGeometry = createUnifiedMeshGeometry(kernelMesh);
      const material = createMaterial(false);
      
      const meshObject = new THREE.Mesh(unifiedGeometry, material);
      meshObject.userData = { 
        type: 'unified-mesh', 
        meshId: kernelMesh.id || 'default-mesh'
      };
      meshObject.castShadow = true;
      meshObject.receiveShadow = true;
      meshObject.renderOrder = 1;
      
      // Store reference for potential selection
      selectedObjectRef.current = meshObject;
      
      group.add(meshObject);
    } else {
      // For flat shading and toon shading, create individual face meshes
      const faces = kernelMesh.faces();
      faces.forEach((face, index) => {
      const faceVertices = kernelMesh.getFaceVertices(face.id);
      
      if (faceVertices.length >= 3) {
        const geometry = new THREE.BufferGeometry();
        
        // Create vertices for triangulation
        const positions: number[] = [];
        const normals: number[] = [];
        
        // Better triangulation for quads and other polygons
        if (faceVertices.length === 4) {
          // For quads, create two triangles that don't create visible diagonal
          // Triangle 1: 0, 1, 2
          positions.push(
            faceVertices[0].pos.x, faceVertices[0].pos.y, faceVertices[0].pos.z,
            faceVertices[1].pos.x, faceVertices[1].pos.y, faceVertices[1].pos.z,
            faceVertices[2].pos.x, faceVertices[2].pos.y, faceVertices[2].pos.z
          );
          // Triangle 2: 0, 2, 3
          positions.push(
            faceVertices[0].pos.x, faceVertices[0].pos.y, faceVertices[0].pos.z,
            faceVertices[2].pos.x, faceVertices[2].pos.y, faceVertices[2].pos.z,
            faceVertices[3].pos.x, faceVertices[3].pos.y, faceVertices[3].pos.z
          );
          
          // Add normals for both triangles
          const normal = face.normal || { x: 0, y: 1, z: 0 };
          for (let j = 0; j < 6; j++) { // 6 vertices total (2 triangles × 3 vertices)
            normals.push(normal.x, normal.y, normal.z);
          }
        } else {
          // Fan triangulation for other polygons
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
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        
        // For better Phong shading, ensure smooth normals when not in flat mode
        if (lightingSettings.shadingMode !== 'flat') {
          geometry.computeVertexNormals();
        }
        
        const isSelected = selectedFaceId === face.id || selectedFaceIds.includes(face.id);
        const material = createMaterial(isSelected);
        
        const faceMesh = new THREE.Mesh(geometry, material);
        faceMesh.userData = { 
          type: 'face', 
          faceId: face.id, 
          faceIndex: index,
          meshId: kernelMesh.id || 'default-mesh'
        };
        faceMesh.castShadow = true;
        faceMesh.receiveShadow = true;
        faceMesh.renderOrder = 1; // Render faces before edges
        
        // Add wireframe edges for better visibility
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
          color: isSelected ? 0xffffff : 0x6b7280, // Lighter wireframe color
          linewidth: isSelected ? 2 : 1,
          transparent: true,
          opacity: isSelected ? 1.0 : 0.8,
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.userData = faceMesh.userData; // Same user data for selection
        wireframe.renderOrder = 3; // Render wireframes on top
        
        // Store reference if selected or if in mesh mode and mesh is selected
        if (isSelected || (selectionMode === 'mesh' && selectedMeshId)) {
          selectedObjectRef.current = faceMesh;
        }
        
        group.add(faceMesh);
        group.add(wireframe);
      }
      });
    }

    // Note: Vertex and edge gizmos are now handled by GizmoManager
    // Old vertex and edge processing code removed
    
    return group;
  };

  // Update mesh visualization
  useEffect(() => {
    if (!meshObjectRef.current || !mesh || !sceneRef.current || !cameraRef.current) return;

    // Clear previous mesh
    meshObjectRef.current.clear();
    
    // Add new mesh
    const threeJSMesh = meshToThreeJS(mesh);
    meshObjectRef.current.add(threeJSMesh);

    // Initialize or update gizmo manager
    if (!gizmoManagerRef.current) {
      gizmoManagerRef.current = new GizmoManager(sceneRef.current, cameraRef.current, mesh);
    } else {
      gizmoManagerRef.current.updateMesh(mesh);
    }

    // Update gizmo states
    gizmoManagerRef.current.updateState({
      selectedVertexId,
      selectedEdgeId,
      selectedFaceId: selectedFaceId,
      hoveredVertexId: null, // Will be updated in mouse handlers
      hoveredEdgeId: null,
      hoveredFaceId: null,
    });

    // Set selection mode for gizmo visibility
    gizmoManagerRef.current.setSelectionMode(selectionMode);
  }, [mesh, selectedFaceId, selectedFaceIds, selectedVertexId, selectedEdgeId, selectedMeshId, selectionMode, drawMode, sketchVertices, updateCounter, lightingSettings]);

  // Camera change callback for updating gizmo scales
  const updateGizmoScales = useCallback(() => {
    if (gizmoManagerRef.current) {
      gizmoManagerRef.current.updateCameraScale();
    }
  }, []);

  // Track if we're dragging camera to prevent selection on release
  const isDraggingCameraRef = useRef(false);

  // Handle mouse clicks for selection
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current || !raycasterRef.current || !mouseRef.current) return;

    // Don't handle selection if we just finished a camera operation
    if (isDraggingCameraRef.current) {
      isDraggingCameraRef.current = false;
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('🖱️ Click at screen:', { x: event.clientX - rect.left, y: event.clientY - rect.top });
    console.log('🖱️ Normalized mouse:', mouseRef.current);
    console.log('🎯 Selection mode:', selectionMode);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Intersect with gizmos for selection
    const gizmoObjects = gizmoManagerRef.current ? gizmoManagerRef.current.getSelectableObjects() : [];
    const meshObjects = meshObjectRef.current ? [meshObjectRef.current] : [];
    const allObjects = [...gizmoObjects, ...meshObjects];
    const intersects = raycasterRef.current.intersectObjects(allObjects, true);
    
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
        (selectionMode === 'vertex' && (userData.vertexId || userData.type === 'vertex-gizmo')) ||
        (selectionMode === 'edge' && (userData.edgeId || userData.type === 'edge-gizmo')) ||
        (selectionMode === 'face' && (userData.faceId || userData.type === 'face-gizmo')) ||
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
        console.log('🔗 Edge selected:', userData.edgeId);
        console.log('🔗 Edge object:', userData);
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

  // Handle mouse movement for hover effects
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current || !raycasterRef.current || !mouseRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Intersect with gizmos for hover detection
    const gizmoObjects = gizmoManagerRef.current ? gizmoManagerRef.current.getSelectableObjects() : [];
    const intersects = raycasterRef.current.intersectObjects(gizmoObjects, true);
    
    // Update hover state in gizmo manager
    if (gizmoManagerRef.current) {
      let hoveredVertexId = null;
      let hoveredEdgeId = null;
      let hoveredFaceId = null;

      // Find hovered gizmo
      for (const intersect of intersects) {
        const userData = intersect.object.userData;
        
        if (userData.type === 'vertex-gizmo' && selectionMode === 'vertex') {
          hoveredVertexId = userData.vertexId;
          break;
        } else if (userData.type === 'edge-gizmo' && selectionMode === 'edge') {
          hoveredEdgeId = userData.edgeId;
          break;
        } else if (userData.type === 'face-gizmo' && selectionMode === 'face') {
          hoveredFaceId = userData.faceId;
          break;
        }
      }

      // Update gizmo manager state with hover information
      gizmoManagerRef.current.updateState({
        hoveredVertexId,
        hoveredEdgeId,
        hoveredFaceId,
        selectedVertexId,
        selectedEdgeId,
        selectedFaceId,
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className="cursor-pointer"
        style={{ display: 'block' }}
      />
      
      {/* Camera Controls Help */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <div className="px-2 py-1 rounded text-xs font-medium bg-black/60 text-white">
          Ctrl+Drag: Rotate | Right+Drag: Pan | Wheel: Zoom
        </div>
      </div>

      {/* Enhanced Grid */}
      {sceneRef.current && cameraRef.current && gridSettings.visible && (
        <EnhancedGrid 
          scene={sceneRef.current}
          camera={cameraRef.current}
          size={gridSettings.size}
          divisions={gridSettings.divisions}
          showLabels={gridSettings.showLabels}
          showAxes={gridSettings.showAxes}
          adaptive={gridSettings.adaptive}
          opacity={gridSettings.opacity}
        />
      )}

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