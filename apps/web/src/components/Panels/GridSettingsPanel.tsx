import React from 'react';
import { useAppStore } from '../../store';

export const GridSettingsPanel: React.FC = () => {
  const { gridSettings, updateGridSettings } = useAppStore();

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold mb-3">Grid Settings</h3>
      
      {/* Grid Visibility */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Show Grid</label>
        <input
          type="checkbox"
          checked={gridSettings.visible}
          onChange={(e) => updateGridSettings({ visible: e.target.checked })}
          className="form-checkbox h-4 w-4 text-blue-600 rounded"
        />
      </div>

      {/* Grid Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Grid Size</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={gridSettings.size}
            onChange={(e) => updateGridSettings({ size: parseInt(e.target.value) })}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-300 w-8 text-right">{gridSettings.size}</span>
        </div>
      </div>

      {/* Grid Divisions */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Grid Density</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={gridSettings.divisions}
            onChange={(e) => updateGridSettings({ divisions: parseInt(e.target.value) })}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-300 w-8 text-right">{gridSettings.divisions}</span>
        </div>
      </div>

      {/* Grid Opacity */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Opacity</label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={gridSettings.opacity}
            onChange={(e) => updateGridSettings({ opacity: parseFloat(e.target.value) })}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-300 w-8 text-right">{gridSettings.opacity.toFixed(1)}</span>
        </div>
      </div>

      {/* Grid Features */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Features</h4>
        
        <div className="flex items-center justify-between">
          <label className="text-sm">Show Labels</label>
          <input
            type="checkbox"
            checked={gridSettings.showLabels}
            onChange={(e) => updateGridSettings({ showLabels: e.target.checked })}
            className="form-checkbox h-4 w-4 text-blue-600 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Show Axes</label>
          <input
            type="checkbox"
            checked={gridSettings.showAxes}
            onChange={(e) => updateGridSettings({ showAxes: e.target.checked })}
            className="form-checkbox h-4 w-4 text-blue-600 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Adaptive Sizing</label>
          <input
            type="checkbox"
            checked={gridSettings.adaptive}
            onChange={(e) => updateGridSettings({ adaptive: e.target.checked })}
            className="form-checkbox h-4 w-4 text-blue-600 rounded"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateGridSettings({
              size: 20,
              divisions: 20,
              opacity: 0.8,
              showLabels: true,
              showAxes: true,
              adaptive: false
            })}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Fine
          </button>
          <button
            onClick={() => updateGridSettings({
              size: 50,
              divisions: 50,
              opacity: 0.7,
              showLabels: true,
              showAxes: true,
              adaptive: true
            })}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Default
          </button>
          <button
            onClick={() => updateGridSettings({
              size: 100,
              divisions: 25,
              opacity: 0.5,
              showLabels: false,
              showAxes: true,
              adaptive: true
            })}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Coarse
          </button>
          <button
            onClick={() => updateGridSettings({
              size: 200,
              divisions: 20,
              opacity: 0.3,
              showLabels: false,
              showAxes: false,
              adaptive: true
            })}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Minimal
          </button>
        </div>
      </div>
    </div>
  );
};