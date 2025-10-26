import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useResizable } from '../hooks/useResizable';
import { 
  createPlane, 
  createCube, 
  createCylinder,
  ExtrudeCommand,
  RevolveCommand,
  SweepCommand,
  FlipNormalsCommand,
  FilletCommand,
  ChamferCommand,
  LoftCommand,
  ShellCommand,
  MirrorCommand,
  LinearPatternCommand,
  BooleanUnionCommand,
  BooleanDifferenceCommand,
  SubdivideCommand,
  SplitEdgeCommand,
  WeldVerticesCommand,
  CollapseEdgeCommand,
  vec3
} from '@half-edge/kernel';

export const Toolbar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'primitives' | 'modeling' | 'transform' | 'utilities'>('primitives');
  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [filletRadius, setFilletRadius] = useState(0.2);
  const [chamferDistance, setChamferDistance] = useState(0.1);
  const [shellThickness, setShellThickness] = useState(0.1);
  
  const resizable = useResizable({
    initialPosition: { x: 16, y: 16 }, // top-4 left-4 (16px)
    initialSize: { width: 320, height: 650 },
    minWidth: 280,
    minHeight: 400,
    dragHandle: '.drag-handle',
    resizeHandle: '.resize-handle'
  });

  const { 
    setMesh,
    selectionMode,
    setSelectionMode,
    drawMode,
    setDrawMode,
    sketchVertices,
    finishSketch,
    clearSketch,
    selectedFaceId,
    selectedFaceIds,
    selectedVertexId,
    selectedEdgeId,
    executeCommand, 
    undo, 
    redo, 
    commandHistory,
    mesh
  } = useAppStore();

  const handleCreatePrimitive = (type: 'plane' | 'cube' | 'cylinder') => {
    let newMesh;
    switch (type) {
      case 'plane':
        newMesh = createPlane(2, 2);
        break;
      case 'cube':
        newMesh = createCube(2);
        break;
      case 'cylinder':
        newMesh = createCylinder(1, 2, 8);
        break;
    }
    setMesh(newMesh as any);
  };

  // Basic Operations
  const handleExtrude = () => {
    if (selectedFaceId) {
      const command = new ExtrudeCommand(selectedFaceId, extrudeDistance);
      executeCommand(command);
    }
  };

  const handleRevolve = () => {
    if (selectedFaceId) {
      const axis = vec3(0, 1, 0); // Y-axis
      const command = new RevolveCommand(selectedFaceId, axis, Math.PI * 2, 16);
      executeCommand(command);
    }
  };

  const handleSweep = () => {
    if (selectedFaceId) {
      // Create a simple linear sweep path
      const path = [
        vec3(0, 0, 0),
        vec3(1, 0, 0),
        vec3(2, 1, 0),
        vec3(3, 1, 0)
      ];
      const command = new SweepCommand(selectedFaceId, path);
      executeCommand(command);
    }
  };

  const handleLoft = () => {
    if (selectedFaceIds.length >= 2) {
      // Create sample profiles for loft
      const profiles = [
        [vec3(-1, 0, -1), vec3(1, 0, -1), vec3(1, 0, 1), vec3(-1, 0, 1)],
        [vec3(-0.5, 2, -0.5), vec3(0.5, 2, -0.5), vec3(0.5, 2, 0.5), vec3(-0.5, 2, 0.5)]
      ];
      const command = new LoftCommand(profiles);
      executeCommand(command);
    }
  };

  // Edge Operations
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

  const handleSplitEdge = () => {
    if (selectedEdgeId) {
      const command = new SplitEdgeCommand(selectedEdgeId, 0.5);
      executeCommand(command);
    }
  };

  const handleCollapseEdge = () => {
    if (selectedEdgeId) {
      const command = new CollapseEdgeCommand(selectedEdgeId);
      executeCommand(command);
    }
  };

  // Face Operations
  const handleFlipNormals = () => {
    if (selectedFaceId) {
      const command = new FlipNormalsCommand(selectedFaceId);
      executeCommand(command);
    }
  };

  const handleSubdivide = () => {
    if (selectedFaceId) {
      const command = new SubdivideCommand(selectedFaceId);
      executeCommand(command);
    }
  };

  // Mesh Operations
  const handleShell = () => {
    if (mesh) {
      const command = new ShellCommand(shellThickness);
      executeCommand(command);
    }
  };

  const handleMirror = () => {
    if (mesh) {
      const plane = {
        point: vec3(0, 0, 0),
        normal: vec3(1, 0, 0) // Mirror across YZ plane
      };
      const command = new MirrorCommand(plane);
      executeCommand(command);
    }
  };

  const handleLinearPattern = () => {
    if (mesh) {
      const direction = vec3(2, 0, 0); // Pattern along X axis
      const command = new LinearPatternCommand(direction, 3, 2);
      executeCommand(command);
    }
  };

  // Boolean Operations
  const handleBooleanUnion = () => {
    if (mesh) {
      // Create a second mesh for union
      const secondMesh = createCube(1);
      const command = new BooleanUnionCommand(secondMesh as any);
      executeCommand(command);
    }
  };

  const handleBooleanDifference = () => {
    if (mesh) {
      // Create a second mesh for difference
      const secondMesh = createCube(1);
      const command = new BooleanDifferenceCommand(secondMesh as any);
      executeCommand(command);
    }
  };

  const handleWeldVertices = () => {
    if (selectedVertexId && mesh) {
      // Find nearby vertices to weld
      const vertices = mesh.vertices();
      const selectedVertex = mesh.getVertex(selectedVertexId);
      if (selectedVertex) {
        const nearbyVertices = vertices
          .filter(v => v.id !== selectedVertexId)
          .filter(v => {
            const dx = v.pos.x - selectedVertex.pos.x;
            const dy = v.pos.y - selectedVertex.pos.y;
            const dz = v.pos.z - selectedVertex.pos.z;
            return Math.sqrt(dx*dx + dy*dy + dz*dz) < 0.1;
          })
          .map(v => v.id);
        
        if (nearbyVertices.length > 0) {
          const command = new WeldVerticesCommand([selectedVertexId, ...nearbyVertices], 0.1);
          executeCommand(command);
        }
      }
    }
  };

  const tabs = [
    { id: 'primitives' as const, label: 'Create', icon: '□' },
    { id: 'modeling' as const, label: 'Model', icon: '⬆' },
    { id: 'transform' as const, label: 'Transform', icon: '↻' },
    { id: 'utilities' as const, label: 'Utils', icon: '⚙' }
  ];

  return (
    <div 
      ref={resizable.ref}
      className={`draggable-panel relative bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 ${
        resizable.isDragging || resizable.isResizing ? 'shadow-2xl dragging' : ''
      }`}
      style={{ overflow: 'hidden' }}
    >
      {/* Drag handle */}
      <div className="drag-handle flex items-center justify-between p-4 border-b border-gray-100 cursor-grab active:cursor-grabbing">
        <h3 className="text-sm font-semibold text-gray-800">CAD Tools</h3>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        
        {/* Selection Mode - Always visible */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Selection Mode</h4>
          <div className="grid grid-cols-4 gap-1">
            {(['vertex', 'edge', 'face', 'mesh'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectionMode(mode)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectionMode === mode
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Primitives Tab */}
        {activeTab === 'primitives' && (
          <>
            {/* Primitive Creation */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Primitives</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCreatePrimitive('plane')}
                  className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-all"
                >
                  Plane
                </button>
                <button
                  onClick={() => handleCreatePrimitive('cube')}
                  className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-all"
                >
                  Cube
                </button>
                <button
                  onClick={() => handleCreatePrimitive('cylinder')}
                  className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-all"
                >
                  Cylinder
                </button>
              </div>
            </div>

            {/* Drawing Tools */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Drawing Tools</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setDrawMode(drawMode === 'vertex' ? 'none' : 'vertex')}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    drawMode === 'vertex'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Vertex
                </button>
                <button
                  onClick={() => setDrawMode(drawMode === 'sketch' ? 'none' : 'sketch')}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    drawMode === 'sketch'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Face
                </button>
                <button
                  onClick={() => setDrawMode(drawMode === 'quad' ? 'none' : 'quad')}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    drawMode === 'quad'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Quad
                </button>
                <button
                  onClick={() => setDrawMode(drawMode === 'circle' ? 'none' : 'circle')}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    drawMode === 'circle'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Circle
                </button>
              </div>
              
              {drawMode === 'sketch' && sketchVertices.length > 0 && (
                <div className="mt-2 space-y-1">
                  <button
                    onClick={finishSketch}
                    disabled={sketchVertices.length < 3}
                    className={`w-full px-2 py-1.5 rounded text-xs font-medium ${
                      sketchVertices.length >= 3
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Finish Face ({sketchVertices.length})
                  </button>
                  <button
                    onClick={clearSketch}
                    className="w-full px-2 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modeling Tab */}
        {activeTab === 'modeling' && (
          <>
            {/* Face Operations */}
            {selectedFaceId && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Face Operations</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExtrude}
                      className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium"
                    >
                      Extrude
                    </button>
                    <input
                      type="number"
                      value={extrudeDistance}
                      onChange={(e) => setExtrudeDistance(parseFloat(e.target.value) || 0.5)}
                      className="w-16 px-1 py-1 text-xs border rounded"
                      step="0.1"
                      min="0.1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleRevolve}
                      className="px-2 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded text-xs font-medium"
                    >
                      Revolve
                    </button>
                    <button
                      onClick={handleSweep}
                      className="px-2 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded text-xs font-medium"
                    >
                      Sweep
                    </button>
                    <button
                      onClick={handleFlipNormals}
                      className="px-2 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium"
                    >
                      Flip
                    </button>
                    <button
                      onClick={handleSubdivide}
                      className="px-2 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium"
                    >
                      Subdivide
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edge Operations */}
            {selectedEdgeId && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Edge Operations</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleFillet}
                      className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium"
                    >
                      Fillet
                    </button>
                    <input
                      type="number"
                      value={filletRadius}
                      onChange={(e) => setFilletRadius(parseFloat(e.target.value) || 0.2)}
                      className="w-16 px-1 py-1 text-xs border rounded"
                      step="0.05"
                      min="0.05"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleChamfer}
                      className="flex-1 px-2 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-xs font-medium"
                    >
                      Chamfer
                    </button>
                    <input
                      type="number"
                      value={chamferDistance}
                      onChange={(e) => setChamferDistance(parseFloat(e.target.value) || 0.1)}
                      className="w-16 px-1 py-1 text-xs border rounded"
                      step="0.05"
                      min="0.05"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSplitEdge}
                      className="px-2 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium"
                    >
                      Split
                    </button>
                    <button
                      onClick={handleCollapseEdge}
                      className="px-2 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Faces Operations */}
            {selectedFaceIds.length >= 2 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Multi-Face Operations</h4>
                <button
                  onClick={handleLoft}
                  className="w-full px-2 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded text-xs font-medium"
                >
                  Loft ({selectedFaceIds.length} faces)
                </button>
              </div>
            )}

            {/* Boolean Operations */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Boolean Operations</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleBooleanUnion}
                  className="px-2 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium"
                >
                  Union
                </button>
                <button
                  onClick={handleBooleanDifference}
                  className="px-2 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                >
                  Subtract
                </button>
              </div>
            </div>
          </>
        )}

        {/* Transform Tab */}
        {activeTab === 'transform' && (
          <>
            {/* Mesh Operations */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Mesh Operations</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShell}
                    className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium"
                  >
                    Shell
                  </button>
                  <input
                    type="number"
                    value={shellThickness}
                    onChange={(e) => setShellThickness(parseFloat(e.target.value) || 0.1)}
                    className="w-16 px-1 py-1 text-xs border rounded"
                    step="0.05"
                    min="0.05"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMirror}
                    className="px-2 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded text-xs font-medium"
                  >
                    Mirror
                  </button>
                  <button
                    onClick={handleLinearPattern}
                    className="px-2 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded text-xs font-medium"
                  >
                    Pattern
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Utilities Tab */}
        {activeTab === 'utilities' && (
          <>
            {/* Vertex Operations */}
            {selectedVertexId && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Vertex Operations</h4>
                <button
                  onClick={handleWeldVertices}
                  className="w-full px-2 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium"
                >
                  Weld Nearby
                </button>
              </div>
            )}

            {/* History */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">History</h4>
              <div className="flex space-x-2">
                <button
                  onClick={undo}
                  disabled={!commandHistory.canUndo()}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                    commandHistory.canUndo()
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!commandHistory.canRedo()}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                    commandHistory.canRedo()
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ↷ Redo
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Resize handle */}
      <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
      </div>
    </div>
  );
};