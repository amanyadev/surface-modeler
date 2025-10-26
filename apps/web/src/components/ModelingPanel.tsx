import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';
import { 
  ExtrudeCommand,
  RevolveCommand,
  FilletCommand,
  ChamferCommand,
  vec3
} from '@half-edge/kernel';

export const ModelingPanel: React.FC = () => {
  const resizable = useResizable({
    initialPosition: { x: 508, y: 16 }, // next to drawing tools
    initialSize: { width: 280, height: 400 },
    minWidth: 260,
    minHeight: 380,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { 
    selectedFaceId,
    selectedEdgeId,
    executeCommand,
    undo,
    redo,
    commandHistory
  } = useAppStore();

  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [filletRadius, setFilletRadius] = useState(0.2);
  const [chamferDistance, setChamferDistance] = useState(0.1);

  const handleExtrude = () => {
    if (selectedFaceId) {
      const command = new ExtrudeCommand(selectedFaceId, extrudeDistance);
      executeCommand(command);
    }
  };

  const handleRevolve = () => {
    if (selectedFaceId) {
      const axis = vec3(0, 1, 0); // Y-axis
      const command = new RevolveCommand(selectedFaceId, axis, Math.PI * 2, 16);
      executeCommand(command);
    }
  };

  const handleFillet = () => {
    if (selectedEdgeId) {
      const command = new FilletCommand(selectedEdgeId, filletRadius);
      executeCommand(command);
    }
  };

  const handleChamfer = () => {
    if (selectedEdgeId) {
      const command = new ChamferCommand(selectedEdgeId, chamferDistance);
      executeCommand(command);
    }
  };

  const faceOperations = [
    {
      name: 'Extrude',
      icon: '↗️',
      description: 'Extend face along normal',
      action: handleExtrude,
      enabled: !!selectedFaceId,
      needsValue: true,
      value: extrudeDistance,
      setValue: setExtrudeDistance,
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      name: 'Revolve',
      icon: '🔄',
      description: 'Rotate face around axis',
      action: handleRevolve,
      enabled: !!selectedFaceId,
      needsValue: false
    }
  ];

  const edgeOperations = [
    {
      name: 'Fillet',
      icon: '〰️',
      description: 'Round edge corners',
      action: handleFillet,
      enabled: !!selectedEdgeId,
      needsValue: true,
      value: filletRadius,
      setValue: setFilletRadius,
      min: 0.05,
      max: 1.0,
      step: 0.05
    },
    {
      name: 'Chamfer',
      icon: '⟨⟩',
      description: 'Bevel edge corners',
      action: handleChamfer,
      enabled: !!selectedEdgeId,
      needsValue: true,
      value: chamferDistance,
      setValue: setChamferDistance,
      min: 0.05,
      max: 1.0,
      step: 0.05
    }
  ];

  return (
    <div 
      ref={resizable.ref}
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      style={{ overflow: 'hidden' }}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between p-3 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-sm font-semibold text-gray-800">Modeling</h3>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Face Operations */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Face Operations
          </h4>
          <div className="space-y-2">
            {faceOperations.map((op) => (
              <div key={op.name} className="space-y-2">
                <button
                  onClick={op.action}
                  disabled={!op.enabled}
                  className={`w-full flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                    op.enabled
                      ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg mr-3">{op.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{op.name}</div>
                    <div className={`text-xs ${op.enabled ? 'text-purple-100' : 'text-gray-400'}`}>
                      {op.description}
                    </div>
                  </div>
                </button>
                {op.needsValue && (
                  <div className="flex items-center space-x-2 px-2">
                    <label className="text-xs text-gray-600 min-w-[60px]">Distance:</label>
                    <input
                      type="range"
                      min={op.min}
                      max={op.max}
                      step={op.step}
                      value={op.value}
                      onChange={(e) => op.setValue!(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 min-w-[30px]">{op.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edge Operations */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Edge Operations
          </h4>
          <div className="space-y-2">
            {edgeOperations.map((op) => (
              <div key={op.name} className="space-y-2">
                <button
                  onClick={op.action}
                  disabled={!op.enabled}
                  className={`w-full flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                    op.enabled
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg mr-3">{op.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{op.name}</div>
                    <div className={`text-xs ${op.enabled ? 'text-blue-100' : 'text-gray-400'}`}>
                      {op.description}
                    </div>
                  </div>
                </button>
                {op.needsValue && (
                  <div className="flex items-center space-x-2 px-2">
                    <label className="text-xs text-gray-600 min-w-[60px]">Radius:</label>
                    <input
                      type="range"
                      min={op.min}
                      max={op.max}
                      step={op.step}
                      value={op.value}
                      onChange={(e) => op.setValue!(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 min-w-[30px]">{op.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* History Controls */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={undo}
              disabled={!commandHistory.canUndo()}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-xs font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              ↶ Undo
            </button>
            <button
              onClick={redo}
              disabled={!commandHistory.canRedo()}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-xs font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              ↷ Redo
            </button>
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