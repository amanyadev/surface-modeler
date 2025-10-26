import React, { useState, useRef } from 'react';
import { useResizable } from '../../hooks/useResizable';

export interface TabData {
  id: string;
  title: string;
  icon?: string;
  component: React.ComponentType<any>;
  props?: any;
  closable?: boolean;
}

interface TabContainerProps {
  tabs: TabData[];
  onTabClose?: (tabId: string) => void;
  onTabReorder?: (oldIndex: number, newIndex: number) => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  dockPosition?: 'left' | 'right' | 'bottom' | 'floating';
  onDock?: (position: 'left' | 'right' | 'bottom' | 'floating') => void;
  className?: string;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  tabs,
  onTabClose,
  onTabReorder,
  initialPosition = { x: 20, y: 20 },
  initialSize = { width: 320, height: 400 },
  dockPosition = 'floating',
  onDock,
  className = ''
}) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '');
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<number | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const resizable = useResizable({
    initialPosition,
    initialSize,
    minWidth: 280,
    minHeight: 200,
    dragHandle: '.tab-header',
    resizeHandle: '.resize-handle'
  });

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'tab-drag-preview';
    dragImage.textContent = tabs.find(t => t.id === tabId)?.title || '';
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: #374151;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleTabDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTab) {
      setDropIndicator(index);
    }
  };

  const handleTabDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedTab && onTabReorder) {
      const dragIndex = tabs.findIndex(tab => tab.id === draggedTab);
      if (dragIndex !== -1 && dragIndex !== dropIndex) {
        onTabReorder(dragIndex, dropIndex);
      }
    }
    setDraggedTab(null);
    setDropIndicator(null);
  };

  const containerClasses = `
    ${dockPosition === 'floating' ? 'absolute' : 'relative'}
    bg-gray-800 border border-gray-700 rounded-lg overflow-hidden
    shadow-xl backdrop-blur-sm
    ${className}
  `;

  const content = (
    <div className={containerClasses} ref={dockPosition === 'floating' ? resizable.ref : undefined}>
      {/* Tab Header */}
      <div className="tab-header bg-gray-750 border-b border-gray-600">
        <div className="flex items-center">
          {/* Tab List */}
          <div className="flex-1 flex overflow-x-auto">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className="relative flex items-center"
                onDragOver={(e) => handleTabDragOver(e, index)}
                onDrop={(e) => handleTabDrop(e, index)}
              >
                {/* Drop Indicator */}
                {dropIndicator === index && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 z-10" />
                )}
                
                <button
                  draggable
                  onDragStart={(e) => handleTabDragStart(e, tab.id)}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    flex items-center px-3 py-2 text-xs font-medium transition-colors
                    border-r border-gray-600 min-w-0 max-w-32
                    ${activeTabId === tab.id
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }
                    ${draggedTab === tab.id ? 'opacity-50' : ''}
                  `}
                >
                  {tab.icon && (
                    <span className="mr-1.5 text-xs">{tab.icon}</span>
                  )}
                  <span className="truncate">{tab.title}</span>
                  
                  {tab.closable !== false && onTabClose && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(tab.id);
                      }}
                      className="ml-1.5 text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </button>
              </div>
            ))}
            
            {/* Final drop zone */}
            {draggedTab && (
              <div
                className="relative w-2"
                onDragOver={(e) => handleTabDragOver(e, tabs.length)}
                onDrop={(e) => handleTabDrop(e, tabs.length)}
              >
                {dropIndicator === tabs.length && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                )}
              </div>
            )}
          </div>

          {/* Tab Actions */}
          {dockPosition === 'floating' && onDock && (
            <div className="flex items-center px-2 space-x-1">
              <button
                onClick={() => onDock('left')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Dock Left"
              >
                ⬅️
              </button>
              <button
                onClick={() => onDock('right')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Dock Right"
              >
                ➡️
              </button>
              <button
                onClick={() => onDock('bottom')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Dock Bottom"
              >
                ⬇️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-gray-800 overflow-hidden">
        {activeTab && (
          <div className="h-full overflow-auto">
            <activeTab.component {...(activeTab.props || {})} />
          </div>
        )}
      </div>

      {/* Resize Handle (floating only) */}
      {dockPosition === 'floating' && (
        <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-500"></div>
        </div>
      )}
    </div>
  );

  return content;
};