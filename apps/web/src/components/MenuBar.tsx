import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { usePanelManagerContext } from '../App';
import {
  createPlane,
  createCube,
  createCylinder,
  HalfEdgeMesh
} from '@half-edge/kernel';
import { 
  loadMeshFile, 
  exportAsOBJ, 
  exportAsGLTF, 
  exportAsGLB 
} from '../utils/meshConversion';

export const MenuBar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { mesh, setMesh, undo, redo, commandHistory, clearSketch } = useAppStore();
  const { showPanel, hidePanel, togglePanel, isPanelVisible, panels } = usePanelManagerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import/Export handlers
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

  // Categorize panels
  const categorizedPanels = {
    modeling: panels.filter(p => ['primitives', 'drawing', 'modeling'].includes(p.id)),
    selection: panels.filter(p => ['selection', 'properties', 'hierarchy'].includes(p.id)),
    view: panels.filter(p => ['inspector', 'lighting'].includes(p.id))
  };

  const menus = [
    {
      label: 'File',
      items: [
        { label: 'New', action: () => setMesh(createPlane(2, 2) as HalfEdgeMesh), shortcut: '⌘N' },
        { label: '-' },
        { label: 'Import...', action: handleImportClick, shortcut: '⌘I' },
        { label: '-' },
        { label: 'Export as OBJ', action: handleExportOBJ, disabled: !mesh },
        { label: 'Export as GLTF', action: handleExportGLTF, disabled: !mesh },
        { label: 'Export as GLB', action: handleExportGLB, disabled: !mesh },
        { label: '-' },
        { label: 'Save', action: () => console.log('Save'), shortcut: '⌘S' },
        { label: 'Save As...', action: () => console.log('Save As'), shortcut: '⇧⌘S' },
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: undo, disabled: !commandHistory.canUndo(), shortcut: '⌘Z' },
        { label: 'Redo', action: redo, disabled: !commandHistory.canRedo(), shortcut: '⇧⌘Z' },
        { label: 'Clear Sketch', action: clearSketch, shortcut: '⌘K' },
        { label: 'Select All', action: () => console.log('Select All'), shortcut: '⌘A' },
        { label: 'Deselect All', action: () => console.log('Deselect All'), shortcut: '⌘D' },
      ]
    },
    {
      label: 'Create',
      items: [
        { label: 'Plane', action: () => setMesh(createPlane(2, 2) as HalfEdgeMesh) },
        { label: 'Cube', action: () => setMesh(createCube(2) as HalfEdgeMesh) },
        { label: 'Cylinder', action: () => setMesh(createCylinder(1, 2, 8) as HalfEdgeMesh) },
        { label: 'Sphere', action: () => console.log('Create Sphere') },
        { label: 'Torus', action: () => console.log('Create Torus') },
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Front View', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'front' })), shortcut: '1' },
        { label: 'Back View', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'back' })), shortcut: '⌃1' },
        { label: 'Left View', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'left' })), shortcut: '3' },
        { label: 'Right View', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'right' })), shortcut: '⌃3' },
        { label: 'Top View', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'top' })), shortcut: '7' },
        { label: 'Bottom View', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'bottom' })), shortcut: '⌃7' },
        { label: 'Isometric', action: () => window.dispatchEvent(new CustomEvent('presetCamera', { detail: 'iso' })), shortcut: '0' },
        { label: 'Reset View', action: () => window.dispatchEvent(new CustomEvent('resetCamera')), shortcut: 'R' },
        { label: 'Fit All', action: () => window.dispatchEvent(new CustomEvent('fitCamera')), shortcut: 'F' },
        { label: 'Toggle Wireframe', action: () => window.dispatchEvent(new CustomEvent('toggleWireframe')), shortcut: 'W' },
      ]
    },
    {
      label: 'Panels',
      items: [
        { label: 'Modeling', disabled: true },
        ...categorizedPanels.modeling.map(panel => ({
          label: `${isPanelVisible(panel.id) ? '✓' : ''} ${panel.title}`,
          action: () => togglePanel(panel.id),
        })),
        { label: '-' },
        { label: 'Selection', disabled: true },
        ...categorizedPanels.selection.map(panel => ({
          label: `${isPanelVisible(panel.id) ? '✓' : ''} ${panel.title}`,
          action: () => togglePanel(panel.id),
        })),
        { label: '-' },
        { label: 'View', disabled: true },
        ...categorizedPanels.view.map(panel => ({
          label: `${isPanelVisible(panel.id) ? '✓' : ''} ${panel.title}`,
          action: () => togglePanel(panel.id),
        })),
        { label: '-' },
        { label: 'Show All Panels', action: () => {
          panels.forEach(panel => showPanel(panel.id));
        }},
        { label: 'Hide All Panels', action: () => {
          panels.forEach(panel => hidePanel(panel.id));
        }},
      ]
    },
    {
      label: 'Tools',
      items: [
        { label: 'Vertex Tool', action: () => console.log('Vertex Tool'), shortcut: '⌘1' },
        { label: 'Edge Tool', action: () => console.log('Edge Tool'), shortcut: '⌘2' },
        { label: 'Face Tool', action: () => console.log('Face Tool'), shortcut: '⌘3' },
        { label: 'Mesh Tool', action: () => console.log('Mesh Tool'), shortcut: '⌘4' },
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', action: () => console.log('Shortcuts'), shortcut: '⌘?' },
        { label: 'Documentation', action: () => console.log('Docs') },
        { label: 'About', action: () => console.log('About') },
      ]
    }
  ];

  const handleMenuClick = (menuLabel: string) => {
    setOpenMenu(openMenu === menuLabel ? null : menuLabel);
  };

  const handleItemClick = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 h-8 flex items-center px-4 text-sm relative z-50">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".obj,.gltf,.glb"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
      
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => handleMenuClick(menu.label)}
            className={`px-2 py-1 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
              openMenu === menu.label ? 'bg-gray-700 text-white' : ''
            }`}
          >
            {menu.label}
          </button>
          
          {openMenu === menu.label && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenu(null)}
              />
              
              {/* Dropdown menu */}
              <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-48 z-20">
                {menu.items.map((item, index) => (
                  item.label === '-' ? (
                    <div key={index} className="mx-2 my-1 border-t border-gray-600" />
                  ) : (
                    <button
                      key={index}
                      onClick={() => 'action' in item && item.action ? handleItemClick(item.action) : undefined}
                      disabled={'disabled' in item ? item.disabled : false}
                      className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between hover:bg-gray-700 transition-colors ${
                        ('disabled' in item && item.disabled) ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {'shortcut' in item && item.shortcut && (
                        <span className="text-xs text-gray-500 ml-4">{item.shortcut}</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            </>
          )}
        </div>
      ))}
      
      {/* Right side items */}
      <div className="ml-auto flex items-center space-x-4">
        <div className="text-xs text-gray-400">Surface Modeler v0.1.0</div>
        <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
      </div>
    </div>
  );
};