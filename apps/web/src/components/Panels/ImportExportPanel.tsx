import React, { useRef } from 'react';
import { useAppStore } from '../../store';
import { 
  loadMeshFile, 
  exportAsOBJ, 
  exportAsGLTF, 
  exportAsGLB 
} from '../../utils/meshConversion';

export const ImportExportPanel: React.FC = () => {
  const { mesh, setMesh } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('📁 Loading file:', file.name);
      const loadedMesh = await loadMeshFile(file);
      
      if (loadedMesh) {
        setMesh(loadedMesh);
        console.log('✅ Mesh loaded successfully');
      } else {
        console.error('❌ Failed to load mesh from file');
        alert('Failed to load mesh from file. Please check the file format.');
      }
    } catch (error) {
      console.error('❌ Error loading file:', error);
      alert(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportOBJ = () => {
    if (!mesh) {
      alert('No mesh to export');
      return;
    }
    exportAsOBJ(mesh, 'exported_mesh.obj');
  };

  const handleExportGLTF = () => {
    if (!mesh) {
      alert('No mesh to export');
      return;
    }
    exportAsGLTF(mesh, 'exported_mesh.gltf');
  };

  const handleExportGLB = () => {
    if (!mesh) {
      alert('No mesh to export');
      return;
    }
    exportAsGLB(mesh, 'exported_mesh.glb');
  };

  const importFormats = [
    { ext: 'OBJ', desc: 'Wavefront OBJ files' },
    { ext: 'GLTF', desc: 'GL Transmission Format' },
    { ext: 'GLB', desc: 'Binary GLTF' }
  ];

  const exportFormats = [
    { 
      name: 'OBJ', 
      desc: 'Wavefront OBJ format',
      action: handleExportOBJ,
      icon: 'OBJ'
    },
    { 
      name: 'GLTF', 
      desc: 'GL Transmission Format (JSON)',
      action: handleExportGLTF,
      icon: 'GTF'
    },
    { 
      name: 'GLB', 
      desc: 'Binary GLTF format',
      action: handleExportGLB,
      icon: 'GLB'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="text-sm text-gray-300 mb-4">Import and export 3D files</div>
      
      {/* Import Section */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
          <div className="w-5 h-5 bg-blue-600 rounded mr-2 flex items-center justify-center text-xs font-bold">↑</div>
          Import
        </h4>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".obj,.gltf,.glb"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
        
        <button
          onClick={handleImportClick}
          className="w-full p-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg mb-3"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">
              📁
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">Import Mesh</div>
              <div className="text-xs opacity-80">Load OBJ, GLTF, or GLB files</div>
            </div>
          </div>
        </button>
        
        <div className="bg-gray-750 p-3 rounded-lg">
          <div className="text-xs text-gray-300 mb-2">Supported formats:</div>
          {importFormats.map((format) => (
            <div key={format.ext} className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="font-mono">.{format.ext.toLowerCase()}</span>
              <span>{format.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Section */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
          <div className="w-5 h-5 bg-green-600 rounded mr-2 flex items-center justify-center text-xs font-bold">↓</div>
          Export
        </h4>
        
        <div className="space-y-2">
          {exportFormats.map((format) => (
            <button
              key={format.name}
              onClick={format.action}
              disabled={!mesh}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                mesh
                  ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-xs font-bold text-white">
                  {format.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{format.name}</div>
                  <div className="text-xs opacity-80">{format.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {!mesh && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Create or import a mesh to enable export
          </div>
        )}
      </div>

      {/* Stats Section */}
      {mesh && (
        <div className="pt-4 border-t border-gray-600">
          <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
            <div className="w-5 h-5 bg-gray-600 rounded mr-2 flex items-center justify-center text-xs font-bold">i</div>
            Mesh Info
          </h4>
          <div className="bg-gray-750 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Vertices:</span>
              <span className="text-white font-mono">{mesh.vertices().length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Edges:</span>
              <span className="text-white font-mono">{mesh.edges().length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Faces:</span>
              <span className="text-white font-mono">{mesh.faces().length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};