import React, { useState } from 'react';

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { category: 'Selection Modes', items: [
      { keys: '1', description: 'Vertex mode' },
      { keys: '2', description: 'Edge mode' },
      { keys: '3', description: 'Face mode' },
      { keys: '4', description: 'Mesh mode' },
    ]},
    { category: 'Drawing Tools', items: [
      { keys: 'G', description: 'Vertex drawing' },
      { keys: 'Q', description: 'Quad drawing' },
      { keys: 'C', description: 'Circle drawing' },
      { keys: 'ESC', description: 'Cancel drawing' },
    ]},
    { category: 'Operations', items: [
      { keys: 'E', description: 'Extrude face' },
      { keys: 'M', description: 'Move vertex' },
      { keys: 'S', description: 'Subdivide edge' },
    ]},
    { category: 'Camera', items: [
      { keys: 'R', description: 'Reset view' },
      { keys: 'F', description: 'Fit to screen' },
      { keys: 'W', description: 'Toggle wireframe' },
      { keys: 'SPACE', description: 'Toggle 2D/3D' },
      { keys: 'H', description: 'Toggle grid' },
    ]},
    { category: 'General', items: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Shift+Z', description: 'Redo' },
    ]},
  ];

  return (
    <>
      {/* Shortcut button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Keyboard Shortcuts"
      >
        <span className="text-sm font-mono">?</span>
      </button>

      {/* Shortcuts panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcuts.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((shortcut) => (
                      <div key={shortcut.keys} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Most shortcuts work when not typing in input fields
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};