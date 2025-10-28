import { useEffect, createContext, useContext } from 'react';
import { ThreeJSViewer } from './components/ThreeJSViewer';
import { ViewportControls } from './components/ViewportControls';
import { DrawingHelper } from './components/DrawingHelper';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { MenuBar } from './components/MenuBar';
import { PanelManager, PanelDefinition } from './components/TabSystem';
import { PrimitivesPanel } from './components/Panels/PrimitivesPanel';
import { DrawingToolsPanel } from './components/Panels/DrawingToolsPanel';
import { ModelingOperationsPanel } from './components/Panels/ModelingOperationsPanel';
import { SelectionModePanel } from './components/Panels/SelectionModePanel';
import { HierarchyPanel } from './components/Panels/HierarchyPanel';
import { SelectionInfoPanel } from './components/Panels/SelectionInfoPanel';
import { InspectorPanel } from './components/Panels/InspectorPanel';
import { LightingPanel } from './components/Panels/LightingPanel';
import { useAppStore } from './store';
import { useKeyboard } from './hooks/useKeyboard';
import { usePanelManager } from './hooks/usePanelManager';
import { createPlane, HalfEdgeMesh } from '@half-edge/kernel';

// Create context for panel manager
interface PanelManagerContextType {
  showPanel: (panelId: string, dock?: 'left' | 'right' | 'bottom' | 'floating') => void;
  hidePanel: (panelId: string) => void;
  togglePanel: (panelId: string, dock?: 'left' | 'right' | 'bottom' | 'floating') => void;
  isPanelVisible: (panelId: string) => boolean;
  getVisiblePanels: () => PanelDefinition[];
  getHiddenPanels: () => PanelDefinition[];
  panels: PanelDefinition[];
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export const usePanelManagerContext = () => {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManagerContext must be used within a PanelManagerProvider');
  }
  return context;
};

function App() {
  const { setMesh, selectionMode, setSelectionMode } = useAppStore();
  
  // Setup keyboard shortcuts
  useKeyboard();

  // Initialize with a default plane
  useEffect(() => {
    const defaultMesh = createPlane(2, 2) as HalfEdgeMesh;
    setMesh(defaultMesh);
  }, [setMesh]);

  // Define all available panels
  const panels: PanelDefinition[] = [
    {
      id: 'primitives',
      title: 'Primitives',
      icon: 'PR',
      component: PrimitivesPanel,
      defaultDock: 'left',
    },
    {
      id: 'drawing',
      title: 'Drawing',
      icon: 'DR',
      component: DrawingToolsPanel,
      defaultDock: 'left',
    },
    {
      id: 'modeling',
      title: 'Modeling',
      icon: 'MD',
      component: ModelingOperationsPanel,
      defaultDock: 'left',
    },
    {
      id: 'selection',
      title: 'Selection',
      icon: 'SL',
      component: SelectionModePanel,
      defaultDock: 'right',
    },
    {
      id: 'hierarchy',
      title: 'Hierarchy',
      icon: 'HR',
      component: HierarchyPanel,
      defaultDock: 'right',
    },
    {
      id: 'properties',
      title: 'Properties',
      icon: 'PR',
      component: SelectionInfoPanel,
      defaultDock: 'right',
    },
    {
      id: 'inspector',
      title: 'Inspector',
      icon: 'IN',
      component: InspectorPanel,
      defaultDock: 'right',
    },
    {
      id: 'lighting',
      title: 'Lighting',
      icon: 'LT',
      component: LightingPanel,
      defaultDock: 'right',
    },
  ];

  const initialLayout = {
    left: ['primitives', 'drawing', 'modeling'],
    right: ['selection', 'lighting'],
    bottom: [],
    floating: []
  };

  // Use the panel manager hook
  const panelManager = usePanelManager(panels, initialLayout);

  const contextValue: PanelManagerContextType = {
    showPanel: panelManager.showPanel,
    hidePanel: panelManager.hidePanel,
    togglePanel: panelManager.togglePanel,
    isPanelVisible: panelManager.isPanelVisible,
    getVisiblePanels: panelManager.getVisiblePanels,
    getHiddenPanels: panelManager.getHiddenPanels,
    panels
  };

  return (
    <PanelManagerContext.Provider value={contextValue}>
      <div className="h-screen w-screen bg-gray-900 flex flex-col">
        {/* Menu bar */}
        <MenuBar />
        
        <div className="flex flex-1">
          {/* Minimal Sidebar with Quick Selection */}
          <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-600"></div>
            
            {/* Quick selection mode indicators */}
            <div className="flex flex-col space-y-2">
              {(['vertex', 'edge', 'face', 'mesh'] as const).map((mode, index) => {
                const icons = ['V', 'E', 'F', 'M'];
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                const hotkeys = ['1', '2', '3', '4'];
                
                return (
                  <div key={mode} className="relative">
                    <button
                      onClick={() => setSelectionMode(mode)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        selectionMode === mode
                          ? `${colors[index]} text-white shadow-lg scale-110`
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:scale-105'
                      }`}
                      title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Selection Mode (${hotkeys[index]})`}
                    >
                      {icons[index]}
                    </button>
                    {/* Hotkey indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-800 border border-gray-600 rounded-sm flex items-center justify-center text-xs text-gray-400 font-bold">
                      {hotkeys[index]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main content area with panels */}
          <div className="flex-1 flex flex-col relative">
            {/* Clean top bar */}
            <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 relative z-20">
              <div className="flex items-center space-x-6">
                <h1 className="text-lg font-semibold text-white">Surface Modeler</h1>
                <div className="text-sm text-gray-400">Half-Edge Mesh Editor</div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md">2D/3D</button>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Viewport with Panel System */}
            <div className="flex-1 relative">
              {/* 3D Viewport */}
              <div className="absolute inset-0 bg-gray-900 z-0">
                <ThreeJSViewer 
                  width={window.innerWidth - 48}
                  height={window.innerHeight - 80}
                />
              </div>

              {/* Panel System */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                
                {/* Viewport overlays - above panels */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
                  <ViewportControls />
                  <DrawingHelper />
                  <KeyboardShortcuts />
                </div>
                <PanelManager 
                  panels={panels} 
                  initialLayout={panelManager.layout}
                  onLayoutChange={(layout) => {
                    panelManager.updateLayout(layout);
                    // Save layout to localStorage for persistence
                    localStorage.setItem('panel-layout', JSON.stringify(layout));
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </PanelManagerContext.Provider>
  );
}

export default App;