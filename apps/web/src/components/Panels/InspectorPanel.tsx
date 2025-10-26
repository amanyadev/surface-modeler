import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { VertexTransformCommand, Vec3 } from '@half-edge/kernel';

export const InspectorPanel: React.FC = () => {
  const { 
    mesh,
    selectedVertexId,
    selectedEdgeId,
    selectedFaceId,
    selectedMeshId,
    executeCommand
  } = useAppStore();

  const [editMode, setEditMode] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });

  // Update position when selection changes
  useEffect(() => {
    if (selectedVertexId && mesh) {
      const vertex = mesh.vertices().find((v: any) => v.id === selectedVertexId);
      if (vertex) {
        setPosition({
          x: vertex.pos.x,
          y: vertex.pos.y,
          z: vertex.pos.z
        });
      }
    } else if (selectedEdgeId && mesh) {
      // For edge, show midpoint position
      const edge = mesh.edges().find((e: any) => e.id === selectedEdgeId);
      if (edge) {
        // Get the half-edge to find vertices
        const halfEdge = mesh.getHalfEdge(edge.halfEdge);
        if (halfEdge && halfEdge.twin) {
          const twinHalfEdge = mesh.getHalfEdge(halfEdge.twin);
          if (twinHalfEdge) {
            const vertex1 = mesh.getVertex(halfEdge.vertex);
            const vertex2 = mesh.getVertex(twinHalfEdge.vertex);
            if (vertex1 && vertex2) {
              setPosition({
                x: (vertex1.pos.x + vertex2.pos.x) / 2,
                y: (vertex1.pos.y + vertex2.pos.y) / 2,
                z: (vertex1.pos.z + vertex2.pos.z) / 2
              });
            }
          }
        }
      }
    } else if (selectedFaceId && mesh) {
      // For face, show center position
      const faceVertices = mesh.getFaceVertices(selectedFaceId);
      if (faceVertices.length > 0) {
        const center = faceVertices.reduce(
          (acc, vertex) => ({
            x: acc.x + vertex.pos.x,
            y: acc.y + vertex.pos.y,
            z: acc.z + vertex.pos.z
          }),
          { x: 0, y: 0, z: 0 }
        );
        
        setPosition({
          x: center.x / faceVertices.length,
          y: center.y / faceVertices.length,
          z: center.z / faceVertices.length
        });
      }
    }
  }, [selectedVertexId, selectedEdgeId, selectedFaceId, mesh]);

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setPosition(prev => ({ ...prev, [axis]: value }));
  };

  const applyChanges = () => {
    if (selectedVertexId && mesh) {
      const newPos: Vec3 = { x: position.x, y: position.y, z: position.z };
      const command = new VertexTransformCommand(selectedVertexId, newPos);
      executeCommand(command);
      setEditMode(false);
    }
  };

  const resetChanges = () => {
    // Reset to original position
    if (selectedVertexId && mesh) {
      const vertex = mesh.vertices().find((v: any) => v.id === selectedVertexId);
      if (vertex) {
        setPosition({
          x: vertex.pos.x,
          y: vertex.pos.y,
          z: vertex.pos.z
        });
      }
    }
    setEditMode(false);
  };

  const renderPositionControls = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-200">Position</h4>
          <div className="flex space-x-1">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={applyChanges}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={resetChanges}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {['x', 'y', 'z'].map((axis) => (
          <div key={axis} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
              axis === 'x' ? 'bg-red-500 text-white' :
              axis === 'y' ? 'bg-green-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {axis.toUpperCase()}
            </div>
            <input
              type="number"
              value={position[axis as keyof typeof position].toFixed(3)}
              onChange={(e) => handlePositionChange(axis as 'x' | 'y' | 'z', parseFloat(e.target.value) || 0)}
              disabled={!editMode}
              step="0.001"
              className={`flex-1 px-2 py-1 text-xs rounded border ${
                editMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:outline-none' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
            <input
              type="range"
              min="-5"
              max="5"
              step="0.01"
              value={position[axis as keyof typeof position]}
              onChange={(e) => handlePositionChange(axis as 'x' | 'y' | 'z', parseFloat(e.target.value))}
              disabled={!editMode}
              className={`w-16 ${editMode ? '' : 'opacity-50 cursor-not-allowed'}`}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderTransformControls = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-200 mb-2">Rotation</h4>
          {['x', 'y', 'z'].map((axis) => (
            <div key={axis} className="flex items-center space-x-2 mb-2">
              <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                axis === 'x' ? 'bg-red-500 text-white' :
                axis === 'y' ? 'bg-green-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {axis.toUpperCase()}
              </div>
              <input
                type="number"
                value={rotation[axis as keyof typeof rotation].toFixed(1)}
                onChange={(e) => setRotation(prev => ({ ...prev, [axis]: parseFloat(e.target.value) || 0 }))}
                step="1"
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
                placeholder="0.0"
              />
              <span className="text-xs text-gray-400">°</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-200 mb-2">Scale</h4>
          {['x', 'y', 'z'].map((axis) => (
            <div key={axis} className="flex items-center space-x-2 mb-2">
              <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                axis === 'x' ? 'bg-red-500 text-white' :
                axis === 'y' ? 'bg-green-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {axis.toUpperCase()}
              </div>
              <input
                type="number"
                value={scale[axis as keyof typeof scale].toFixed(2)}
                onChange={(e) => setScale(prev => ({ ...prev, [axis]: parseFloat(e.target.value) || 1 }))}
                step="0.01"
                min="0.01"
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-white rounded focus:border-blue-500 focus:outline-none"
                placeholder="1.00"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getSelectionInfo = () => {
    if (selectedVertexId) return { type: 'Vertex', id: selectedVertexId };
    if (selectedEdgeId) return { type: 'Edge', id: selectedEdgeId };
    if (selectedFaceId) return { type: 'Face', id: selectedFaceId };
    if (selectedMeshId) return { type: 'Mesh', id: selectedMeshId };
    return null;
  };

  const selectionInfo = getSelectionInfo();

  if (!selectionInfo) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-400 py-8">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="text-lg font-bold">I</div>
          </div>
          <div className="text-sm">Inspector</div>
          <div className="text-xs mt-2 opacity-75">
            Select an element to edit properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-5 h-5 bg-orange-600 rounded mr-2 flex items-center justify-center text-xs font-bold">
          I
        </div>
        <div>
          <div className="text-sm font-medium text-gray-200">Inspector</div>
          <div className="text-xs text-gray-400">Edit element properties</div>
        </div>
      </div>

      {/* Selection Info */}
      <div className="bg-gray-750 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-200">{selectionInfo.type} Selected</div>
          <div className="text-xs text-gray-400 font-mono">
            {selectionInfo.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Position Controls (for vertex selection) */}
      {selectedVertexId && renderPositionControls()}

      {/* Transform Controls (for future use) */}
      {(selectedEdgeId || selectedFaceId || selectedMeshId) && renderTransformControls()}

      {/* Quick Actions */}
      <div className="pt-3 border-t border-gray-600">
        <h4 className="text-sm font-medium text-gray-200 mb-2">Quick Actions</h4>
        <div className="space-y-2">
          {selectedVertexId && (
            <button className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
              Delete Vertex
            </button>
          )}
          {selectedEdgeId && (
            <>
              <button className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
                Subdivide Edge
              </button>
              <button className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
                Delete Edge
              </button>
            </>
          )}
          {selectedFaceId && (
            <>
              <button className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
                Extrude Face
              </button>
              <button className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
                Delete Face
              </button>
            </>
          )}
        </div>
      </div>

      {/* Material Properties */}
      <div className="pt-3 border-t border-gray-600">
        <h4 className="text-sm font-medium text-gray-200 mb-2">Material</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Color</label>
            <input
              type="color"
              defaultValue="#4285f4"
              className="w-8 h-6 rounded border border-gray-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="1"
              className="w-16"
            />
          </div>
        </div>
      </div>
    </div>
  );
};