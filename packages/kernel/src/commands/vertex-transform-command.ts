import { BaseCommand } from './base-command.js';
import { Vec3 } from '../core/types.js';

interface Mesh {
  getVertex(id: string): any;
  updateVertex(id: string, position: Vec3): void;
  recalculateNormals?(): void;
}

export class VertexTransformCommand extends BaseCommand {
  private vertexId: string;
  private newPosition: Vec3;
  private oldPosition?: Vec3;

  constructor(vertexId: string, newPosition: Vec3) {
    super('vertex_transform');
    this.vertexId = vertexId;
    this.newPosition = { ...newPosition };
  }

  do(mesh: Mesh): void {
    console.log('🔧 VertexTransformCommand.do() called');
    console.log('🔧 vertexId:', this.vertexId, 'newPosition:', this.newPosition);
    
    const vertex = mesh.getVertex(this.vertexId);
    console.log('🔧 Found vertex:', vertex);
    
    if (!vertex) {
      console.error('❌ Vertex not found:', this.vertexId);
      throw new Error(`Vertex ${this.vertexId} not found`);
    }

    // Store old position for undo
    this.oldPosition = { ...vertex.pos };
    console.log('💾 Stored old position:', this.oldPosition);
    
    // Update vertex position
    console.log('🔄 Calling mesh.updateVertex...');
    mesh.updateVertex(this.vertexId, this.newPosition);
    console.log('✅ mesh.updateVertex completed');
    
    // Verify the update worked
    const updatedVertex = mesh.getVertex(this.vertexId);
    console.log('🔍 Vertex after update:', updatedVertex);
    
    // Recalculate normals if method exists
    if (mesh.recalculateNormals) {
      console.log('🔄 Recalculating normals...');
      mesh.recalculateNormals();
      console.log('✅ Normals recalculated');
    } else {
      console.log('⚠️ No recalculateNormals method on mesh');
    }
    
    console.log('✅ VertexTransformCommand.do() completed');
  }

  undo(mesh: Mesh): void {
    if (!this.oldPosition) {
      throw new Error('Cannot undo - no old position stored');
    }

    mesh.updateVertex(this.vertexId, this.oldPosition);
    
    // Recalculate normals if method exists
    if (mesh.recalculateNormals) {
      mesh.recalculateNormals();
    }
  }

  canExecute(mesh: Mesh): boolean {
    return mesh.getVertex(this.vertexId) !== undefined;
  }

  canUndo(_mesh: Mesh): boolean {
    return this.oldPosition !== undefined;
  }
}