import { describe, it, expect } from 'vitest';
import { HalfEdgeMesh } from '../src/mesh';
import { CommandHistory } from '../src/command';
import { ExtrudeCommand } from '../src/operations';
import { vec3 } from '../src/utils';

describe('CommandHistory', () => {
  it('should execute commands and track history', () => {
    const mesh = new HalfEdgeMesh();
    const history = new CommandHistory();
    
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    
    const command = new ExtrudeCommand(face!.id, 1.0);
    history.execute(command, mesh);
    
    expect(history.history).toHaveLength(1);
    expect(history.currentIndex).toBe(0);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('should undo commands', () => {
    const mesh = new HalfEdgeMesh();
    const history = new CommandHistory();
    
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    
    const originalFaceCount = mesh.faces().length;
    
    const command = new ExtrudeCommand(face!.id, 1.0);
    history.execute(command, mesh);
    
    expect(mesh.faces().length).toBeGreaterThan(originalFaceCount);
    
    history.undo(mesh);
    expect(mesh.faces().length).toBe(originalFaceCount);
    expect(history.currentIndex).toBe(-1);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it('should redo commands', () => {
    const mesh = new HalfEdgeMesh();
    const history = new CommandHistory();
    
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    
    const originalFaceCount = mesh.faces().length;
    
    const command = new ExtrudeCommand(face!.id, 1.0);
    history.execute(command, mesh);
    history.undo(mesh);
    
    expect(mesh.faces().length).toBe(originalFaceCount);
    
    history.redo(mesh);
    expect(mesh.faces().length).toBeGreaterThan(originalFaceCount);
    expect(history.currentIndex).toBe(0);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('should clear redo history when new command is executed', () => {
    const mesh = new HalfEdgeMesh();
    const history = new CommandHistory();
    
    const v1 = mesh.addVertex(vec3(0, 0, 0));
    const v2 = mesh.addVertex(vec3(1, 0, 0));
    const v3 = mesh.addVertex(vec3(1, 1, 0));
    const v4 = mesh.addVertex(vec3(0, 1, 0));
    const face = mesh.addFace([v1.id, v2.id, v3.id, v4.id]);
    
    // Execute two commands
    const command1 = new ExtrudeCommand(face!.id, 1.0);
    const command2 = new ExtrudeCommand(face!.id, 0.5);
    
    history.execute(command1, mesh);
    history.execute(command2, mesh);
    history.undo(mesh);
    
    expect(history.canRedo()).toBe(true);
    
    // Execute new command - should clear redo history
    const command3 = new ExtrudeCommand(face!.id, 2.0);
    history.execute(command3, mesh);
    
    expect(history.canRedo()).toBe(false);
    expect(history.history).toHaveLength(2);
  });
});