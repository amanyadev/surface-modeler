import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface EnhancedGridProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  size?: number;
  divisions?: number;
  showLabels?: boolean;
  showAxes?: boolean;
  adaptive?: boolean;
  opacity?: number;
}

export const EnhancedGrid: React.FC<EnhancedGridProps> = ({
  scene,
  camera,
  size = 50,
  divisions = 50,
  showLabels = true,
  showAxes = true,
  adaptive = true,
  opacity = 0.7
}) => {
  const gridGroupRef = useRef<THREE.Group>();
  const labelGroupRef = useRef<THREE.Group>();
  const axesGroupRef = useRef<THREE.Group>();
  
  // Create enhanced grid with multiple scales
  const createEnhancedGrid = useMemo(() => {
    return () => {
      // Clear existing grids
      if (gridGroupRef.current) {
        scene.remove(gridGroupRef.current);
        gridGroupRef.current.clear();
      }
      if (labelGroupRef.current) {
        scene.remove(labelGroupRef.current);
        labelGroupRef.current.clear();
      }
      if (axesGroupRef.current) {
        scene.remove(axesGroupRef.current);
        axesGroupRef.current.clear();
      }

      // Create main grid group
      const gridGroup = new THREE.Group();
      gridGroup.name = 'EnhancedGrid';
      gridGroupRef.current = gridGroup;

      // Calculate dynamic grid parameters based on camera distance
      const cameraDistance = camera.position.length();
      const adaptiveSize = adaptive ? Math.max(size, cameraDistance * 2) : size;
      const adaptiveDivisions = adaptive ? 
        Math.max(10, Math.min(100, Math.floor(adaptiveSize / 2))) : divisions;

      // Create major grid (every 5th line)
      const majorGridHelper = new THREE.GridHelper(
        adaptiveSize, 
        Math.floor(adaptiveDivisions / 5),
        new THREE.Color(0x888888),
        new THREE.Color(0x444444)
      );
      majorGridHelper.material.opacity = opacity * 0.8;
      majorGridHelper.material.transparent = true;
      majorGridHelper.material.depthWrite = false;
      majorGridHelper.renderOrder = 1;
      gridGroup.add(majorGridHelper);

      // Create minor grid (all divisions)
      const minorGridHelper = new THREE.GridHelper(
        adaptiveSize,
        adaptiveDivisions,
        new THREE.Color(0x333333),
        new THREE.Color(0x222222)
      );
      minorGridHelper.material.opacity = opacity * 0.3;
      minorGridHelper.material.transparent = true;
      minorGridHelper.material.depthWrite = false;
      minorGridHelper.renderOrder = 0;
      gridGroup.add(minorGridHelper);

      // Create ground plane for better depth perception
      const planeGeometry = new THREE.PlaneGeometry(adaptiveSize, adaptiveSize);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: opacity * 0.1,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.001; // Slightly below grid to avoid z-fighting
      plane.renderOrder = -1;
      gridGroup.add(plane);

      // Add coordinate axes if enabled
      if (showAxes) {
        const axesGroup = new THREE.Group();
        axesGroup.name = 'CoordinateAxes';
        axesGroupRef.current = axesGroup;

        // X-axis (red)
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(adaptiveSize / 4, 0, 0)
        ]);
        const xMaterial = new THREE.LineBasicMaterial({ 
          color: 0xff4444, 
          linewidth: 3,
          transparent: true,
          opacity: opacity
        });
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        axesGroup.add(xAxis);

        // Y-axis (green)
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, adaptiveSize / 4, 0)
        ]);
        const yMaterial = new THREE.LineBasicMaterial({ 
          color: 0x44ff44, 
          linewidth: 3,
          transparent: true,
          opacity: opacity
        });
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        axesGroup.add(yAxis);

        // Z-axis (blue)
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, adaptiveSize / 4)
        ]);
        const zMaterial = new THREE.LineBasicMaterial({ 
          color: 0x4444ff, 
          linewidth: 3,
          transparent: true,
          opacity: opacity
        });
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        axesGroup.add(zAxis);

        // Add axis labels
        if (showLabels) {
          // Create text sprites for axis labels
          const createTextSprite = (text: string, color: number, position: THREE.Vector3) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.width = 128;
            canvas.height = 64;
            
            context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            context.font = 'Bold 24px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 64, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
              map: texture,
              transparent: true,
              opacity: opacity * 0.8
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.scale.set(2, 1, 1);
            
            return sprite;
          };

          // Add axis labels
          axesGroup.add(createTextSprite('X', 0xff4444, new THREE.Vector3(adaptiveSize / 4 + 1, 0, 0)));
          axesGroup.add(createTextSprite('Y', 0x44ff44, new THREE.Vector3(0, adaptiveSize / 4 + 1, 0)));
          axesGroup.add(createTextSprite('Z', 0x4444ff, new THREE.Vector3(0, 0, adaptiveSize / 4 + 1)));
        }

        scene.add(axesGroup);
      }

      // Add grid labels if enabled
      if (showLabels) {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'GridLabels';
        labelGroupRef.current = labelGroup;

        const createGridLabel = (text: string, position: THREE.Vector3) => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = 64;
          canvas.height = 32;
          
          context.fillStyle = '#888888';
          context.font = '16px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(text, 32, 16);
          
          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: opacity * 0.6
          });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.position.copy(position);
          sprite.scale.set(1, 0.5, 1);
          
          return sprite;
        };

        // Add grid coordinate labels at major intervals
        const majorInterval = adaptiveSize / Math.floor(adaptiveDivisions / 5);
        const labelStep = majorInterval;
        const maxLabels = 10; // Limit number of labels to avoid clutter
        
        for (let i = -maxLabels; i <= maxLabels; i++) {
          if (i === 0) continue; // Skip origin
          
          const pos = i * labelStep;
          if (Math.abs(pos) <= adaptiveSize / 2) {
            // X-axis labels
            labelGroup.add(createGridLabel(
              pos.toFixed(0), 
              new THREE.Vector3(pos, 0.2, -adaptiveSize / 2 + 2)
            ));
            
            // Z-axis labels
            labelGroup.add(createGridLabel(
              pos.toFixed(0), 
              new THREE.Vector3(-adaptiveSize / 2 + 2, 0.2, pos)
            ));
          }
        }

        scene.add(labelGroup);
      }

      scene.add(gridGroup);
    };
  }, [scene, camera, size, divisions, showLabels, showAxes, adaptive, opacity]);

  // Update grid based on camera changes
  useEffect(() => {
    if (!scene || !camera) return;

    createEnhancedGrid();

    // Set up camera change listener for adaptive grid
    const updateGrid = () => {
      if (adaptive && gridGroupRef.current) {
        // Update grid opacity based on camera angle
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const upVector = new THREE.Vector3(0, 1, 0);
        const angle = Math.abs(cameraDirection.dot(upVector));
        
        // Fade grid when looking straight down or up
        const fadeOpacity = Math.max(0.1, Math.min(1.0, angle * 2));
        
        gridGroupRef.current.traverse((child) => {
          if (child instanceof THREE.GridHelper) {
            child.material.opacity = opacity * fadeOpacity * 0.8;
          } else if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.Material & { opacity?: number }).opacity = 
              opacity * fadeOpacity * 0.1;
          }
        });

        if (labelGroupRef.current) {
          labelGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Sprite && child.material) {
              child.material.opacity = opacity * fadeOpacity * 0.6;
            }
          });
        }

        if (axesGroupRef.current) {
          axesGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Line && child.material) {
              (child.material as THREE.LineBasicMaterial).opacity = opacity * fadeOpacity;
            } else if (child instanceof THREE.Sprite && child.material) {
              child.material.opacity = opacity * fadeOpacity * 0.8;
            }
          });
        }
      }
    };

    // Initial grid creation
    updateGrid();

    // Set up animation loop for adaptive updates
    let animationId: number;
    const animate = () => {
      updateGrid();
      animationId = requestAnimationFrame(animate);
    };
    
    if (adaptive) {
      animate();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Cleanup
      if (gridGroupRef.current) {
        scene.remove(gridGroupRef.current);
        gridGroupRef.current.clear();
      }
      if (labelGroupRef.current) {
        scene.remove(labelGroupRef.current);
        labelGroupRef.current.clear();
      }
      if (axesGroupRef.current) {
        scene.remove(axesGroupRef.current);
        axesGroupRef.current.clear();
      }
    };
  }, [createEnhancedGrid, adaptive, opacity]);

  return null; // This component only manages Three.js objects
};