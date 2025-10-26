# @half-edge/web

React web application for the Half-Edge Surface Modeler.

## Features

- **Interactive 3D Viewport**: Three.js-powered real-time rendering
- **Face Selection**: Click to select faces for operations
- **Toolbar Controls**: Easy access to modeling operations
- **Keyboard Shortcuts**: Professional hotkey support
- **2D/3D Views**: Toggle between perspective and orthographic cameras
- **Undo/Redo**: Full command history with visual feedback

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Architecture

#### State Management

Uses Zustand for global state management:

```typescript
// store.ts
export const useAppStore = create<AppState>((set, get) => ({
  mesh: null,
  selectedFaceId: null,
  viewMode: '3d',
  
  setMesh: (mesh) => set({ mesh }),
  executeCommand: (command) => {
    // Execute command and update mesh
  },
}));
```

#### Components

- **App**: Main application container
- **ThreeJSViewer**: 3D viewport with face selection
- **Toolbar**: Modeling operations and controls

#### Hooks

- **useKeyboard**: Global keyboard shortcut handling

### Three.js Integration

The `ThreeJSViewer` component converts kernel meshes to Three.js geometry:

```typescript
const meshToThreeJS = (kernelMesh: Mesh): THREE.Group => {
  const group = new THREE.Group();
  
  const faces = kernelMesh.faces();
  faces.forEach(face => {
    const faceVertices = kernelMesh.getFaceVertices(face.id);
    const geometry = new THREE.BufferGeometry();
    
    // Triangulate face and create Three.js mesh
    // Add wireframe overlay
    // Handle face selection highlighting
  });
  
  return group;
};
```

### Adding New UI Features

#### New Modeling Operation

1. Add the operation to the kernel package
2. Create a button in `Toolbar.tsx`:

```typescript
const handleMyOperation = () => {
  if (selectedFaceId) {
    const command = new MyOperationCommand(selectedFaceId, params);
    executeCommand(command);
  }
};

<button onClick={handleMyOperation}>
  My Operation
</button>
```

3. Add keyboard shortcut in `useKeyboard.ts`:

```typescript
case 'KeyM':
  if (selectedFaceId) {
    const command = new MyOperationCommand(selectedFaceId, params);
    executeCommand(command);
  }
  break;
```

#### New View Mode

1. Add the mode to the store:

```typescript
export type ViewMode = '2d' | '3d' | 'myview';
```

2. Handle the mode in `ThreeJSViewer.tsx`:

```typescript
useEffect(() => {
  if (viewMode === 'myview') {
    // Setup custom camera and controls
  }
}, [viewMode]);
```

### Styling

Uses Tailwind CSS for all styling. Key design principles:

- **Dark Theme**: Gray-800 sidebar, gray-900 background
- **Color Coding**: 
  - Green: Primitive creation
  - Purple: Modeling operations
  - Orange: History operations
  - Blue: View controls
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Proper contrast and focus states

### Performance Optimization

#### Rendering
- Geometry buffers are reused when possible
- Wireframe overlays share geometry with face meshes
- Material batching for similar faces

#### State Updates
- Mesh cloning triggers re-render only when necessary
- Three.js objects are cached and updated incrementally
- Command execution is synchronous for immediate feedback

#### Memory Management
- Three.js geometries and materials are properly disposed
- Event listeners are cleaned up in useEffect returns
- Large meshes could benefit from LOD (not yet implemented)

### Debugging

Development tools and techniques:

#### State Inspection
```typescript
// Add to any component
const state = useAppStore.getState();
console.log('Current mesh:', state.mesh);
console.log('Command history:', state.commandHistory.history);
```

#### Three.js Debugging
```typescript
// Add to ThreeJSViewer
useEffect(() => {
  if (import.meta.env.DEV) {
    // Add Three.js inspector
    window.scene = sceneRef.current;
    window.renderer = rendererRef.current;
  }
}, []);
```

#### Performance Monitoring
```typescript
// Add frame time tracking
const stats = new Stats();
document.body.appendChild(stats.dom);

const animate = () => {
  stats.begin();
  renderer.render(scene, camera);
  stats.end();
};
```

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebGL**: Required for Three.js rendering
- **ES2022**: Uses modern JavaScript features
- **No IE Support**: Requires native ES modules and modern APIs

### Deployment

#### Build Configuration

Vite configuration optimizes for production:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2022',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three'],
        },
      },
    },
  },
});
```

#### Static Hosting

The app builds to static files and can be hosted on:
- Vercel, Netlify, or similar JAMstack platforms
- GitHub Pages
- Any static file server

#### Environment Variables

```bash
# .env.local
VITE_API_URL=https://api.example.com
VITE_DEBUG_MODE=true
```

### Future Enhancements

Planned web app improvements:

#### UI/UX
- **Property Panel**: Edit vertex positions, face materials
- **Layer System**: Organize mesh objects
- **Material Editor**: PBR material authoring
- **Animation Timeline**: Keyframe-based animation
- **Viewport Gizmos**: Transform handles for move/rotate/scale

#### Performance
- **WebWorker Integration**: Move heavy operations to background
- **Streaming**: Load/save large files progressively
- **LOD Rendering**: Level-of-detail for complex scenes
- **Instancing**: Efficient rendering of repeated geometry

#### Features
- **Sketching Mode**: 2D profile creation for extrusion
- **Measurement Tools**: Distance, angle, area calculation
- **Reference Images**: Background image overlay for modeling
- **Plugin System**: User-created extensions
- **Collaboration**: Real-time multi-user editing

## License

MIT