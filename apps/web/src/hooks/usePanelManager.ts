import { useState, useCallback } from 'react';
import { DockLayout, PanelDefinition } from '../components/TabSystem';

interface PanelManagerState {
  layout: DockLayout;
  hiddenPanels: Set<string>;
}

export const usePanelManager = (panels: PanelDefinition[], initialLayout: Partial<DockLayout> = {}) => {
  const [state, setState] = useState<PanelManagerState>(() => {
    // Initialize layout with defaults
    const defaultLayout: DockLayout = {
      left: [],
      right: [],
      bottom: [],
      floating: []
    };

    // Apply initial layout
    Object.assign(defaultLayout, initialLayout);

    // Track which panels are currently hidden
    const hiddenPanels = new Set<string>();
    
    // Place panels not in layout to their default dock positions, but mark them as hidden
    const allPlacedPanels = new Set([
      ...defaultLayout.left,
      ...defaultLayout.right,
      ...defaultLayout.bottom,
      ...defaultLayout.floating.flatMap(container => container.tabs)
    ]);

    panels.forEach(panel => {
      if (!allPlacedPanels.has(panel.id)) {
        hiddenPanels.add(panel.id);
      }
    });

    return {
      layout: defaultLayout,
      hiddenPanels
    };
  });

  const updateLayout = useCallback((newLayout: DockLayout) => {
    setState(prev => ({ ...prev, layout: newLayout }));
  }, []);

  const showPanel = useCallback((panelId: string, dock?: 'left' | 'right' | 'bottom' | 'floating') => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    setState(prev => {
      const newLayout = { ...prev.layout };
      const newHiddenPanels = new Set(prev.hiddenPanels);
      
      // Remove from hidden panels
      newHiddenPanels.delete(panelId);
      
      // Determine where to place the panel
      const targetDock = dock || panel.defaultDock || 'right';
      
      if (targetDock === 'floating') {
        newLayout.floating.push({
          tabs: [panelId],
          position: { x: 50 + newLayout.floating.length * 30, y: 50 + newLayout.floating.length * 30 },
          size: { width: 320, height: 400 }
        });
      } else {
        newLayout[targetDock].push(panelId);
      }
      
      return {
        layout: newLayout,
        hiddenPanels: newHiddenPanels
      };
    });
  }, [panels]);

  const hidePanel = useCallback((panelId: string) => {
    setState(prev => {
      const newLayout = { ...prev.layout };
      const newHiddenPanels = new Set(prev.hiddenPanels);
      
      // Add to hidden panels
      newHiddenPanels.add(panelId);
      
      // Remove from all dock positions
      newLayout.left = newLayout.left.filter(id => id !== panelId);
      newLayout.right = newLayout.right.filter(id => id !== panelId);
      newLayout.bottom = newLayout.bottom.filter(id => id !== panelId);
      
      // Remove from floating containers
      newLayout.floating = newLayout.floating.map(container => ({
        ...container,
        tabs: container.tabs.filter(id => id !== panelId)
      })).filter(container => container.tabs.length > 0);
      
      return {
        layout: newLayout,
        hiddenPanels: newHiddenPanels
      };
    });
  }, []);

  const togglePanel = useCallback((panelId: string, dock?: 'left' | 'right' | 'bottom' | 'floating') => {
    if (state.hiddenPanels.has(panelId)) {
      showPanel(panelId, dock);
    } else {
      hidePanel(panelId);
    }
  }, [state.hiddenPanels, showPanel, hidePanel]);

  const isPanelVisible = useCallback((panelId: string) => {
    return !state.hiddenPanels.has(panelId);
  }, [state.hiddenPanels]);

  const getVisiblePanels = useCallback(() => {
    return panels.filter(panel => !state.hiddenPanels.has(panel.id));
  }, [panels, state.hiddenPanels]);

  const getHiddenPanels = useCallback(() => {
    return panels.filter(panel => state.hiddenPanels.has(panel.id));
  }, [panels, state.hiddenPanels]);

  return {
    layout: state.layout,
    updateLayout,
    showPanel,
    hidePanel,
    togglePanel,
    isPanelVisible,
    getVisiblePanels,
    getHiddenPanels
  };
};