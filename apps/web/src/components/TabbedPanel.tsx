import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';
import { GridSettingsPanel } from './Panels/GridSettingsPanel';
import { 
  createPlane, 
  createCube, 
  createCylinder, 
  HalfEdgeMesh,
  ExtrudeCommand,
  RevolveCommand,
  FilletCommand,
  ChamferCommand,
  vec3
} from '@half-edge/kernel';

interface TabbedPanelProps {
  onClose: () => void;
}

export const TabbedPanel: React.FC<TabbedPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'draw' | 'model' | 'select' | 'grid'>('create');
  
  const resizable = useResizable({
    initialPosition: { x: 16, y: 16 },
    initialSize: { width: 320, height: 400 },
    minWidth: 300,
    minHeight: 350,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { 
    setMesh,
    drawMode, 
    setDrawMode, 
    selectionMode,
    setSelectionMode,
    selectedFaceId,
    selectedEdgeId,
    sketchVertices, 
    finishSketch, 
    clearSketch,
    executeCommand,
    undo,
    redo,
    commandHistory
  } = useAppStore();

  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [filletRadius, setFilletRadius] = useState(0.2);
  const [chamferDistance, setChamferDistance] = useState(0.1);

  const tabs = [
    { key: 'create' as const, label: 'Create', icon: '⚡' },
    { key: 'draw' as const, label: 'Draw', icon: '✏️' },
    { key: 'model' as const, label: 'Model', icon: '🔧' },
    { key: 'select' as const, label: 'Select', icon: '🎯' },
    { key: 'grid' as const, label: 'Grid', icon: '⊞' },
  ];

  const primitives = [
    { name: 'Plane', action: () => setMesh(createPlane(2, 2) as HalfEdgeMesh) },
    { name: 'Cube', action: () => setMesh(createCube(2) as HalfEdgeMesh) },
    { name: 'Cylinder', action: () => setMesh(createCylinder(1, 2, 64) as HalfEdgeMesh) },
  ];

  const drawingTools = [
    { key: 'vertex' as const, name: 'Add Vertex', desc: 'Click to place vertices' },
    { key: 'sketch' as const, name: 'Sketch Face', desc: 'Connect vertices to create faces' },
    { key: 'quad' as const, name: 'Quick Quad', desc: 'Create rectangular faces' },
    { key: 'circle' as const, name: 'Quick Circle', desc: 'Create circular faces' }
  ];

  const selectionModes = [
    { key: 'vertex' as const, name: 'Vertex', icon: '●' },
    { key: 'edge' as const, name: 'Edge', icon: '—' },
    { key: 'face' as const, name: 'Face', icon: '▢' },
    { key: 'mesh' as const, name: 'Mesh', icon: '⬢' }
  ];

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
    if (selectedEdgeId) {
      const command = new FilletCommand(selectedEdgeId, filletRadius);
      executeCommand(command);
    }
  };

  const handleChamfer = () => {
    if (selectedEdgeId) {
      const command = new ChamferCommand(selectedEdgeId, chamferDistance);
      executeCommand(command);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 mb-3">Create basic geometric shapes</div>
            {primitives.map((primitive) => (
              <button
                key={primitive.name}
                onClick={primitive.action}
                className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="font-medium text-sm">{primitive.name}</div>
              </button>
            ))}
          </div>
        );

      case 'draw':
        return (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 mb-3">Interactive drawing tools</div>
            {drawingTools.map((tool) => (
              <button
                key={tool.key}
                onClick={() => setDrawMode(drawMode === tool.key ? 'none' : tool.key)}
                className={`w-full p-3 text-left rounded-lg border transition-all ${
                  drawMode === tool.key
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <div className="font-medium text-sm">{tool.name}</div>
                <div className={`text-xs ${drawMode === tool.key ? 'text-blue-100' : 'text-gray-500'}`}>
                  {tool.desc}
                </div>
              </button>
            ))}
            
            {drawMode === 'sketch' && sketchVertices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">
                  Sketch: {sketchVertices.length} vertices
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={finishSketch}
                    disabled={sketchVertices.length < 3}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-xs disabled:bg-gray-300"
                  >
                    Finish
                  </button>
                  <button
                    onClick={clearSketch}
                    className="px-3 py-2 bg-gray-500 text-white rounded text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'model':
        return (
          <div className="space-y-4">
            <div className="text-xs text-gray-600 mb-3">Modeling operations</div>
            
            {/* Face Operations */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Face Operations</h4>
              <div className="space-y-2">
                <button
                  onClick={handleExtrude}
                  disabled={!selectedFaceId}
                  className={`w-full p-2.5 rounded-lg text-left ${
                    selectedFaceId
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium text-sm">Extrude</div>
                  <div className="text-xs opacity-80">Extend face along normal</div>
                </button>
                
                {selectedFaceId && (
                  <div className="flex items-center space-x-2 px-2">
                    <label className="text-xs text-gray-600">Distance:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={extrudeDistance}
                      onChange={(e) => setExtrudeDistance(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-8">{extrudeDistance}</span>
                  </div>
                )}

                <button
                  onClick={handleRevolve}
                  disabled={!selectedFaceId}
                  className={`w-full p-2.5 rounded-lg text-left ${
                    selectedFaceId
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium text-sm">Revolve</div>
                  <div className="text-xs opacity-80">Rotate face around axis</div>
                </button>
              </div>
            </div>

            {/* Edge Operations */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Edge Operations</h4>
              <div className="space-y-2">
                <button
                  onClick={handleFillet}
                  disabled={!selectedEdgeId}
                  className={`w-full p-2.5 rounded-lg text-left ${
                    selectedEdgeId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium text-sm">Fillet</div>
                  <div className="text-xs opacity-80">Round edge corners</div>
                </button>
                
                {selectedEdgeId && (
                  <div className="flex items-center space-x-2 px-2">
                    <label className="text-xs text-gray-600">Radius:</label>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={filletRadius}
                      onChange={(e) => setFilletRadius(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-8">{filletRadius}</span>
                  </div>
                )}

                <button
                  onClick={handleChamfer}
                  disabled={!selectedEdgeId}
                  className={`w-full p-2.5 rounded-lg text-left ${
                    selectedEdgeId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-medium text-sm">Chamfer</div>
                  <div className="text-xs opacity-80">Bevel edge corners</div>
                </button>
                
                {selectedEdgeId && (
                  <div className="flex items-center space-x-2 px-2">
                    <label className="text-xs text-gray-600">Distance:</label>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={chamferDistance}
                      onChange={(e) => setChamferDistance(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600 w-8">{chamferDistance}</span>
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={undo}
                  disabled={!commandHistory.canUndo()}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-xs disabled:bg-gray-300"
                >
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!commandHistory.canRedo()}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-xs disabled:bg-gray-300"
                >
                  Redo
                </button>
              </div>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 mb-3">Selection modes</div>
            {selectionModes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setSelectionMode(mode.key)}
                className={`w-full flex items-center p-3 rounded-lg transition-all ${
                  selectionMode === mode.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="mr-3 text-lg">{mode.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{mode.name}</div>
                  <div className={`text-xs ${
                    selectionMode === mode.key ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    Select {mode.name.toLowerCase()} elements
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      case 'grid':
        return <GridSettingsPanel />;

      default:
        return null;
    }
  };

  return (
    <div 
      ref={resizable.ref}
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header with tabs and close button */}
      <div className="drag-handle bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between p-3 pb-0">
          <h3 className="text-sm font-semibold text-gray-800">CAD Tools</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
          >
            ✕
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Resize handle */}
      <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};