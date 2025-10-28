import React, { useState } from 'react';
import { useAppStore } from '../../store';

export const LightingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shading' | 'lighting' | 'shadows'>('shading');
  const { lightingSettings, updateLightingSettings } = useAppStore();

  const tabs = [
    { key: 'shading' as const, label: 'Shading', icon: '🎨' },
    { key: 'lighting' as const, label: 'Lighting', icon: '💡' },
    { key: 'shadows' as const, label: 'Shadows', icon: '🌑' },
  ];

  const shadingModes = [
    { key: 'phong' as const, name: 'Phong', description: 'Smooth, realistic shading' },
    { key: 'gouraud' as const, name: 'Gouraud', description: 'Vertex-based lighting' },
    { key: 'flat' as const, name: 'Flat', description: 'Faceted look' },
    { key: 'toon' as const, name: 'Toon', description: 'Cartoon-style' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shading':
        return (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Shading Mode</h4>
              <div className="space-y-1">
                {shadingModes.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => updateLightingSettings({ shadingMode: mode.key })}
                    className={`w-full p-2 text-left rounded border text-sm transition-all ${
                      lightingSettings.shadingMode === mode.key
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{mode.name}</div>
                    <div className={`text-xs ${
                      lightingSettings.shadingMode === mode.key ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {mode.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Material Properties */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Material</h4>
              
              {/* Roughness */}
              <div className="space-y-1 mb-2">
                <label className="text-xs text-gray-400">Roughness</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={lightingSettings.roughness}
                    onChange={(e) => updateLightingSettings({ roughness: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.roughness.toFixed(1)}</span>
                </div>
              </div>

              {/* Metalness */}
              <div className="space-y-1 mb-2">
                <label className="text-xs text-gray-400">Metalness</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={lightingSettings.metalness}
                    onChange={(e) => updateLightingSettings({ metalness: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.metalness.toFixed(1)}</span>
                </div>
              </div>

              {/* Wireframe Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Wireframe</label>
                <input
                  type="checkbox"
                  checked={lightingSettings.wireframe}
                  onChange={(e) => updateLightingSettings({ wireframe: e.target.checked })}
                  className="form-checkbox h-3 w-3 text-blue-600 rounded bg-gray-600 border-gray-500"
                />
              </div>
            </div>
          </div>
        );

      case 'lighting':
        return (
          <div className="space-y-3">
            {/* Ambient Light */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Ambient Light</h4>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Intensity</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={lightingSettings.ambientIntensity}
                    onChange={(e) => updateLightingSettings({ ambientIntensity: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.ambientIntensity.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Directional Light */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Key Light</h4>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Intensity</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={lightingSettings.directionalIntensity}
                      onChange={(e) => updateLightingSettings({ directionalIntensity: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.directionalIntensity.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Enabled</label>
                  <input
                    type="checkbox"
                    checked={lightingSettings.directionalEnabled}
                    onChange={(e) => updateLightingSettings({ directionalEnabled: e.target.checked })}
                    className="form-checkbox h-3 w-3 text-blue-600 rounded bg-gray-600 border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Fill Light */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Fill Light</h4>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Intensity</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={lightingSettings.fillIntensity}
                      onChange={(e) => updateLightingSettings({ fillIntensity: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.fillIntensity.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Enabled</label>
                  <input
                    type="checkbox"
                    checked={lightingSettings.fillEnabled}
                    onChange={(e) => updateLightingSettings({ fillEnabled: e.target.checked })}
                    className="form-checkbox h-3 w-3 text-blue-600 rounded bg-gray-600 border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Rim Light */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Rim Light</h4>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Intensity</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={lightingSettings.rimIntensity}
                      onChange={(e) => updateLightingSettings({ rimIntensity: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.rimIntensity.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Enabled</label>
                  <input
                    type="checkbox"
                    checked={lightingSettings.rimEnabled}
                    onChange={(e) => updateLightingSettings({ rimEnabled: e.target.checked })}
                    className="form-checkbox h-3 w-3 text-blue-600 rounded bg-gray-600 border-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'shadows':
        return (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Shadow Settings</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Enable Shadows</label>
                  <input
                    type="checkbox"
                    checked={lightingSettings.shadowsEnabled}
                    onChange={(e) => updateLightingSettings({ shadowsEnabled: e.target.checked })}
                    className="form-checkbox h-3 w-3 text-blue-600 rounded bg-gray-600 border-gray-500"
                  />
                </div>

                {lightingSettings.shadowsEnabled && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Shadow Intensity</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={lightingSettings.shadowIntensity}
                          onChange={(e) => updateLightingSettings({ shadowIntensity: parseFloat(e.target.value) })}
                          className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer slider"
                        />
                        <span className="text-xs text-gray-400 w-6 text-right">{lightingSettings.shadowIntensity.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Quality</label>
                      <select
                        value={lightingSettings.shadowMapSize}
                        onChange={(e) => updateLightingSettings({ shadowMapSize: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-gray-600 rounded bg-gray-700 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={512}>Low (512)</option>
                        <option value={1024}>Medium (1024)</option>
                        <option value={2048}>High (2048)</option>
                        <option value={4096}>Ultra (4096)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-gray-300 mb-4">Shading and lighting controls</div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-600 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Preset buttons */}
      <div className="pt-3 mt-3 border-t border-gray-600">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateLightingSettings({
              shadingMode: 'phong',
              roughness: 0.3,
              metalness: 0.1,
              ambientIntensity: 0.6,
              directionalIntensity: 1.2,
              shadowsEnabled: true
            })}
            className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 hover:border-gray-500 transition-all"
          >
            Studio
          </button>
          <button
            onClick={() => updateLightingSettings({
              shadingMode: 'flat',
              roughness: 1.0,
              metalness: 0.0,
              ambientIntensity: 0.8,
              directionalIntensity: 0.8,
              shadowsEnabled: false
            })}
            className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 hover:border-gray-500 transition-all"
          >
            Technical
          </button>
          <button
            onClick={() => updateLightingSettings({
              shadingMode: 'toon',
              roughness: 0.8,
              metalness: 0.0,
              ambientIntensity: 0.7,
              directionalIntensity: 1.0,
              shadowsEnabled: true
            })}
            className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 hover:border-gray-500 transition-all"
          >
            Cartoon
          </button>
          <button
            onClick={() => updateLightingSettings({
              shadingMode: 'phong',
              roughness: 0.1,
              metalness: 0.8,
              ambientIntensity: 0.4,
              directionalIntensity: 1.5,
              shadowsEnabled: true
            })}
            className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 hover:border-gray-500 transition-all"
          >
            Metallic
          </button>
        </div>
      </div>
    </div>
  );
};