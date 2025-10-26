import React from 'react';
import { useAppStore } from '../../store';

export const DrawingToolsPanel: React.FC = () => {
  const { 
    drawMode, 
    setDrawMode, 
    sketchVertices, 
    finishSketch, 
    clearSketch 
  } = useAppStore();

  const drawingTools = [
    { 
      key: 'vertex' as const, 
      name: 'Add Vertex', 
      icon: 'V',
      desc: 'Click to place vertices in 3D space' 
    },
    { 
      key: 'sketch' as const, 
      name: 'Sketch Face', 
      icon: 'SK',
      desc: 'Connect vertices to create faces' 
    },
    { 
      key: 'quad' as const, 
      name: 'Quick Quad', 
      icon: 'Q',
      desc: 'Create rectangular faces quickly' 
    },
    { 
      key: 'circle' as const, 
      name: 'Quick Circle', 
      icon: 'C',
      desc: 'Create circular faces' 
    }
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-gray-300 mb-4">Interactive drawing tools</div>
      
      {drawingTools.map((tool) => (
        <button
          key={tool.key}
          onClick={() => setDrawMode(drawMode === tool.key ? 'none' : tool.key)}
          className={`w-full p-4 text-left rounded-lg border transition-all group ${
            drawMode === tool.key
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
              : 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500 text-gray-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
              drawMode === tool.key ? 'bg-blue-400 text-blue-900' : 'bg-gray-600 text-white'
            }`}>
              {tool.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{tool.name}</div>
              <div className={`text-xs ${
                drawMode === tool.key ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-300'
              }`}>
                {tool.desc}
              </div>
            </div>
          </div>
        </button>
      ))}
      
      {drawMode === 'sketch' && sketchVertices.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="text-sm text-gray-300 mb-3">
            Sketch Progress: {sketchVertices.length} vertices
          </div>
          <div className="flex space-x-2">
            <button
              onClick={finishSketch}
              disabled={sketchVertices.length < 3}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:bg-gray-600 disabled:text-gray-400 hover:bg-green-500 transition-colors"
            >
              Finish Face
            </button>
            <button
              onClick={clearSketch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};