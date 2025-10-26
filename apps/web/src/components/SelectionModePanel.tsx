import React from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';

export const SelectionModePanel: React.FC = () => {
  const resizable = useResizable({
    initialPosition: { x: 16, y: window.innerHeight - 200 - 16 }, // bottom-left, above camera controls
    initialSize: { width: 200, height: 180 },
    minWidth: 180,
    minHeight: 160,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { selectionMode, setSelectionMode } = useAppStore();

  const selectionModes = [
    { key: 'vertex', label: 'Vertex', icon: '●', color: 'bg-green-500', description: 'Select vertices' },
    { key: 'edge', label: 'Edge', icon: '—', color: 'bg-blue-500', description: 'Select edges' },
    { key: 'face', label: 'Face', icon: '▢', color: 'bg-purple-500', description: 'Select faces' },
    { key: 'mesh', label: 'Mesh', icon: '⬢', color: 'bg-orange-500', description: 'Select entire mesh' }
  ] as const;

  return (
    <div 
      ref={resizable.ref}
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      style={{ overflow: 'hidden' }}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between p-3 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Selection Mode</h3>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {selectionModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setSelectionMode(mode.key)}
            className={`w-full flex items-center p-2.5 rounded-lg text-left transition-all duration-200 ${
              selectionMode === mode.key
                ? `${mode.color} text-white shadow-md transform scale-[1.02]`
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg mr-3 min-w-[20px] text-center">
              {mode.icon}
            </span>
            <div className="flex-1">
              <div className="font-medium text-sm">{mode.label}</div>
              <div className={`text-xs ${
                selectionMode === mode.key ? 'text-white/80' : 'text-gray-500'
              }`}>
                {mode.description}
              </div>
            </div>
            {selectionMode === mode.key && (
              <div className="w-2 h-2 bg-white rounded-full ml-2"></div>
            )}
          </button>
        ))}
      </div>

      {/* Resize handle */}
      <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};