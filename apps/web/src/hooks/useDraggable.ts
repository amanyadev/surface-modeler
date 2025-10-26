import { useRef, useEffect, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition?: Position;
  dragHandle?: string; // CSS selector for drag handle
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>(
    options.initialPosition || { x: 0, y: 0 }
  );
  const [isDragging, setIsDragging] = useState(false);
  
  // Use refs to maintain stable references across renders
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const elementStartRef = useRef<Position>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const positionRef = useRef(position);
  
  // Keep refs in sync with state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Check if we're clicking on the drag handle or the element itself
      const target = e.target as HTMLElement;
      const dragHandle = options.dragHandle 
        ? element.querySelector(options.dragHandle)
        : element;

      if (!dragHandle?.contains(target)) return;

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

      // Add dragging class for visual feedback
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      e.preventDefault();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newPosition = {
        x: elementStartRef.current.x + deltaX,
        y: elementStartRef.current.y + deltaY,
      };

      // Constrain to viewport bounds
      const rect = element.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
      newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));

      setPosition(newPosition);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      
      setIsDragging(false);
      isDraggingRef.current = false;
      if (element) {
        element.style.cursor = '';
        element.style.userSelect = '';
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
  }, [options.dragHandle]);

  // Apply position styles
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use absolute positioning for better control
    element.style.position = 'absolute';
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.style.transform = 'none'; // Clear any existing transform
  }, [position]);

  return {
    ref: elementRef,
    position,
    isDragging,
    setPosition,
  };
};