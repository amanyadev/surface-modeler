import React, { useRef, useEffect, useState } from 'react';

interface FloatingWidgetProps {
  title: string;
  icon: string;
  iconBgColor?: string;
  defaultPosition?: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  zIndex?: number;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  title,
  icon,
  iconBgColor = 'bg-blue-600',
  defaultPosition = { x: 0, y: 0 },
  children,
  className = '',
  isCollapsible = true,
  defaultCollapsed = false,
  zIndex = 50
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });

  // Dragging functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 300, dragStart.current.elementX + deltaX)),
          y: Math.max(60, Math.min(window.innerHeight - 100, dragStart.current.elementY + deltaY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: position.x,
      elementY: position.y
    };
  };

  return (
    <div 
      ref={dragRef}
      className={`fixed bg-black/90 backdrop-blur-sm text-white rounded-lg text-xs shadow-lg border border-gray-700 pointer-events-auto ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex
      }}
    >
      <div 
        className={`flex items-center justify-between p-3 cursor-move ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 ${iconBgColor} rounded mr-2 flex items-center justify-center text-xs font-bold`}>
            {icon}
          </div>
          <span className="font-medium">{title}</span>
        </div>
        {isCollapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          >
            {isCollapsed ? '+' : '−'}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
};