import React from 'react';
import { useAppStore } from '../../store';

export const HierarchyPanel: React.FC = () => {
  const { mesh, selectedVertexId, selectedEdgeId, selectedFaceId } = useAppStore();

  const renderMeshHierarchy = () => {
    if (!mesh) {
      return (
        <div className="text-center text-gray-400 py-8">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-sm">No mesh loaded</div>
        </div>
      );
    }

    const vertices = mesh.vertices ? mesh.vertices() : [];
    const edges = mesh.edges ? mesh.edges() : [];
    const faces = mesh.faces ? mesh.faces() : [];

    return (
      <div className="space-y-4">
        {/* Mesh Info */}
        <div className="bg-gray-750 p-3 rounded-lg">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-200 mb-2">
            <span>⬢</span>
            <span>Mesh Statistics</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-green-400 font-medium">{vertices.length}</div>
              <div className="text-gray-400">Vertices</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-medium">{edges.length}</div>
              <div className="text-gray-400">Edges</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-medium">{faces.length}</div>
              <div className="text-gray-400">Faces</div>
            </div>
          </div>
        </div>

        {/* Vertices */}
        <div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-200 mb-2">
            <span>●</span>
            <span>Vertices ({vertices.length})</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {vertices.slice(0, 10).map((vertex: any) => (
              <div
                key={vertex.id}
                className={`text-xs p-2 rounded flex justify-between items-center ${
                  selectedVertexId === vertex.id 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span>Vertex {vertex.id}</span>
                <span className="text-xs opacity-75">
                  ({vertex.pos?.x?.toFixed(1) || '0'}, {vertex.pos?.y?.toFixed(1) || '0'}, {vertex.pos?.z?.toFixed(1) || '0'})
                </span>
              </div>
            ))}
            {vertices.length > 10 && (
              <div className="text-xs text-gray-500 text-center py-1">
                ... and {vertices.length - 10} more
              </div>
            )}
          </div>
        </div>

        {/* Edges */}
        <div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-200 mb-2">
            <span>—</span>
            <span>Edges ({edges.length})</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {edges.slice(0, 10).map((edge: any) => (
              <div
                key={edge.id}
                className={`text-xs p-2 rounded flex justify-between items-center ${
                  selectedEdgeId === edge.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span>Edge {edge.id}</span>
                <span className="text-xs opacity-75">
                  {edge.sourceVertex?.id} → {edge.targetVertex?.id}
                </span>
              </div>
            ))}
            {edges.length > 10 && (
              <div className="text-xs text-gray-500 text-center py-1">
                ... and {edges.length - 10} more
              </div>
            )}
          </div>
        </div>

        {/* Faces */}
        <div>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-200 mb-2">
            <span>▢</span>
            <span>Faces ({faces.length})</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {faces.slice(0, 10).map((face: any) => (
              <div
                key={face.id}
                className={`text-xs p-2 rounded flex justify-between items-center ${
                  selectedFaceId === face.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span>Face {face.id}</span>
                <span className="text-xs opacity-75">
                  {mesh.getFaceVertices ? mesh.getFaceVertices(face.id).length : 0} vertices
                </span>
              </div>
            ))}
            {faces.length > 10 && (
              <div className="text-xs text-gray-500 text-center py-1">
                ... and {faces.length - 10} more
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="text-sm text-gray-300 mb-4">Mesh structure and elements</div>
      {renderMeshHierarchy()}
    </div>
  );
};