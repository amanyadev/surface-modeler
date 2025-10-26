import React from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';
import { createPlane, createCube, createCylinder, HalfEdgeMesh } from '@half-edge/kernel';

export const PrimitivesPanel: React.FC = () => {
  const resizable = useResizable({
    initialPosition: { x: 16, y: 16 }, // top-left
    initialSize: { width: 240, height: 280 },
    minWidth: 220,
    minHeight: 250,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { setMesh } = useAppStore();

  const primitives = [
    {
      name: 'Plane',
      icon: '⬜',
      description: 'Flat rectangular surface',
      action: () => setMesh(createPlane(2, 2) as HalfEdgeMesh)
    },
    {
      name: 'Cube',
      icon: '⬛',
      description: 'Six-sided box',
      action: () => setMesh(createCube(2) as HalfEdgeMesh)
    },
    {
      name: 'Cylinder',
      icon: '⬯',
      description: 'Circular tube',
      action: () => setMesh(createCylinder(1, 2, 64) as HalfEdgeMesh)
    }
  ];

  return (
    <div 
      ref={resizable.ref}
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      style={{ overflow: 'hidden' }}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between p-3 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-sm font-semibold text-gray-800">Primitives</h3>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="text-xs text-gray-600 mb-3">
          Create basic geometric shapes
        </div>
        
        {primitives.map((primitive) => (
          <button
            key={primitive.name}
            onClick={primitive.action}
            className="w-full flex items-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all duration-200 group"
          >
            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">
              {primitive.icon}
            </span>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm text-gray-800">{primitive.name}</div>
              <div className="text-xs text-gray-500">{primitive.description}</div>
            </div>
            <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </div>
          </button>
        ))}
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            💡 Tip: Select a primitive to replace the current mesh
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