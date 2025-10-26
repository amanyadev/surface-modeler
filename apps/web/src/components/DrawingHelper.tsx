import React from 'react';
import { useAppStore } from '../store';

export const DrawingHelper: React.FC = () => {
  const { drawMode, sketchVertices } = useAppStore();

  if (drawMode === 'none') return null;

  const getHelpText = () => {
    switch (drawMode) {
      case 'vertex':
        return 'Click anywhere in the 3D space to place a vertex';
      case 'sketch':
        return `Click on vertices to create a face (${sketchVertices.length} selected)`;
      case 'quad':
        return 'Click to place a square face at the cursor position';
      case 'circle':
        return 'Click to place a circular face at the cursor position';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (drawMode) {
      case 'vertex':
        return '⚫';
      case 'sketch':
        return '🔗';
      case 'quad':
        return '⬜';
      case 'circle':
        return '⭕';
      default:
        return '✏️';
    }
  };

  const getColor = () => {
    switch (drawMode) {
      case 'vertex':
        return 'bg-green-500';
      case 'sketch':
        return 'bg-blue-500';
      case 'quad':
        return 'bg-purple-500';
      case 'circle':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 ${getColor()} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50`}>
      <span className="text-lg">{getIcon()}</span>
      <span className="text-sm font-medium">{getHelpText()}</span>
      {drawMode === 'sketch' && sketchVertices.length >= 3 && (
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          Press ESC to cancel or click "Finish" in toolbar
        </span>
      )}
    </div>
  );
};