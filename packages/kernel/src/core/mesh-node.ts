import { Transform } from './types.js';
import { generateId } from '../utils/id.js';

export interface MeshNode {
  readonly id: string;
  name: string;
  transform: Transform;
  parent?: string;
  children: string[];
  visible: boolean;
}

export class MeshHierarchy {
  private nodes = new Map<string, MeshNode>();
  private rootNodes = new Set<string>();

  createNode(name: string, transform?: Partial<Transform>, id?: string): MeshNode {
    const nodeId = id || generateId();
    const node: MeshNode = {
      id: nodeId,
      name,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        ...transform
      },
      children: [],
      visible: true
    };

    this.nodes.set(nodeId, node);
    this.rootNodes.add(nodeId);
    return node;
  }

  getNode(id: string): MeshNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): MeshNode[] {
    return Array.from(this.nodes.values());
  }

  getRootNodes(): MeshNode[] {
    return Array.from(this.rootNodes).map(id => this.nodes.get(id)!).filter(Boolean);
  }

  getChildren(nodeId: string): MeshNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.children.map(id => this.nodes.get(id)!).filter(Boolean);
  }

  addChild(parentId: string, childId: string): boolean {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    
    if (!parent || !child) return false;
    if (child.parent === parentId) return true; // Already a child
    
    // Remove from previous parent
    if (child.parent) {
      this.removeChild(child.parent, childId);
    } else {
      this.rootNodes.delete(childId);
    }

    // Add to new parent
    parent.children.push(childId);
    child.parent = parentId;
    
    return true;
  }

  removeChild(parentId: string, childId: string): boolean {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    
    if (!parent || !child) return false;
    
    const index = parent.children.indexOf(childId);
    if (index === -1) return false;
    
    parent.children.splice(index, 1);
    child.parent = undefined;
    this.rootNodes.add(childId);
    
    return true;
  }

  deleteNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Move children to root or parent
    const targetParent = node.parent;
    for (const childId of node.children) {
      if (targetParent) {
        this.addChild(targetParent, childId);
      } else {
        const child = this.nodes.get(childId);
        if (child) {
          child.parent = undefined;
          this.rootNodes.add(childId);
        }
      }
    }

    // Remove from parent
    if (node.parent) {
      this.removeChild(node.parent, nodeId);
    } else {
      this.rootNodes.delete(nodeId);
    }

    this.nodes.delete(nodeId);
    return true;
  }

  setTransform(nodeId: string, transform: Partial<Transform>): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    if (transform.position) {
      node.transform.position = { ...transform.position };
    }
    if (transform.rotation) {
      node.transform.rotation = { ...transform.rotation };
    }
    if (transform.scale) {
      node.transform.scale = { ...transform.scale };
    }

    return true;
  }

  getWorldTransform(nodeId: string): Transform | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    let worldTransform = { ...node.transform };

    // Accumulate parent transforms
    let current = node;
    while (current.parent) {
      const parent = this.nodes.get(current.parent);
      if (!parent) break;

      // Simple transform composition (position only for now)
      worldTransform.position.x += parent.transform.position.x;
      worldTransform.position.y += parent.transform.position.y;
      worldTransform.position.z += parent.transform.position.z;

      current = parent;
    }

    return worldTransform;
  }

  setVisibility(nodeId: string, visible: boolean): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    
    node.visible = visible;
    return true;
  }

  isVisible(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Check if this node and all parents are visible
    let current: MeshNode | undefined = node;
    while (current) {
      if (!current.visible) return false;
      current = current.parent ? this.nodes.get(current.parent) : undefined;
    }

    return true;
  }

  clear(): void {
    this.nodes.clear();
    this.rootNodes.clear();
  }
}