import { Command, Mesh, CommandManager } from './types.js';
import { generateId } from './utils.js';

export class BaseCommand implements Command {
  id: string;
  type: string;

  constructor(type: string, id?: string) {
    this.id = id || generateId();
    this.type = type;
  }

  do(_mesh: Mesh): void | Promise<void> {
    throw new Error('Command.do() must be implemented');
  }

  undo(_mesh: Mesh): void | Promise<void> {
    throw new Error('Command.undo() must be implemented');
  }
}

export class CommandHistory implements CommandManager {
  history: Command[] = [];
  currentIndex = -1;

  execute(command: Command, mesh: Mesh): void {
    // Remove any commands after current index (redo history)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Execute the command
    command.do(mesh);
    
    // Add to history
    this.history.push(command);
    this.currentIndex++;
  }

  undo(mesh: Mesh): boolean {
    if (!this.canUndo()) return false;
    
    const command = this.history[this.currentIndex];
    command.undo(mesh);
    this.currentIndex--;
    
    return true;
  }

  redo(mesh: Mesh): boolean {
    if (!this.canRedo()) return false;
    
    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.do(mesh);
    
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}