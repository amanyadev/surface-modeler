import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { 
  ExtrudeCommand,
  RevolveCommand,
  FilletCommand,
  ChamferCommand,
  SubdivideEdgeCommand,
  DeleteEdgeCommand,
  SmoothCommand,
  vec3
} from '@half-edge/kernel';

export const ModelingOperationsPanel: React.FC = () => {
  const { 
    selectedFaceId,
    selectedEdgeId,
    mesh,
    executeCommand,
    undo,
    redo,
    commandHistory
  } = useAppStore();

  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [filletRadius, setFilletRadius] = useState(0.2);
  const [chamferDistance, setChamferDistance] = useState(0.1);
  const [subdivisions, setSubdivisions] = useState(1);
  const [smoothIterations, setSmoothIterations] = useState(1);
  const [smoothFactor, setSmoothFactor] = useState(0.5);

  const handleExtrude = () => {
    if (selectedFaceId) {
      const command = new ExtrudeCommand(selectedFaceId, extrudeDistance);
      executeCommand(command);
    }
  };

  const handleRevolve = () => {
    if (selectedFaceId) {
      const axis = vec3(0, 1, 0);
      const command = new RevolveCommand(selectedFaceId, axis, Math.PI * 2, 16);
      executeCommand(command);
    }
  };

  const handleFillet = () => {
    console.log('🔧 Fillet operation triggered:', { selectedEdgeId, filletRadius });
    if (selectedEdgeId) {
      const command = new FilletCommand(selectedEdgeId, filletRadius);
      console.log('🔧 Created FilletCommand:', command);
      executeCommand(command);
    } else {
      console.warn('🔧 Cannot fillet: No edge selected');
    }
  };

  const handleChamfer = () => {
    console.log('🔧 Chamfer operation triggered:', { selectedEdgeId, chamferDistance });
    if (selectedEdgeId) {
      const command = new ChamferCommand(selectedEdgeId, chamferDistance);
      console.log('🔧 Created ChamferCommand:', command);
      executeCommand(command);
    } else {
      console.warn('🔧 Cannot chamfer: No edge selected');
    }
  };

  const handleSubdivideEdge = () => {
    console.log('🔧 Subdivide operation triggered:', { selectedEdgeId, subdivisions });
    if (selectedEdgeId) {
      const command = new SubdivideEdgeCommand(selectedEdgeId, subdivisions);
      console.log('🔧 Created SubdivideEdgeCommand:', command);
      executeCommand(command);
    } else {
      console.warn('🔧 Cannot subdivide: No edge selected');
    }
  };

  const handleDeleteEdge = () => {
    if (selectedEdgeId) {
      const command = new DeleteEdgeCommand(selectedEdgeId);
      executeCommand(command);
    }
  };

  const handleSmooth = () => {
    if (mesh) {
      const command = new SmoothCommand(smoothIterations, smoothFactor);
      executeCommand(command);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-sm text-gray-300 mb-4">Advanced modeling operations</div>
      
      {/* Face Operations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
          <div className="w-5 h-5 bg-purple-600 rounded mr-2 flex items-center justify-center text-xs font-bold">F</div>
          Face Operations
        </h4>
        <div className="space-y-3">
          <button
            onClick={handleExtrude}
            disabled={!selectedFaceId}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedFaceId
                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-xs font-bold text-white">
                EX
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Extrude</div>
                <div className="text-xs opacity-80">Extend face along normal</div>
              </div>
            </div>
          </button>
          
          {selectedFaceId && (
            <div className="bg-gray-750 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-300 min-w-0">Distance:</label>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={extrudeDistance}
                  onChange={(e) => setExtrudeDistance(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 w-10 text-right">{extrudeDistance}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRevolve}
            disabled={!selectedFaceId}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedFaceId
                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-xs font-bold text-white">
                RV
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Revolve</div>
                <div className="text-xs opacity-80">Rotate face around axis</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Edge Operations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
          <div className="w-5 h-5 bg-blue-600 rounded mr-2 flex items-center justify-center text-xs font-bold">E</div>
          Edge Operations
        </h4>
        <div className="space-y-3">
          <button
            onClick={handleFillet}
            disabled={!selectedEdgeId}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedEdgeId
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">
                FL
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Fillet</div>
                <div className="text-xs opacity-80">Round edge corners</div>
              </div>
            </div>
          </button>
          
          {selectedEdgeId && (
            <div className="bg-gray-750 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-300 min-w-0">Radius:</label>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={filletRadius}
                  onChange={(e) => setFilletRadius(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 w-10 text-right">{filletRadius}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleChamfer}
            disabled={!selectedEdgeId}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedEdgeId
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">
                CH
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Chamfer</div>
                <div className="text-xs opacity-80">Bevel edge corners</div>
              </div>
            </div>
          </button>
          
          {selectedEdgeId && (
            <div className="bg-gray-750 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-300 min-w-0">Distance:</label>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={chamferDistance}
                  onChange={(e) => setChamferDistance(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 w-10 text-right">{chamferDistance}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubdivideEdge}
            disabled={!selectedEdgeId}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedEdgeId
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">
                SD
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Subdivide</div>
                <div className="text-xs opacity-80">Split edge into segments</div>
              </div>
            </div>
          </button>
          
          {selectedEdgeId && (
            <div className="bg-gray-750 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-300 min-w-0">Segments:</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={subdivisions}
                  onChange={(e) => setSubdivisions(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 w-8 text-right">{subdivisions}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleDeleteEdge}
            disabled={!selectedEdgeId}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedEdgeId
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-xs font-bold text-white">
                DL
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Delete Edge</div>
                <div className="text-xs opacity-80">Remove edge and merge faces</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mesh Operations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
          <div className="w-5 h-5 bg-green-600 rounded mr-2 flex items-center justify-center text-xs font-bold">M</div>
          Mesh Operations
        </h4>
        <div className="space-y-3">
          <button
            onClick={handleSmooth}
            disabled={!mesh || mesh.vertices().length === 0}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              mesh && mesh.vertices().length > 0
                ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-xs font-bold text-white">
                SM
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Smooth</div>
                <div className="text-xs opacity-80">Smooth entire mesh surface</div>
              </div>
            </div>
          </button>
          
          {mesh && mesh.vertices().length > 0 && (
            <div className="bg-gray-750 p-3 rounded-lg space-y-3">
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-300 min-w-0">Iterations:</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={smoothIterations}
                  onChange={(e) => setSmoothIterations(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 w-8 text-right">{smoothIterations}</span>
              </div>
              <div className="flex items-center space-x-3">
                <label className="text-xs text-gray-300 min-w-0">Strength:</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={smoothFactor}
                  onChange={(e) => setSmoothFactor(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-300 w-8 text-right">{smoothFactor}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="pt-4 border-t border-gray-600">
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
          <div className="w-5 h-5 bg-gray-600 rounded mr-2 flex items-center justify-center text-xs font-bold">H</div>
          History
        </h4>
        <div className="flex space-x-2">
          <button
            onClick={undo}
            disabled={!commandHistory.canUndo()}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm disabled:bg-gray-700 disabled:text-gray-500 hover:bg-gray-500 transition-colors"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={!commandHistory.canRedo()}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm disabled:bg-gray-700 disabled:text-gray-500 hover:bg-gray-500 transition-colors"
          >
            ↷ Redo
          </button>
        </div>
      </div>
    </div>
  );
};