import React from 'react';
import { useAppStore } from '../store';
import { FloatingWidget } from './FloatingWidget';

export const ViewportControls: React.FC = () => {
  const { controlMode, setControlMode, cameraMode, setCameraMode, viewMode, setViewMode } = useAppStore();

  const handleResetView = () => {
    const resetCameraEvent = new CustomEvent('resetCamera');
    window.dispatchEvent(resetCameraEvent);
  };

  const handleFitToScreen = () => {
    const fitCameraEvent = new CustomEvent('fitCamera');
    window.dispatchEvent(fitCameraEvent);
  };

  const handleViewPreset = (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso') => {
    const presetCameraEvent = new CustomEvent('presetCamera', { detail: preset });
    window.dispatchEvent(presetCameraEvent);
  };

  return (
    <FloatingWidget
      title="Viewport"
      icon="V"
      iconBgColor="bg-blue-600"
      defaultPosition={{ x: window.innerWidth - 250, y: 60 }}
      isCollapsible={false}
      zIndex={16}
    >
      <div className="space-y-3">
        {/* Control Mode Toggle */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400 font-medium">Control Mode</div>
          <div className="flex space-x-1">
            <button
              onClick={() => setControlMode('navigate')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                controlMode === 'navigate'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              🧭 Nav
            </button>
            <button
              onClick={() => setControlMode('select')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                controlMode === 'select'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              👆 Select
            </button>
            <button
              onClick={() => setControlMode('draw')}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                controlMode === 'draw'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              ✏️ Draw
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-1">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              viewMode === '3d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              viewMode === '2d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            2D
          </button>
        </div>

        {/* Projection Toggle */}
        <div className="flex space-x-1">
          <button
            onClick={() => setCameraMode('perspective')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              cameraMode === 'perspective'
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Persp
          </button>
          <button
            onClick={() => setCameraMode('orthographic')}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              cameraMode === 'orthographic'
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Ortho
          </button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1">
          <button
            onClick={handleResetView}
            className="w-full px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
          >
            🔄 Reset (R)
          </button>
          <button
            onClick={handleFitToScreen}
            className="w-full px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
          >
            📐 Fit (F)
          </button>
        </div>

        {/* View Presets */}
        <div className="pt-2 border-t border-gray-600">
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => handleViewPreset('front')} className="px-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">F</button>
            <button onClick={() => handleViewPreset('right')} className="px-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">R</button>
            <button onClick={() => handleViewPreset('top')} className="px-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">T</button>
            <button onClick={() => handleViewPreset('back')} className="px-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">B</button>
            <button onClick={() => handleViewPreset('left')} className="px-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">L</button>
            <button onClick={() => handleViewPreset('bottom')} className="px-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">Bot</button>
          </div>
          <button
            onClick={() => handleViewPreset('iso')}
            className="w-full mt-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs"
          >
            Iso
          </button>
        </div>

        {/* Controls Help */}
        <div className="pt-2 border-t border-gray-600 text-gray-400 space-y-1">
          <div className="text-xs font-medium">Navigation Controls:</div>
          <div className="text-xs space-y-0.5">
            <div>Ctrl+Drag: Rotate</div>
            <div>Right Drag: Pan</div>
            <div>Wheel: Zoom</div>
            <div>Middle Drag: Pan</div>
            <div className="pt-1 text-gray-500">Click: Select element</div>
          </div>
        </div>
      </div>
    </FloatingWidget>
  );
};