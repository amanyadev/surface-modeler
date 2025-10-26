import React from 'react';
import { useAppStore } from '../store';
import { useDraggable } from '../hooks/useDraggable';

export const HierarchyPanel: React.FC = () => {
  const draggable = useDraggable({
    initialPosition: { x: window.innerWidth - 192 - 16, y: 16 }, // right-4 top-4 (192px is w-48)
    dragHandle: '.drag-handle'
  });

  const { mesh, selectedMeshId, setSelectedMeshId } = useAppStore();

  const meshes = mesh ? [mesh] : []; // For now, just show the single mesh

  return (
    <div 
      ref={draggable.ref}
      className={`draggable-panel bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 w-48 ${
        draggable.isDragging ? 'shadow-2xl dragging' : ''
      }`}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scene</h4>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      <div className="space-y-1">
        {meshes.length === 0 ? (
          <div className="text-xs text-gray-400 italic">No meshes</div>
        ) : (
          meshes.map((m, index) => (
            <div
              key={(m as any).id || `mesh-${index}`}
              onClick={() => setSelectedMeshId((m as any).id || `mesh-${index}`)}
              className={`px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                selectedMeshId === ((m as any).id || `mesh-${index}`)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>{(m as any).name || `Mesh ${index + 1}`}</span>
              </div>
              <div className="text-xs text-gray-400 ml-5">
                {m.vertices().length} verts, {m.faces().length} faces
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <h5 className="text-xs font-medium text-gray-500 mb-2">Statistics</h5>
        {mesh && (
          <div className="text-xs text-gray-600 space-y-1">
            <div>Vertices: {mesh.vertices().length}</div>
            <div>Edges: {mesh.edges().length}</div>
            <div>Faces: {mesh.faces().length}</div>
          </div>
        )}
      </div>
    </div>
  );
};