import React from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';

export const SelectionInfo: React.FC = () => {
  const resizable = useResizable({
    initialPosition: { x: window.innerWidth - 288 - 16, y: 416 }, // right-4 (16px from right), below HierarchyPanel
    initialSize: { width: 288, height: 400 },
    minWidth: 250,
    minHeight: 200,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { 
    mesh,
    selectionMode,
    selectedVertexId, 
    selectedEdgeId, 
    selectedFaceId, 
    selectedMeshId,
    selectedFaceIds 
  } = useAppStore();

  // Get selected object details
  const getSelectionDetails = () => {
    if (!mesh) return null;

    if (selectedVertexId) {
      const vertex = mesh.getVertex(selectedVertexId);
      if (vertex) {
        return {
          type: 'Vertex',
          id: selectedVertexId,
          position: vertex.pos,
          details: {
            'X': vertex.pos.x.toFixed(3),
            'Y': vertex.pos.y.toFixed(3),
            'Z': vertex.pos.z.toFixed(3),
          }
        };
      }
    }

    if (selectedEdgeId) {
      const edge = mesh.getEdge(selectedEdgeId);
      if (edge) {
        return {
          type: 'Edge',
          id: selectedEdgeId,
          details: {
            'Half-Edge': edge.halfEdge,
          }
        };
      }
    }

    if (selectedFaceId) {
      const face = mesh.getFace(selectedFaceId);
      const faceVertices = (mesh as any).getFaceVertices(selectedFaceId);
      if (face && faceVertices) {
        // Calculate face center
        const center = faceVertices.reduce(
          (acc: {x: number, y: number, z: number}, v: any) => ({
            x: acc.x + v.pos.x / faceVertices.length,
            y: acc.y + v.pos.y / faceVertices.length,
            z: acc.z + v.pos.z / faceVertices.length,
          }),
          { x: 0, y: 0, z: 0 }
        );

        return {
          type: 'Face',
          id: selectedFaceId,
          position: center,
          details: {
            'Center X': center.x.toFixed(3),
            'Center Y': center.y.toFixed(3),
            'Center Z': center.z.toFixed(3),
            'Vertices': faceVertices.length.toString(),
            'Normal X': face.normal?.x.toFixed(3) || 'N/A',
            'Normal Y': face.normal?.y.toFixed(3) || 'N/A',
            'Normal Z': face.normal?.z.toFixed(3) || 'N/A',
          }
        };
      }
    }

    if (selectedMeshId) {
      // Calculate bounding box manually if getBoundingBox doesn't exist
      const vertices = mesh.vertices();
      let bbox = null;
      let center = { x: 0, y: 0, z: 0 };
      
      if (vertices.length > 0) {
        const first = vertices[0].pos;
        const min = { ...first };
        const max = { ...first };
        
        vertices.forEach(vertex => {
          min.x = Math.min(min.x, vertex.pos.x);
          min.y = Math.min(min.y, vertex.pos.y);
          min.z = Math.min(min.z, vertex.pos.z);
          max.x = Math.max(max.x, vertex.pos.x);
          max.y = Math.max(max.y, vertex.pos.y);
          max.z = Math.max(max.z, vertex.pos.z);
        });
        
        bbox = { min, max };
        center = {
          x: (min.x + max.x) / 2,
          y: (min.y + max.y) / 2,
          z: (min.z + max.z) / 2,
        };
      }
      
      return {
        type: 'Mesh',
        id: selectedMeshId,
        position: center,
        details: {
          'Center X': center.x.toFixed(3),
          'Center Y': center.y.toFixed(3),
          'Center Z': center.z.toFixed(3),
          'Vertices': mesh.vertices().length.toString(),
          'Faces': mesh.faces().length.toString(),
          'Edges': mesh.edges().length.toString(),
          'Min X': bbox?.min.x.toFixed(3) || 'N/A',
          'Min Y': bbox?.min.y.toFixed(3) || 'N/A',
          'Min Z': bbox?.min.z.toFixed(3) || 'N/A',
          'Max X': bbox?.max.x.toFixed(3) || 'N/A',
          'Max Y': bbox?.max.y.toFixed(3) || 'N/A',
          'Max Z': bbox?.max.z.toFixed(3) || 'N/A',
        }
      };
    }

    return null;
  };

  const selectionDetails = getSelectionDetails();

  // Show mesh stats even when nothing is selected
  const getMeshStats = () => {
    if (!mesh) return null;
    
    return {
      vertices: mesh.vertices().length,
      faces: mesh.faces().length,
      edges: mesh.edges().length,
    };
  };

  const meshStats = getMeshStats();

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
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selection Info</h4>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Current Selection Mode */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">Current Mode</h5>
          <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
            <span className="font-medium text-blue-700">
              {selectionMode.charAt(0).toUpperCase() + selectionMode.slice(1)} Selection
            </span>
          </div>
        </div>

        {/* Selection Details */}
        {selectionDetails ? (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2">Selected {selectionDetails.type}</h5>
            <div className="bg-gray-50 rounded p-3 space-y-2">
              <div className="text-xs">
                <span className="font-medium text-gray-700">ID:</span>
                <span className="ml-2 font-mono text-gray-600">{selectionDetails.id}</span>
              </div>
              
              {Object.entries(selectionDetails.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2">No Selection</h5>
            <div className="text-xs text-gray-500 italic">
              Select a {selectionMode} to view its properties
            </div>
          </div>
        )}

        {/* Multiple Face Selection */}
        {selectedFaceIds.length > 1 && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2">Multiple Faces Selected</h5>
            <div className="bg-blue-50 rounded p-2">
              <div className="text-xs text-blue-700">
                {selectedFaceIds.length} faces selected
              </div>
            </div>
          </div>
        )}

        {/* Mesh Statistics */}
        {meshStats && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2">Mesh Statistics</h5>
            <div className="bg-green-50 rounded p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-700">Vertices:</span>
                <span className="font-mono text-green-800">{meshStats.vertices}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-700">Faces:</span>
                <span className="font-mono text-green-800">{meshStats.faces}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-700">Edges:</span>
                <span className="font-mono text-green-800">{meshStats.edges}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-200">
          <h5 className="text-xs font-medium text-gray-600 mb-2">Quick Actions</h5>
          <div className="grid grid-cols-2 gap-1">
            <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
              Copy ID
            </button>
            <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
              Copy Coords
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