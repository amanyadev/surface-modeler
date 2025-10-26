import React, { useState } from 'react';
import { HalfEdgeMesh } from '@half-edge/kernel';
import * as THREE from 'three';
import { FloatingWidget } from './FloatingWidget';

interface HalfEdgeVisualizationProps {
  mesh: HalfEdgeMesh;
  scene: THREE.Scene;
  selectedVertexId?: string | null;
  selectedEdgeId?: string | null;
  selectedFaceId?: string | null;
}

interface VisualizationSettings {
  showHalfEdges: boolean;
  showVertexLabels: boolean;
  showEdgeLabels: boolean;
  showFaceLabels: boolean;
  showNormals: boolean;
  halfEdgeArrowSize: number;
  normalLength: number;
  wireframeOpacity: number;
}

export const HalfEdgeVisualization: React.FC<HalfEdgeVisualizationProps> = ({
  mesh,
  scene,
  selectedVertexId,
  selectedEdgeId,
  selectedFaceId
}) => {
  const [settings, setSettings] = useState<VisualizationSettings>({
    showHalfEdges: false,
    showVertexLabels: false,
    showEdgeLabels: false,
    showFaceLabels: false,
    showNormals: false,
    halfEdgeArrowSize: 0.1,
    normalLength: 0.5,
    wireframeOpacity: 0.7
  });


  // Create half-edge arrows
  const createHalfEdgeArrows = () => {
    const arrowGroup = new THREE.Group();
    arrowGroup.name = 'halfEdgeArrows';

    for (const [halfEdgeId, halfEdge] of mesh.data.halfEdges) {
      const targetVertex = mesh.getVertex(halfEdge.vertex);
      if (!targetVertex) continue;

      // Find source vertex
      let sourceVertex;
      if (halfEdge.prev) {
        const prevHalfEdge = mesh.getHalfEdge(halfEdge.prev);
        if (prevHalfEdge) {
          sourceVertex = mesh.getVertex(prevHalfEdge.vertex);
        }
      }

      if (!sourceVertex) continue;

      // Create arrow geometry
      const direction = new THREE.Vector3()
        .subVectors(
          new THREE.Vector3(targetVertex.pos.x, targetVertex.pos.y, targetVertex.pos.z),
          new THREE.Vector3(sourceVertex.pos.x, sourceVertex.pos.y, sourceVertex.pos.z)
        )
        .normalize();

      const origin = new THREE.Vector3(sourceVertex.pos.x, sourceVertex.pos.y, sourceVertex.pos.z)
        .add(direction.clone().multiplyScalar(0.1)); // Offset from source

      const arrowHelper = new THREE.ArrowHelper(
        direction,
        origin,
        direction.length() * 0.8, // Length
        halfEdge.face ? 0x4285f4 : 0xff6b35, // Blue for face edges, orange for boundary
        settings.halfEdgeArrowSize,
        settings.halfEdgeArrowSize * 0.5
      );

      arrowHelper.userData = { type: 'halfEdge', halfEdgeId, halfEdge };
      arrowGroup.add(arrowHelper);
    }

    return arrowGroup;
  };

  // Create normal vectors
  const createNormalVectors = () => {
    const normalGroup = new THREE.Group();
    normalGroup.name = 'normals';

    for (const [faceId, face] of mesh.data.faces) {
      if (!face.normal) continue;

      const faceVertices = mesh.getFaceVertices(faceId);
      if (faceVertices.length === 0) continue;

      // Calculate face center
      const center = { x: 0, y: 0, z: 0 };
      for (const vertex of faceVertices) {
        center.x += vertex.pos.x;
        center.y += vertex.pos.y;
        center.z += vertex.pos.z;
      }
      center.x /= faceVertices.length;
      center.y /= faceVertices.length;
      center.z /= faceVertices.length;

      // Create normal arrow
      const normalDirection = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z);
      const normalOrigin = new THREE.Vector3(center.x, center.y, center.z);

      const normalArrow = new THREE.ArrowHelper(
        normalDirection,
        normalOrigin,
        settings.normalLength,
        selectedFaceId === faceId ? 0xff0000 : 0x00ff00,
        0.05,
        0.025
      );

      normalArrow.userData = { type: 'normal', faceId };
      normalGroup.add(normalArrow);
    }

    return normalGroup;
  };

  // Create text labels
  const createLabels = () => {
    // Note: In a real implementation, you'd use a text rendering library
    // For now, we'll create simple sphere markers with different colors
    const labelGroup = new THREE.Group();
    labelGroup.name = 'labels';

    if (settings.showVertexLabels) {
      mesh.vertices().forEach((vertex, index) => {
        const geometry = new THREE.SphereGeometry(0.05, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xffff00,
          transparent: true,
          opacity: 0.8 
        });
        const label = new THREE.Mesh(geometry, material);
        label.position.set(vertex.pos.x, vertex.pos.y + 0.2, vertex.pos.z);
        label.userData = { type: 'vertexLabel', vertexId: vertex.id, index };
        labelGroup.add(label);
      });
    }

    return labelGroup;
  };

  // Update visualization based on settings
  React.useEffect(() => {
    // Remove existing visualization objects
    const existingArrows = scene.getObjectByName('halfEdgeArrows');
    const existingNormals = scene.getObjectByName('normals');
    const existingLabels = scene.getObjectByName('labels');

    if (existingArrows) scene.remove(existingArrows);
    if (existingNormals) scene.remove(existingNormals);
    if (existingLabels) scene.remove(existingLabels);

    // Add new visualization objects based on settings
    if (settings.showHalfEdges) {
      scene.add(createHalfEdgeArrows());
    }

    if (settings.showNormals) {
      scene.add(createNormalVectors());
    }

    if (settings.showVertexLabels || settings.showEdgeLabels || settings.showFaceLabels) {
      scene.add(createLabels());
    }

    // Update wireframe opacity
    scene.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = settings.wireframeOpacity;
        material.transparent = settings.wireframeOpacity < 1;
      }
    });

  }, [mesh, settings, selectedVertexId, selectedEdgeId, selectedFaceId, scene]);


  return (
    <FloatingWidget
      title="Half-Edge Visualization"
      icon="HE"
      iconBgColor="bg-blue-600"
      defaultPosition={{ x: window.innerWidth / 2 - 150, y: 100 }}
      isCollapsible={true}
      defaultCollapsed={true}
      zIndex={50}
    >
      <div className="space-y-2 min-w-48">
        <div className="flex items-center justify-between">
          <label>Half-Edge Arrows</label>
          <input
            type="checkbox"
            checked={settings.showHalfEdges}
            onChange={(e) => setSettings(prev => ({ ...prev, showHalfEdges: e.target.checked }))}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label>Face Normals</label>
          <input
            type="checkbox"
            checked={settings.showNormals}
            onChange={(e) => setSettings(prev => ({ ...prev, showNormals: e.target.checked }))}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label>Vertex Labels</label>
          <input
            type="checkbox"
            checked={settings.showVertexLabels}
            onChange={(e) => setSettings(prev => ({ ...prev, showVertexLabels: e.target.checked }))}
            className="rounded"
          />
        </div>

        {settings.showHalfEdges && (
          <div className="flex items-center justify-between">
            <label>Arrow Size</label>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={settings.halfEdgeArrowSize}
              onChange={(e) => setSettings(prev => ({ ...prev, halfEdgeArrowSize: parseFloat(e.target.value) }))}
              className="w-16"
            />
          </div>
        )}

        {settings.showNormals && (
          <div className="flex items-center justify-between">
            <label>Normal Length</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.normalLength}
              onChange={(e) => setSettings(prev => ({ ...prev, normalLength: parseFloat(e.target.value) }))}
              className="w-16"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <label>Wireframe Opacity</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={settings.wireframeOpacity}
            onChange={(e) => setSettings(prev => ({ ...prev, wireframeOpacity: parseFloat(e.target.value) }))}
            className="w-16"
          />
        </div>

        {/* Mesh Statistics */}
        <div className="mt-3 pt-2 border-t border-white/20 text-white/70">
          <div>Vertices: {mesh.vertices().length}</div>
          <div>Edges: {mesh.edges().length}</div>
          <div>Faces: {mesh.faces().length}</div>
          <div>Half-Edges: {mesh.data.halfEdges.size}</div>
        </div>

        {/* Selection Info */}
        {(selectedVertexId || selectedEdgeId || selectedFaceId) && (
          <div className="mt-2 pt-2 border-t border-white/20 text-white/70">
            <div className="font-medium text-white">Selected:</div>
            {selectedVertexId && <div>Vertex: {selectedVertexId.slice(0, 8)}...</div>}
            {selectedEdgeId && <div>Edge: {selectedEdgeId.slice(0, 8)}...</div>}
            {selectedFaceId && <div>Face: {selectedFaceId.slice(0, 8)}...</div>}
          </div>
        )}
      </div>
    </FloatingWidget>
  );
};

export default HalfEdgeVisualization;