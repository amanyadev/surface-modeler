import React from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';

export const CameraMovementControls: React.FC = () => {
  const resizable = useResizable({
    initialPosition: { x: 16, y: window.innerHeight - 400 - 16 }, // bottom-4 left-4
    initialSize: { width: 256, height: 400 },
    minWidth: 220,
    minHeight: 300,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { cameraMode, setCameraMode, viewMode, setViewMode } = useAppStore();

  const handleResetView = () => {
    const resetCameraEvent = new CustomEvent('resetCamera');
    window.dispatchEvent(resetCameraEvent);
  };

  const handleFitToScreen = () => {
    const fitCameraEvent = new CustomEvent('fitCamera');
    window.dispatchEvent(fitCameraEvent);
  };

  const handleToggleWireframe = () => {
    const toggleWireframeEvent = new CustomEvent('toggleWireframe');
    window.dispatchEvent(toggleWireframeEvent);
  };

  const handleViewPreset = (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso') => {
    const presetCameraEvent = new CustomEvent('presetCamera', { detail: preset });
    window.dispatchEvent(presetCameraEvent);
  };

  return (
    <div 
      ref={resizable.ref}
      className={`draggable-panel relative bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 ${
        resizable.isDragging || resizable.isResizing ? 'shadow-2xl dragging' : ''
      }`}
      style={{ overflow: 'auto' }}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Camera & Movement</h4>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* View Mode */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">View Mode</h5>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                viewMode === '2d'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              2D
            </button>
          </div>
        </div>

        {/* Camera Type */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">Projection</h5>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setCameraMode('perspective')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                cameraMode === 'perspective'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Perspective
            </button>
            <button
              onClick={() => setCameraMode('orthographic')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                cameraMode === 'orthographic'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Orthographic
            </button>
          </div>
        </div>

        {/* View Presets (Unity-style) */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">View Presets</h5>
          <div className="grid grid-cols-3 gap-1 mb-2">
            <button
              onClick={() => handleViewPreset('front')}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
            >
              Front
            </button>
            <button
              onClick={() => handleViewPreset('back')}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
            >
              Back
            </button>
            <button
              onClick={() => handleViewPreset('left')}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
            >
              Left
            </button>
            <button
              onClick={() => handleViewPreset('right')}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
            >
              Right
            </button>
            <button
              onClick={() => handleViewPreset('top')}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
            >
              Top
            </button>
            <button
              onClick={() => handleViewPreset('bottom')}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
            >
              Bottom
            </button>
          </div>
          <button
            onClick={() => handleViewPreset('iso')}
            className="w-full px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs"
          >
            Isometric
          </button>
        </div>

        {/* Camera Actions */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">Camera Actions</h5>
          <div className="space-y-1">
            <button
              onClick={handleResetView}
              className="w-full px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs"
            >
              🔄 Reset View (R)
            </button>
            <button
              onClick={handleFitToScreen}
              className="w-full px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs"
            >
              📐 Fit All (F)
            </button>
            <button
              onClick={handleToggleWireframe}
              className="w-full px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs"
            >
              🔲 Wireframe (W)
            </button>
          </div>
        </div>

        {/* Mac-friendly Controls Info */}
        <div className="pt-2 border-t border-gray-200">
          <h5 className="text-xs font-medium text-gray-600 mb-2">Camera Controls</h5>
          <div className="text-xs text-gray-500 space-y-1">
            <div><kbd className="bg-gray-100 px-1 rounded">⌘ + LMB</kbd> Orbit</div>
            <div><kbd className="bg-gray-100 px-1 rounded">⌘ + Shift</kbd> Pan</div>
            <div><kbd className="bg-gray-100 px-1 rounded">⌘ + RMB</kbd> Zoom</div>
            <div><kbd className="bg-gray-100 px-1 rounded">Scroll</kbd> Zoom</div>
            <div><kbd className="bg-gray-100 px-1 rounded">F</kbd> Focus Selected</div>
          </div>
        </div>
      </div>
      
      {/* Resize handle */}
      <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};