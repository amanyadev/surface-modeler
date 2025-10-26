import React from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';

export const DrawingToolsPanel: React.FC = () => {
  const resizable = useResizable({
    initialPosition: { x: 272, y: 16 }, // next to primitives panel
    initialSize: { width: 220, height: 300 },
    minWidth: 200,
    minHeight: 280,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { 
    drawMode, 
    setDrawMode, 
    sketchVertices, 
    finishSketch, 
    clearSketch 
  } = useAppStore();

  const drawingTools = [
    {
      key: 'vertex',
      name: 'Add Vertex',
      icon: '●',
      description: 'Click to place vertices',
      color: 'bg-green-500'
    },
    {
      key: 'sketch',
      name: 'Sketch Face',
      icon: '✏️',
      description: 'Connect vertices to create faces',
      color: 'bg-blue-500'
    },
    {
      key: 'quad',
      name: 'Quick Quad',
      icon: '▢',
      description: 'Create rectangular faces',
      color: 'bg-purple-500'
    },
    {
      key: 'circle',
      name: 'Quick Circle',
      icon: '○',
      description: 'Create circular faces',
      color: 'bg-orange-500'
    }
  ] as const;

  return (
    <div 
      ref={resizable.ref}
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      style={{ overflow: 'hidden' }}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between p-3 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-gradient-to-r from-green-50 to-emerald-50">
        <h3 className="text-sm font-semibold text-gray-800">Drawing Tools</h3>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="text-xs text-gray-600 mb-3">
          Interactive drawing and creation tools
        </div>
        
        {drawingTools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => setDrawMode(drawMode === tool.key ? 'none' : tool.key)}
            className={`w-full flex items-center p-3 rounded-lg border transition-all duration-200 ${
              drawMode === tool.key
                ? `${tool.color} text-white shadow-md border-transparent transform scale-[1.02]`
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
            }`}
          >
            <span className="text-lg mr-3 min-w-[24px] text-center">
              {tool.icon}
            </span>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{tool.name}</div>
              <div className={`text-xs ${
                drawMode === tool.key ? 'text-white/80' : 'text-gray-500'
              }`}>
                {tool.description}
              </div>
            </div>
            {drawMode === tool.key && (
              <div className="w-2 h-2 bg-white rounded-full ml-2"></div>
            )}
          </button>
        ))}

        {/* Sketch controls */}
        {drawMode === 'sketch' && (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
            <div className="text-xs text-gray-600">
              Sketch: {sketchVertices.length} vertices selected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={finishSketch}
                disabled={sketchVertices.length < 3}
                className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Finish Face
              </button>
              <button
                onClick={clearSketch}
                className="px-2 py-1.5 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Current mode indicator */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {drawMode === 'none' ? (
              '🎯 Select a tool to start drawing'
            ) : (
              `🎨 ${drawingTools.find(t => t.key === drawMode)?.name} active`
            )}
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