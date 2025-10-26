import { useRef, useEffect, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface UseResizableOptions {
  initialPosition?: Position;
  initialSize?: Size;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  dragHandle?: string; // CSS selector for drag handle
  resizeHandle?: string; // CSS selector for resize handle
}

export const useResizable = (options: UseResizableOptions = {}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>(
    options.initialPosition || { x: 0, y: 0 }
  );
  const [size, setSize] = useState<Size>(
    options.initialSize || { width: 320, height: 400 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Use refs to maintain stable references across renders
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const elementStartRef = useRef<Position>({ x: 0, y: 0 });
  const sizeStartRef = useRef<Size>({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  
  // Keep refs in sync with state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  
  useEffect(() => {
    isResizingRef.current = isResizing;
  }, [isResizing]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicking on resize handle
      const resizeHandle = options.resizeHandle 
        ? element.querySelector(options.resizeHandle)
        : element.querySelector('.resize-handle');

      if (resizeHandle?.contains(target)) {
        e.preventDefault();
        setIsResizing(true);
        isResizingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        sizeStartRef.current = { width: sizeRef.current.width, height: sizeRef.current.height };
        element.style.userSelect = 'none';
        return;
      }

      // Check if clicking on drag handle
      const dragHandle = options.dragHandle 
        ? element.querySelector(options.dragHandle)
        : element.querySelector('.drag-handle');

      if (dragHandle?.contains(target)) {
        e.preventDefault();
        
        // Get the actual current position of the element
        const rect = element.getBoundingClientRect();
        const currentPosition = {
          x: rect.left,
          y: rect.top
        };
        
        setIsDragging(true);
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        elementStartRef.current = currentPosition;
        element.style.cursor = 'grabbing';
        element.style.userSelect = 'none';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current) {
        e.preventDefault();
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        const newWidth = Math.max(
          options.minWidth || 200,
          Math.min(
            options.maxWidth || window.innerWidth,
            sizeStartRef.current.width + deltaX
          )
        );

        const newHeight = Math.max(
          options.minHeight || 150,
          Math.min(
            options.maxHeight || window.innerHeight,
            sizeStartRef.current.height + deltaY
          )
        );

        setSize({ width: newWidth, height: newHeight });
      } else if (isDraggingRef.current) {
        e.preventDefault();
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        const newPosition = {
          x: elementStartRef.current.x + deltaX,
          y: elementStartRef.current.y + deltaY,
        };

        // Constrain to viewport bounds (allow some negative values for better UX)
        const minX = -sizeRef.current.width * 0.8; // Allow 80% of width to be off-screen
        const minY = 0; // Keep top edge visible
        const maxX = window.innerWidth - sizeRef.current.width * 0.2; // Keep 20% visible
        const maxY = window.innerHeight - 40; // Keep title bar visible

        newPosition.x = Math.max(minX, Math.min(newPosition.x, maxX));
        newPosition.y = Math.max(minY, Math.min(newPosition.y, maxY));

        setPosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current || isResizingRef.current) {
        setIsDragging(false);
        setIsResizing(false);
        isDraggingRef.current = false;
        isResizingRef.current = false;
        if (element) {
          element.style.cursor = '';
          element.style.userSelect = '';
        }
      }
    };

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [options.dragHandle, options.resizeHandle, options.minWidth, options.minHeight, options.maxWidth, options.maxHeight]);

  // Apply position and size styles
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Ensure the element has absolute positioning for proper dragging
    element.style.position = 'absolute';
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.style.width = `${size.width}px`;
    element.style.height = `${size.height}px`;
    element.style.transform = 'none'; // Clear any existing transform
  }, [position, size]);

  return {
    ref: elementRef,
    position,
    size,
    isDragging,
    isResizing,
    setPosition,
    setSize,
  };
};