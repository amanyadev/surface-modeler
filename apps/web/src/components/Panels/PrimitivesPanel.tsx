import React from 'react';
import { useAppStore } from '../../store';
import { 
  createPlane, 
  createCube, 
  createCylinder, 
  createSphere,
  createTorus,
  createIcosahedron,
  createPyramid,
  createOctahedron,
  createDodecahedron,
  HalfEdgeMesh 
} from '@half-edge/kernel';

export const PrimitivesPanel: React.FC = () => {
  const { setMesh } = useAppStore();

  const primitives = [
    { 
      name: 'Plane', 
      icon: 'PL',
      description: 'Flat rectangular surface',
      action: () => setMesh(createPlane(2, 2) as HalfEdgeMesh) 
    },
    { 
      name: 'Cube', 
      icon: 'CB',
      description: 'Six-sided rectangular box',
      action: () => setMesh(createCube(2) as HalfEdgeMesh) 
    },
    { 
      name: 'Cylinder', 
      icon: 'CY',
      description: 'Circular tube shape',
      action: () => setMesh(createCylinder(1, 2, 64) as HalfEdgeMesh) 
    },
    { 
      name: 'Sphere', 
      icon: 'SP',
      description: 'Perfect round ball',
      action: () => setMesh(createSphere(1, 32, 16) as HalfEdgeMesh) 
    },
    { 
      name: 'Torus', 
      icon: 'TO',
      description: 'Donut-shaped ring',
      action: () => setMesh(createTorus(1, 0.4, 32, 16) as HalfEdgeMesh) 
    },
    { 
      name: 'Icosahedron', 
      icon: 'IC',
      description: '20-sided polyhedron',
      action: () => setMesh(createIcosahedron(1) as HalfEdgeMesh) 
    },
    { 
      name: 'Pyramid', 
      icon: 'PY',
      description: 'Square-based pyramid',
      action: () => setMesh(createPyramid(2, 2) as HalfEdgeMesh) 
    },
    { 
      name: 'Octahedron', 
      icon: 'OC',
      description: '8-sided double pyramid',
      action: () => setMesh(createOctahedron(1) as HalfEdgeMesh) 
    },
    { 
      name: 'Dodecahedron', 
      icon: 'DO',
      description: '12-sided polyhedron',
      action: () => setMesh(createDodecahedron(1) as HalfEdgeMesh) 
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm text-gray-300 mb-4">Create geometric shapes</div>
      
      {primitives.map((primitive) => (
        <button
          key={primitive.name}
          onClick={primitive.action}
          className="w-full p-4 text-left bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-gray-500 transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs font-bold text-white">
              {primitive.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-white">{primitive.name}</div>
              <div className="text-xs text-gray-400 group-hover:text-gray-300">
                {primitive.description}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};