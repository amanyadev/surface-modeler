import React from 'react';
import { useAppStore } from '../../store';

export const SelectionModePanel: React.FC = () => {
  const { selectionMode, setSelectionMode } = useAppStore();

  const selectionModes = [
    { 
      key: 'vertex' as const, 
      name: 'Vertex', 
      icon: 'V',
      color: 'bg-green-600 hover:bg-green-500',
      description: 'Select individual vertices'
    },
    { 
      key: 'edge' as const, 
      name: 'Edge', 
      icon: 'E',
      color: 'bg-blue-600 hover:bg-blue-500',
      description: 'Select mesh edges'
    },
    { 
      key: 'face' as const, 
      name: 'Face', 
      icon: 'F',
      color: 'bg-purple-600 hover:bg-purple-500',
      description: 'Select surface faces'
    },
    { 
      key: 'mesh' as const, 
      name: 'Mesh', 
      icon: 'M',
      color: 'bg-orange-600 hover:bg-orange-500',
      description: 'Select entire mesh object'
    }
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-gray-300 mb-4">Choose selection mode</div>
      
      {selectionModes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => setSelectionMode(mode.key)}
          className={`w-full flex items-center p-4 rounded-lg transition-all ${
            selectionMode === mode.key
              ? `${mode.color} text-white shadow-lg scale-105`
              : 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className={`w-8 h-8 rounded mr-4 flex items-center justify-center text-sm font-bold ${
            selectionMode === mode.key ? 'bg-white text-gray-900' : 'bg-gray-600 text-white'
          }`}>
            {mode.icon}
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{mode.name}</div>
            <div className={`text-xs ${
              selectionMode === mode.key ? 'text-gray-100' : 'text-gray-400'
            }`}>
              {mode.description}
            </div>
          </div>
          {selectionMode === mode.key && (
            <div className="w-2 h-2 bg-white rounded-full ml-2"></div>
          )}
        </button>
      ))}
      
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="text-xs text-gray-400">
          <div className="mb-2"><strong>Tips:</strong></div>
          <ul className="space-y-1 text-xs">
            <li>• Click to select elements</li>
            <li>• Hold Shift for multi-selection</li>
            <li>• Selected elements show gizmos for movement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};