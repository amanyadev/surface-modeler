import React, { useState, useRef, useEffect } from 'react';

export interface TabData {
  id: string;
  title: string;
  icon?: string;
  component: React.ComponentType<any>;
  props?: any;
  closable?: boolean;
}

interface RefinedTabContainerProps {
  tabs: TabData[];
  onTabClose?: (tabId: string) => void;
  onTabReorder?: (oldIndex: number, newIndex: number) => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  dockPosition?: 'left' | 'right' | 'bottom' | 'floating';
  onDock?: (position: 'left' | 'right' | 'bottom' | 'floating') => void;
  className?: string;
}

export const RefinedTabContainer: React.FC<RefinedTabContainerProps> = ({
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
  
  // State for dragging and resizing
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dockPosition === 'floating') {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        
        setPosition({
          x: dragStartRef.current.elementX + deltaX,
          y: Math.max(0, dragStartRef.current.elementY + deltaY)
        });
      }
      
      if (isResizing && dockPosition === 'floating') {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        
        setSize({
          width: Math.max(280, resizeStartRef.current.width + deltaX),
          height: Math.max(200, resizeStartRef.current.height + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dockPosition]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (dockPosition !== 'floating') return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: position.x,
      elementY: position.y
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (dockPosition !== 'floating') return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
  };

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.setData('text/plain', tabId);
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
    ${dockPosition === 'floating' ? 'fixed' : 'relative'}
    bg-gray-850 border border-gray-600 shadow-xl
    flex flex-col overflow-hidden
    ${dockPosition === 'floating' ? 'rounded-lg' : ''}
    ${className}
  `;

  const containerStyle = dockPosition === 'floating' ? {
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: 100,
    pointerEvents: 'auto' as const
  } : {};

  return (
    <div 
      ref={containerRef}
      className={containerClasses} 
      style={containerStyle}
    >
      {/* Tab Header */}
      <div 
        className={`bg-gray-800 border-b border-gray-600 flex-shrink-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center min-h-[32px]">
          {/* Tab List */}
          <div className="flex-1 flex overflow-x-auto scrollbar-none">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className="relative flex items-center"
                onDragOver={(e) => handleTabDragOver(e, index)}
                onDrop={(e) => handleTabDrop(e, index)}
              >
                {/* Drop Indicator */}
                {dropIndicator === index && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 z-10" />
                )}
                
                <div
                  draggable
                  onDragStart={(e) => handleTabDragStart(e, tab.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTabId(tab.id);
                  }}
                  className={`
                    flex items-center px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
                    border-r border-gray-600 min-w-0 max-w-32 select-none
                    ${activeTabId === tab.id
                      ? 'bg-gray-700 text-white border-b-2 border-blue-400'
                      : 'text-gray-300 hover:text-white hover:bg-gray-750'
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
                      className="ml-1.5 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
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
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400" />
                )}
              </div>
            )}
          </div>

          {/* Window Controls */}
          {dockPosition === 'floating' && (
            <div className="flex items-center px-2 space-x-1 flex-shrink-0">
              {onDock && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDock('left');
                    }}
                    className="w-6 h-6 flex items-center justify-center text-xs text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Dock Left"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDock('right');
                    }}
                    className="w-6 h-6 flex items-center justify-center text-xs text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Dock Right"
                  >
                    →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDock('bottom');
                    }}
                    className="w-6 h-6 flex items-center justify-center text-xs text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Dock Bottom"
                  >
                    ↓
                  </button>
                </>
              )}
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
        <>
          {/* Corner resize handle */}
          <div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-gray-500 group-hover:border-gray-400"></div>
          </div>
          
          {/* Edge resize handles */}
          <div 
            className="absolute bottom-0 left-2 right-6 h-1 cursor-s-resize"
            onMouseDown={handleResizeMouseDown}
          />
          <div 
            className="absolute right-0 top-8 bottom-6 w-1 cursor-e-resize"
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </div>
  );
};