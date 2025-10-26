import React, { useState, useCallback } from 'react';
import { RefinedTabContainer as TabContainer, TabData } from './RefinedTabContainer';

export interface PanelDefinition {
  id: string;
  title: string;
  icon?: string;
  component: React.ComponentType<any>;
  props?: any;
  defaultDock?: 'left' | 'right' | 'bottom' | 'floating';
  closable?: boolean;
}

export interface DockLayout {
  left: string[];
  right: string[];
  bottom: string[];
  floating: Array<{
    tabs: string[];
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
}

interface PanelManagerProps {
  panels: PanelDefinition[];
  initialLayout?: Partial<DockLayout>;
  onLayoutChange?: (layout: DockLayout) => void;
}

export const PanelManager: React.FC<PanelManagerProps> = ({
  panels,
  initialLayout = {},
  onLayoutChange
}) => {
  const [layout, setLayout] = useState<DockLayout>(() => {
    // Initialize layout with defaults
    const defaultLayout: DockLayout = {
      left: [],
      right: [],
      bottom: [],
      floating: []
    };

    // Apply initial layout
    Object.assign(defaultLayout, initialLayout);

    // Place panels not in layout to their default dock positions
    const allPlacedPanels = new Set([
      ...defaultLayout.left,
      ...defaultLayout.right,
      ...defaultLayout.bottom,
      ...defaultLayout.floating.flatMap(f => f.tabs)
    ]);

    panels.forEach(panel => {
      if (!allPlacedPanels.has(panel.id)) {
        const dock = panel.defaultDock || 'floating';
        if (dock === 'floating') {
          defaultLayout.floating.push({
            tabs: [panel.id],
            position: { x: 20 + defaultLayout.floating.length * 30, y: 20 + defaultLayout.floating.length * 30 },
            size: { width: 320, height: 400 }
          });
        } else {
          defaultLayout[dock].push(panel.id);
        }
      }
    });

    return defaultLayout;
  });

  const updateLayout = useCallback((newLayout: DockLayout) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [onLayoutChange]);

  const handleTabClose = useCallback((tabId: string, containerType: keyof DockLayout, containerIndex?: number) => {
    const newLayout = { ...layout };
    
    if (containerType === 'floating' && typeof containerIndex === 'number') {
      const container = newLayout.floating[containerIndex];
      container.tabs = container.tabs.filter(id => id !== tabId);
      if (container.tabs.length === 0) {
        newLayout.floating.splice(containerIndex, 1);
      }
    } else if (containerType !== 'floating') {
      newLayout[containerType] = newLayout[containerType].filter(id => id !== tabId);
    }
    
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  const handleTabReorder = useCallback((
    oldIndex: number, 
    newIndex: number, 
    containerType: keyof DockLayout, 
    containerIndex?: number
  ) => {
    const newLayout = { ...layout };
    
    if (containerType === 'floating' && typeof containerIndex === 'number') {
      const tabs = [...newLayout.floating[containerIndex].tabs];
      const [moved] = tabs.splice(oldIndex, 1);
      tabs.splice(newIndex, 0, moved);
      newLayout.floating[containerIndex].tabs = tabs;
    } else if (containerType !== 'floating') {
      const tabs = [...newLayout[containerType]];
      const [moved] = tabs.splice(oldIndex, 1);
      tabs.splice(newIndex, 0, moved);
      newLayout[containerType] = tabs;
    }
    
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  const handleDock = useCallback((
    tabId: string, 
    newPosition: 'left' | 'right' | 'bottom' | 'floating',
    fromContainer?: { type: keyof DockLayout; index?: number }
  ) => {
    const newLayout = { ...layout };
    
    // Remove from current position
    if (fromContainer) {
      if (fromContainer.type === 'floating' && typeof fromContainer.index === 'number') {
        const container = newLayout.floating[fromContainer.index];
        container.tabs = container.tabs.filter(id => id !== tabId);
        if (container.tabs.length === 0) {
          newLayout.floating.splice(fromContainer.index, 1);
        }
      } else if (fromContainer.type !== 'floating') {
        newLayout[fromContainer.type] = newLayout[fromContainer.type].filter(id => id !== tabId);
      }
    }
    
    // Add to new position
    if (newPosition === 'floating') {
      newLayout.floating.push({
        tabs: [tabId],
        position: { x: 50, y: 50 },
        size: { width: 320, height: 400 }
      });
    } else {
      newLayout[newPosition].push(tabId);
    }
    
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  const createTabData = (panelIds: string[]): TabData[] => {
    return panelIds.map(id => {
      const panel = panels.find(p => p.id === id);
      if (!panel) return null;
      
      return {
        id: panel.id,
        title: panel.title,
        icon: panel.icon,
        component: panel.component,
        props: panel.props,
        closable: panel.closable
      };
    }).filter(Boolean) as TabData[];
  };

  return (
    <div className="w-full h-full relative pointer-events-none">
      {/* Left Dock */}
      {layout.left.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-gray-700 pointer-events-auto">
          <TabContainer
            tabs={createTabData(layout.left)}
            onTabClose={(tabId) => handleTabClose(tabId, 'left')}
            onTabReorder={(oldIndex, newIndex) => handleTabReorder(oldIndex, newIndex, 'left')}
            dockPosition="left"
            onDock={(position) => {
              const firstTab = layout.left[0];
              if (firstTab) {
                handleDock(firstTab, position, { type: 'left' });
              }
            }}
            className="h-full"
          />
        </div>
      )}

      {/* Right Dock */}
      {layout.right.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 w-80 border-l border-gray-700 pointer-events-auto">
          <TabContainer
            tabs={createTabData(layout.right)}
            onTabClose={(tabId) => handleTabClose(tabId, 'right')}
            onTabReorder={(oldIndex, newIndex) => handleTabReorder(oldIndex, newIndex, 'right')}
            dockPosition="right"
            onDock={(position) => {
              const firstTab = layout.right[0];
              if (firstTab) {
                handleDock(firstTab, position, { type: 'right' });
              }
            }}
            className="h-full"
          />
        </div>
      )}

      {/* Bottom Dock */}
      {layout.bottom.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-64 border-t border-gray-700 pointer-events-auto">
          <TabContainer
            tabs={createTabData(layout.bottom)}
            onTabClose={(tabId) => handleTabClose(tabId, 'bottom')}
            onTabReorder={(oldIndex, newIndex) => handleTabReorder(oldIndex, newIndex, 'bottom')}
            dockPosition="bottom"
            onDock={(position) => {
              const firstTab = layout.bottom[0];
              if (firstTab) {
                handleDock(firstTab, position, { type: 'bottom' });
              }
            }}
            className="h-full"
          />
        </div>
      )}

      {/* Floating Containers */}
      {layout.floating.map((container, index) => (
        <TabContainer
          key={`floating-${index}`}
          tabs={createTabData(container.tabs)}
          onTabClose={(tabId) => handleTabClose(tabId, 'floating', index)}
          onTabReorder={(oldIndex, newIndex) => handleTabReorder(oldIndex, newIndex, 'floating', index)}
          initialPosition={container.position}
          initialSize={container.size}
          dockPosition="floating"
          onDock={(position) => {
            const firstTab = container.tabs[0];
            if (firstTab) {
              handleDock(firstTab, position, { type: 'floating', index });
            }
          }}
        />
      ))}
    </div>
  );
};