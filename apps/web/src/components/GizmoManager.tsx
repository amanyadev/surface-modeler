import * as THREE from 'three';
import { HalfEdgeMesh } from '@half-edge/kernel';
import { 
  createVertexGizmo, 
  createEdgeGizmo, 
  createFaceGizmo, 
  updateGizmoScale,
  GizmoColors 
} from '../utils/screenSpaceUtils';

export interface GizmoState {
  hoveredVertexId: string | null;
  hoveredEdgeId: string | null;
  hoveredFaceId: string | null;
  selectedVertexId: string | null;
  selectedEdgeId: string | null;
  selectedFaceId: string | null;
}

export class GizmoManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private mesh: HalfEdgeMesh;
  private gizmoGroup: THREE.Group;
  
  private vertexGizmos: Map<string, THREE.Mesh> = new Map();
  private edgeGizmos: Map<string, THREE.Mesh> = new Map();
  private faceGizmos: Map<string, THREE.Mesh> = new Map();
  
  private state: GizmoState = {
    hoveredVertexId: null,
    hoveredEdgeId: null,
    hoveredFaceId: null,
    selectedVertexId: null,
    selectedEdgeId: null,
    selectedFaceId: null,
  };

  constructor(scene: THREE.Scene, camera: THREE.Camera, mesh: HalfEdgeMesh) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = mesh;
    
    this.gizmoGroup = new THREE.Group();
    this.gizmoGroup.name = 'GizmoGroup';
    this.scene.add(this.gizmoGroup);
  }

  updateState(newState: Partial<GizmoState>) {
    this.state = { ...this.state, ...newState };
    this.updateGizmoVisuals();
  }

  updateMesh(mesh: HalfEdgeMesh) {
    this.mesh = mesh;
    this.clearAllGizmos();
    this.createAllGizmos();
  }

  setSelectionMode(mode: 'vertex' | 'edge' | 'face' | 'mesh') {
    // Show only relevant gizmos based on selection mode
    this.vertexGizmos.forEach(gizmo => {
      gizmo.visible = mode === 'vertex' || this.isVertexSelected(gizmo.userData.vertexId);
    });
    
    this.edgeGizmos.forEach(gizmo => {
      gizmo.visible = mode === 'edge' || this.isEdgeSelected(gizmo.userData.edgeId);
    });
    
    this.faceGizmos.forEach(gizmo => {
      gizmo.visible = mode === 'face' || this.isFaceSelected(gizmo.userData.faceId);
    });
  }

  private isVertexSelected(vertexId: string): boolean {
    return this.state.selectedVertexId === vertexId;
  }

  private isEdgeSelected(edgeId: string): boolean {
    return this.state.selectedEdgeId === edgeId;
  }

  private isFaceSelected(faceId: string): boolean {
    return this.state.selectedFaceId === faceId;
  }

  private isVertexHovered(vertexId: string): boolean {
    return this.state.hoveredVertexId === vertexId;
  }

  private isEdgeHovered(edgeId: string): boolean {
    return this.state.hoveredEdgeId === edgeId;
  }

  private isFaceHovered(faceId: string): boolean {
    return this.state.hoveredFaceId === faceId;
  }

  createAllGizmos() {
    this.createVertexGizmos();
    this.createEdgeGizmos();
    this.createFaceGizmos();
  }

  createVertexGizmos() {
    const vertices = this.mesh.vertices();
    
    vertices.forEach(vertex => {
      const position = new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z);
      const state = this.getVertexState(vertex.id);
      
      const gizmo = createVertexGizmo(position, this.camera, state, 10);
      gizmo.userData = {
        type: 'vertex-gizmo',
        vertexId: vertex.id,
        originalPosition: position.clone()
      };
      
      // Make gizmos render on top
      gizmo.renderOrder = 1000;
      
      this.vertexGizmos.set(vertex.id, gizmo);
      this.gizmoGroup.add(gizmo);
    });
  }

  createEdgeGizmos() {
    const edges = this.mesh.edges();
    
    edges.forEach(edge => {
      const halfEdge = this.mesh.getHalfEdge(edge.halfEdge);
      if (!halfEdge) return;

      const targetVertex = this.mesh.getVertex(halfEdge.vertex);
      const prevHalfEdge = halfEdge.prev ? this.mesh.getHalfEdge(halfEdge.prev) : null;
      const sourceVertex = prevHalfEdge ? this.mesh.getVertex(prevHalfEdge.vertex) : null;

      if (targetVertex && sourceVertex) {
        const startPos = new THREE.Vector3(sourceVertex.pos.x, sourceVertex.pos.y, sourceVertex.pos.z);
        const endPos = new THREE.Vector3(targetVertex.pos.x, targetVertex.pos.y, targetVertex.pos.z);
        const state = this.getEdgeState(edge.id);
        
        const gizmo = createEdgeGizmo(startPos, endPos, this.camera, state, 3);
        gizmo.userData = {
          type: 'edge-gizmo',
          edgeId: edge.id,
          startPos: startPos.clone(),
          endPos: endPos.clone()
        };
        
        gizmo.renderOrder = 999;
        
        this.edgeGizmos.set(edge.id, gizmo);
        this.gizmoGroup.add(gizmo);
      }
    });
  }

  createFaceGizmos() {
    const faces = this.mesh.faces();
    
    faces.forEach(face => {
      const faceVertices = this.mesh.getFaceVertices(face.id);
      
      if (faceVertices.length >= 3) {
        const vertices = faceVertices.map(v => 
          new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z)
        );
        const state = this.getFaceState(face.id);
        
        const gizmo = createFaceGizmo(vertices, state);
        gizmo.userData = {
          type: 'face-gizmo',
          faceId: face.id,
          vertices: vertices
        };
        
        gizmo.renderOrder = 998;
        
        this.faceGizmos.set(face.id, gizmo);
        this.gizmoGroup.add(gizmo);
      }
    });
  }

  private getVertexState(vertexId: string): 'normal' | 'hover' | 'selected' {
    if (this.isVertexSelected(vertexId)) return 'selected';
    if (this.isVertexHovered(vertexId)) return 'hover';
    return 'normal';
  }

  private getEdgeState(edgeId: string): 'normal' | 'hover' | 'selected' {
    if (this.isEdgeSelected(edgeId)) return 'selected';
    if (this.isEdgeHovered(edgeId)) return 'hover';
    return 'normal';
  }

  private getFaceState(faceId: string): 'normal' | 'hover' | 'selected' {
    if (this.isFaceSelected(faceId)) return 'selected';
    if (this.isFaceHovered(faceId)) return 'hover';
    return 'normal';
  }

  updateGizmoVisuals() {
    // Update vertex gizmo colors and states
    this.vertexGizmos.forEach((gizmo, vertexId) => {
      const state = this.getVertexState(vertexId);
      const color = GizmoColors.vertex[state];
      
      if (gizmo.material instanceof THREE.MeshBasicMaterial) {
        gizmo.material.color.setHex(color);
        gizmo.material.opacity = state === 'selected' ? 1.0 : 0.8;
      }
    });

    // Update edge gizmo colors and states
    this.edgeGizmos.forEach((gizmo, edgeId) => {
      const state = this.getEdgeState(edgeId);
      const color = GizmoColors.edge[state];
      
      if (gizmo.material instanceof THREE.MeshBasicMaterial) {
        gizmo.material.color.setHex(color);
        gizmo.material.opacity = state === 'normal' ? 0.6 : (state === 'hover' ? 0.8 : 1.0);
      }
    });

    // Update face gizmo colors and states
    this.faceGizmos.forEach((gizmo, faceId) => {
      const state = this.getFaceState(faceId);
      const color = GizmoColors.face[state];
      
      if (gizmo.material instanceof THREE.MeshBasicMaterial) {
        gizmo.material.color.setHex(color);
        gizmo.material.opacity = state === 'normal' ? 0.1 : (state === 'hover' ? 0.2 : 0.4);
      }
    });
  }

  updateCameraScale() {
    // Update all vertex gizmos to maintain screen-space size
    this.vertexGizmos.forEach(gizmo => {
      const position = gizmo.userData.originalPosition;
      updateGizmoScale(gizmo, position, this.camera, 10);
    });

    // Update edge gizmos
    this.edgeGizmos.forEach(gizmo => {
      const { startPos, endPos } = gizmo.userData;
      const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      updateGizmoScale(gizmo, midPoint, this.camera, 3);
    });
  }

  clearAllGizmos() {
    this.gizmoGroup.clear();
    this.vertexGizmos.clear();
    this.edgeGizmos.clear();
    this.faceGizmos.clear();
  }

  dispose() {
    this.clearAllGizmos();
    this.scene.remove(this.gizmoGroup);
  }

  // Get all gizmo objects for raycasting
  getSelectableObjects(): THREE.Object3D[] {
    return [
      ...Array.from(this.vertexGizmos.values()),
      ...Array.from(this.edgeGizmos.values()),
      ...Array.from(this.faceGizmos.values())
    ];
  }
}