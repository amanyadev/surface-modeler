import { create } from 'zustand';
import { HalfEdgeMesh, CommandHistory } from '@half-edge/kernel';

export type ViewMode = '2d' | '3d';
export type CameraMode = 'perspective' | 'orthographic';
export type ControlMode = 'navigate' | 'select' | 'draw';
export type SelectionMode = 'vertex' | 'edge' | 'face' | 'mesh';
export type DrawMode = 'none' | 'sketch' | 'vertex' | 'quad' | 'circle';

interface AppState {
  mesh: HalfEdgeMesh | null;
  commandHistory: CommandHistory;
  controlMode: ControlMode;
  selectionMode: SelectionMode;
  drawMode: DrawMode;
  sketchVertices: string[];
  selectedVertexId: string | null;
  selectedEdgeId: string | null;
  selectedFaceId: string | null;
  selectedFaceIds: string[];
  selectedMeshId: string | null;
  viewMode: ViewMode;
  cameraMode: CameraMode;
  updateCounter: number;
  
  // Actions
  setMesh: (mesh: HalfEdgeMesh) => void;
  setControlMode: (mode: ControlMode) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setDrawMode: (mode: DrawMode) => void;
  addSketchVertex: (vertexId: string) => void;
  finishSketch: () => void;
  clearSketch: () => void;
  createVertexAt: (position: { x: number, y: number, z: number }) => void;
  setSelectedVertexId: (vertexId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  setSelectedFaceId: (faceId: string | null) => void;
  setSelectedMeshId: (meshId: string | null) => void;
  toggleFaceSelection: (faceId: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  executeCommand: (command: any) => void;
  undo: () => void;
  redo: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mesh: null,
  commandHistory: new CommandHistory(),
  controlMode: 'navigate',
  selectionMode: 'face',
  drawMode: 'none',
  sketchVertices: [],
  selectedVertexId: null,
  selectedEdgeId: null,
  selectedFaceId: null,
  selectedFaceIds: [],
  selectedMeshId: null,
  viewMode: '3d',
  cameraMode: 'perspective',
  updateCounter: 0,
  
  setMesh: (mesh) => set({ mesh }),
  setControlMode: (mode) => set({ 
    controlMode: mode,
    // Auto-switch to appropriate selection mode for control mode
    selectionMode: mode === 'select' ? get().selectionMode : 'face',
    // Clear selections when switching to navigate mode
    ...(mode === 'navigate' && {
      selectedVertexId: null,
      selectedEdgeId: null,
      selectedFaceId: null,
      selectedFaceIds: [],
      selectedMeshId: null
    })
  }),
  setSelectionMode: (mode) => set({ 
    selectionMode: mode,
    // Clear all selections when switching modes
    selectedVertexId: null,
    selectedEdgeId: null,
    selectedFaceId: null,
    selectedFaceIds: [],
    selectedMeshId: null
  }),
  setDrawMode: (mode) => set({ drawMode: mode, sketchVertices: mode === 'none' ? [] : get().sketchVertices }),
  addSketchVertex: (vertexId) => {
    const { sketchVertices } = get();
    if (!sketchVertices.includes(vertexId)) {
      set({ sketchVertices: [...sketchVertices, vertexId] });
    }
  },
  finishSketch: () => {
    const { mesh, sketchVertices, executeCommand } = get();
    if (mesh && sketchVertices.length >= 3) {
      // Import the command here to avoid circular dependencies
      import('@half-edge/kernel').then(({ CreateFaceFromVerticesCommand }) => {
        const command = new CreateFaceFromVerticesCommand(sketchVertices);
        executeCommand(command);
        set({ sketchVertices: [], drawMode: 'none' });
      });
    }
  },
  clearSketch: () => set({ sketchVertices: [] }),
  createVertexAt: (position) => {
    const { mesh } = get();
    if (mesh) {
      // Create vertex directly using the mesh
      mesh.addVertex(position);
      // Force re-render
      const { updateCounter } = get();
      set({ updateCounter: updateCounter + 1 });
    }
  },
  setSelectedVertexId: (vertexId) => set({ selectedVertexId: vertexId, selectedEdgeId: null, selectedFaceId: null, selectedMeshId: null }),
  setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId, selectedVertexId: null, selectedFaceId: null, selectedMeshId: null }),
  setSelectedFaceId: (faceId) => set({ selectedFaceId: faceId, selectedVertexId: null, selectedEdgeId: null, selectedMeshId: null }),
  setSelectedMeshId: (meshId) => set({ selectedMeshId: meshId, selectedVertexId: null, selectedEdgeId: null, selectedFaceId: null }),
  toggleFaceSelection: (faceId) => {
    const { selectedFaceIds } = get();
    const newSelection = selectedFaceIds.includes(faceId)
      ? selectedFaceIds.filter(id => id !== faceId)
      : [...selectedFaceIds, faceId];
    set({ selectedFaceIds: newSelection });
  },
  clearSelection: () => set({ selectedVertexId: null, selectedEdgeId: null, selectedFaceId: null, selectedFaceIds: [], selectedMeshId: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  
  executeCommand: (command) => {
    console.log('🏪 Store executeCommand called with:', command);
    const { mesh, commandHistory, updateCounter } = get();
    console.log('🏪 Store state:', { mesh: !!mesh, updateCounter });
    
    if (mesh) {
      try {
        console.log('🏪 Calling commandHistory.execute...');
        commandHistory.execute(command, mesh);
        console.log('🏪 Command executed, incrementing updateCounter from', updateCounter, 'to', updateCounter + 1);
        // Force re-render by incrementing counter while keeping mesh reference
        set({ updateCounter: updateCounter + 1 });
        console.log('✅ Store update complete');
      } catch (error) {
        console.error('❌ Store command execution failed:', error);
        // You might want to show a user-friendly error message here
      }
    } else {
      console.error('❌ No mesh in store, cannot execute command');
    }
  },
  
  undo: () => {
    const { mesh, commandHistory, updateCounter } = get();
    if (mesh && commandHistory.undo(mesh)) {
      // Force re-render by incrementing counter while keeping mesh reference
      set({ updateCounter: updateCounter + 1 });
    }
  },
  
  redo: () => {
    const { mesh, commandHistory, updateCounter } = get();
    if (mesh && commandHistory.redo(mesh)) {
      // Force re-render by incrementing counter while keeping mesh reference
      set({ updateCounter: updateCounter + 1 });
    }
  },
}));