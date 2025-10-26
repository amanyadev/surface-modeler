import React from 'react';
import { useAppStore } from '../../store';

export const SelectionInfoPanel: React.FC = () => {
  const { 
    mesh,
    selectionMode,
    selectedVertexId,
    selectedEdgeId,
    selectedFaceId
  } = useAppStore();

  const renderSelectionInfo = () => {
    if (!mesh) {
      return (
        <div className="text-center text-gray-400 py-8">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm">No mesh loaded</div>
        </div>
      );
    }

    // Vertex Selection
    if (selectionMode === 'vertex' && selectedVertexId) {
      const vertex = mesh.vertices ? mesh.vertices().find((v: any) => v.id === selectedVertexId) : null;
      if (vertex) {
        return (
          <div className="space-y-4">
            <div className="bg-green-600 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-white font-medium">
                <span>●</span>
                <span>Vertex {vertex.id}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-200 mb-2">Position</div>
                <div className="bg-gray-750 p-3 rounded text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-red-400 text-xs">X</div>
                      <div className="text-white">{vertex.pos?.x?.toFixed(3) || '0.000'}</div>
                    </div>
                    <div>
                      <div className="text-green-400 text-xs">Y</div>
                      <div className="text-white">{vertex.pos?.y?.toFixed(3) || '0.000'}</div>
                    </div>
                    <div>
                      <div className="text-blue-400 text-xs">Z</div>
                      <div className="text-white">{vertex.pos?.z?.toFixed(3) || '0.000'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-200 mb-2">Connected Edges</div>
                <div className="text-xs text-gray-400">
                  {vertex.halfEdge ? '1' : '0'} outgoing half-edge
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // Edge Selection
    if (selectionMode === 'edge' && selectedEdgeId) {
      const edge = mesh.edges ? mesh.edges().find((e: any) => e.id === selectedEdgeId) : null;
      if (edge) {
        return (
          <div className="space-y-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-white font-medium">
                <span>—</span>
                <span>Edge {edge.id}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-200 mb-2">Vertices</div>
                <div className="bg-gray-750 p-3 rounded text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source:</span>
                    <span className="text-white">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target:</span>
                    <span className="text-white">N/A</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-200 mb-2">Properties</div>
                <div className="bg-gray-750 p-3 rounded text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Length:</span>
                    <span className="text-white">N/A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // Face Selection
    if (selectionMode === 'face' && selectedFaceId) {
      const face = mesh.faces ? mesh.faces().find((f: any) => f.id === selectedFaceId) : null;
      if (face) {
        return (
          <div className="space-y-4">
            <div className="bg-purple-600 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-white font-medium">
                <span>▢</span>
                <span>Face {face.id}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-200 mb-2">Geometry</div>
                <div className="bg-gray-750 p-3 rounded text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vertices:</span>
                    <span className="text-white">{mesh.getFaceVertices ? mesh.getFaceVertices(face.id).length : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Edges:</span>
                    <span className="text-white">{mesh.getFaceVertices ? mesh.getFaceVertices(face.id).length : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Area:</span>
                    <span className="text-white">N/A</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-200 mb-2">Normal Vector</div>
                <div className="bg-gray-750 p-3 rounded text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-red-400 text-xs">X</div>
                      <div className="text-white">{face.normal?.x?.toFixed(3) || '0.000'}</div>
                    </div>
                    <div>
                      <div className="text-green-400 text-xs">Y</div>
                      <div className="text-white">{face.normal?.y?.toFixed(3) || '0.000'}</div>
                    </div>
                    <div>
                      <div className="text-blue-400 text-xs">Z</div>
                      <div className="text-white">{face.normal?.z?.toFixed(3) || '0.000'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // No Selection
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="text-3xl mb-2">👆</div>
        <div className="text-sm">Select a {selectionMode} to view details</div>
        <div className="text-xs mt-2 opacity-75">
          Current mode: {selectionMode}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="text-sm text-gray-300 mb-4">Selection details and properties</div>
      {renderSelectionInfo()}
    </div>
  );
};