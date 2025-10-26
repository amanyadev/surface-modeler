import { useEffect } from 'react';
import { useAppStore } from '../store';
import { 
  ExtrudeCommand, 
  MoveVertexCommand,
  SubdivideEdgeCommand 
} from '@half-edge/kernel';

export const useKeyboard = () => {
  const { 
    controlMode,
    setControlMode,
    selectionMode,
    setSelectionMode,
    drawMode,
    setDrawMode,
    selectedFaceId,
    selectedVertexId,
    selectedEdgeId,
    executeCommand, 
    undo, 
    redo, 
    viewMode, 
    setViewMode,
    setCameraMode,
    clearSketch
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default for our handled keys
      const handledKeys = ['KeyE', 'KeyM', 'Space', 'KeyZ', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyG', 'KeyQ', 'KeyC', 'Escape', 'KeyR', 'KeyF', 'KeyN', 'KeyV', 'KeyB'];
      if (handledKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'KeyN':
          // Switch to navigate mode
          setControlMode('navigate');
          break;
          
        case 'KeyV':
          // Switch to select mode
          setControlMode('select');
          break;
          
        case 'KeyB':
          // Switch to draw mode
          setControlMode('draw');
          break;
          
        case 'Digit1':
          // Switch to vertex selection mode
          setSelectionMode('vertex');
          setControlMode('select'); // Auto-switch to select mode
          break;
          
        case 'Digit2':
          // Switch to edge selection mode
          setSelectionMode('edge');
          setControlMode('select'); // Auto-switch to select mode
          break;
          
        case 'Digit3':
          // Switch to face selection mode
          setSelectionMode('face');
          setControlMode('select'); // Auto-switch to select mode
          break;
          
        case 'Digit4':
          // Switch to mesh selection mode
          setSelectionMode('mesh');
          setControlMode('select'); // Auto-switch to select mode
          break;
          
        case 'KeyG':
          // Toggle vertex drawing mode
          setDrawMode(drawMode === 'vertex' ? 'none' : 'vertex');
          setControlMode('draw'); // Auto-switch to draw mode
          break;
          
        case 'KeyQ':
          // Toggle quad drawing mode
          setDrawMode(drawMode === 'quad' ? 'none' : 'quad');
          setControlMode('draw'); // Auto-switch to draw mode
          break;
          
        case 'KeyC':
          // Toggle circle drawing mode
          setDrawMode(drawMode === 'circle' ? 'none' : 'circle');
          setControlMode('draw'); // Auto-switch to draw mode
          break;
          
        case 'Escape':
          // Cancel current drawing mode or clear sketch, return to navigate
          if (drawMode !== 'none') {
            setDrawMode('none');
            clearSketch();
          }
          setControlMode('navigate'); // Return to navigate mode
          break;
          
        case 'KeyE':
          // Extrude (face mode only)
          if (selectionMode === 'face' && selectedFaceId) {
            const command = new ExtrudeCommand(selectedFaceId, 0.5);
            executeCommand(command);
          }
          break;
          
        case 'KeyM':
          // Move vertex (vertex mode only)
          if (selectionMode === 'vertex' && selectedVertexId) {
            const command = new MoveVertexCommand(selectedVertexId, { x: 0, y: 0.5, z: 0 });
            executeCommand(command);
          }
          break;
          
        case 'KeyS':
          // Subdivide edge (edge mode only)
          if (selectionMode === 'edge' && selectedEdgeId) {
            const command = new SubdivideEdgeCommand(selectedEdgeId);
            executeCommand(command);
          }
          break;
          
        case 'Space':
          // Toggle 2D/3D view
          const newViewMode = viewMode === '2d' ? '3d' : '2d';
          setViewMode(newViewMode);
          setCameraMode(newViewMode === '2d' ? 'orthographic' : 'perspective');
          break;
          
        case 'KeyZ':
          if (event.ctrlKey || event.metaKey) {
            if (event.shiftKey) {
              // Redo
              redo();
            } else {
              // Undo
              undo();
            }
          }
          break;
          
        case 'KeyR':
          // Reset camera view
          const resetCameraEvent = new CustomEvent('resetCamera');
          window.dispatchEvent(resetCameraEvent);
          break;
          
        case 'KeyF':
          // Fit view to content
          const fitCameraEvent = new CustomEvent('fitCamera');
          window.dispatchEvent(fitCameraEvent);
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    controlMode,
    setControlMode,
    selectionMode,
    setSelectionMode,
    drawMode,
    setDrawMode,
    selectedFaceId,
    selectedVertexId,
    selectedEdgeId,
    executeCommand,
    undo,
    redo,
    viewMode,
    setViewMode,
    setCameraMode,
    clearSketch,
  ]);
};