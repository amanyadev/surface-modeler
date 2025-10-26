import { BaseCommand } from './base-command.js';
import { Vec3 } from '../core/types.js';

interface Mesh {
  getEdge(id: string): any;
  getHalfEdge(id: string): any;
  getVertex(id: string): any;
  updateVertex(id: string, position: Vec3): void;
  recalculateNormals?(): void;
}

export class EdgeTransformCommand extends BaseCommand {
  private edgeId: string;
  private offset: Vec3;
  private oldPositions: { [vertexId: string]: Vec3 } = {};

  constructor(edgeId: string, offset: Vec3) {
    super('edge_transform');
    this.edgeId = edgeId;
    this.offset = { ...offset };
  }

  do(mesh: Mesh): void {
    console.log('🔧 EdgeTransformCommand.do() called');
    console.log('🔧 edgeId:', this.edgeId, 'offset:', this.offset);
    
    const edge = mesh.getEdge(this.edgeId);
    console.log('🔧 Found edge:', edge);
    
    if (!edge) {
      console.error('❌ Edge not found:', this.edgeId);
      throw new Error(`Edge ${this.edgeId} not found`);
    }

    // Get the half-edge and vertices
    const halfEdge = mesh.getHalfEdge(edge.halfEdge);
    if (!halfEdge) {
      throw new Error(`Half-edge ${edge.halfEdge} not found`);
    }

    const targetVertex = mesh.getVertex(halfEdge.vertex);
    const prevHalfEdge = halfEdge.prev ? mesh.getHalfEdge(halfEdge.prev) : null;
    const sourceVertex = prevHalfEdge ? mesh.getVertex(prevHalfEdge.vertex) : null;

    if (!targetVertex || !sourceVertex) {
      throw new Error('Could not find edge vertices');
    }

    console.log('🔧 Edge vertices:', { 
      source: sourceVertex.id, 
      target: targetVertex.id,
      sourcePos: sourceVertex.pos,
      targetPos: targetVertex.pos
    });

    // Store old positions for undo
    this.oldPositions[sourceVertex.id] = { ...sourceVertex.pos };
    this.oldPositions[targetVertex.id] = { ...targetVertex.pos };
    console.log('💾 Stored old positions:', this.oldPositions);
    
    // Move both vertices by the offset
    console.log('🔄 Moving source vertex...');
    mesh.updateVertex(sourceVertex.id, {
      x: sourceVertex.pos.x + this.offset.x,
      y: sourceVertex.pos.y + this.offset.y,
      z: sourceVertex.pos.z + this.offset.z
    });

    console.log('🔄 Moving target vertex...');
    mesh.updateVertex(targetVertex.id, {
      x: targetVertex.pos.x + this.offset.x,
      y: targetVertex.pos.y + this.offset.y,
      z: targetVertex.pos.z + this.offset.z
    });
    
    // Verify the updates worked
    const updatedSource = mesh.getVertex(sourceVertex.id);
    const updatedTarget = mesh.getVertex(targetVertex.id);
    console.log('🔍 Vertices after update:', {
      source: updatedSource?.pos,
      target: updatedTarget?.pos
    });
    
    // Recalculate normals if method exists
    if (mesh.recalculateNormals) {
      console.log('🔄 Recalculating normals...');
      mesh.recalculateNormals();
      console.log('✅ Normals recalculated');
    } else {
      console.log('⚠️ No recalculateNormals method on mesh');
    }
    
    console.log('✅ EdgeTransformCommand.do() completed');
  }

  undo(mesh: Mesh): void {
    console.log('🔄 EdgeTransformCommand.undo() called');
    
    if (Object.keys(this.oldPositions).length === 0) {
      throw new Error('Cannot undo - no old positions stored');
    }

    // Restore old positions
    for (const [vertexId, oldPos] of Object.entries(this.oldPositions)) {
      console.log('🔄 Restoring vertex:', vertexId, 'to position:', oldPos);
      mesh.updateVertex(vertexId, oldPos);
    }
    
    // Recalculate normals if method exists
    if (mesh.recalculateNormals) {
      mesh.recalculateNormals();
    }
    
    console.log('✅ EdgeTransformCommand.undo() completed');
  }

  canExecute(mesh: Mesh): boolean {
    return mesh.getEdge(this.edgeId) !== undefined;
  }

  canUndo(_mesh: Mesh): boolean {
    return Object.keys(this.oldPositions).length > 0;
  }
}