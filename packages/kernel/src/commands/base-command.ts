export interface Command {
  readonly name: string;
  do(target: any): void;
  undo(target: any): void;
  canExecute?(target: any): boolean;
  canUndo?(target: any): boolean;
}

export abstract class BaseCommand implements Command {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract do(target: any): void;
  abstract undo(target: any): void;

  canExecute(_target: any): boolean {
    return true;
  }

  canUndo(_target: any): boolean {
    return true;
  }
}

export class CommandHistory {
  private commands: Command[] = [];
  private currentIndex: number = -1;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  execute(command: Command, target: any): boolean {
    console.log('🔥 CommandHistory.execute called with command:', command);
    console.log('🔥 Command type:', command.constructor.name);
    console.log('🔥 Command name:', command.name);
    
    if (command.canExecute && !command.canExecute(target)) {
      return false;
    }

    try {
      console.log('🔥 About to call command.do()');
      command.do(target);
      console.log('🔥 command.do() completed');
      
      // Remove any commands after current index
      this.commands = this.commands.slice(0, this.currentIndex + 1);
      
      // Add new command
      this.commands.push(command);
      this.currentIndex++;
      
      // Maintain max size
      if (this.commands.length > this.maxSize) {
        this.commands.shift();
        this.currentIndex--;
      }
      
      return true;
    } catch (error) {
      console.error('Command execution failed:', error);
      return false;
    }
  }

  undo(target: any): boolean {
    if (!this.canUndo()) return false;

    const command = this.commands[this.currentIndex];
    
    if (command.canUndo && !command.canUndo(target)) {
      return false;
    }

    try {
      command.undo(target);
      this.currentIndex--;
      return true;
    } catch (error) {
      console.error('Command undo failed:', error);
      return false;
    }
  }

  redo(target: any): boolean {
    if (!this.canRedo()) return false;

    const command = this.commands[this.currentIndex + 1];
    
    if (command.canExecute && !command.canExecute(target)) {
      return false;
    }

    try {
      command.do(target);
      this.currentIndex++;
      return true;
    } catch (error) {
      console.error('Command redo failed:', error);
      return false;
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.commands.length - 1;
  }

  clear(): void {
    this.commands = [];
    this.currentIndex = -1;
  }

  get history(): readonly Command[] {
    return this.commands;
  }

  get currentCommand(): Command | null {
    return this.currentIndex >= 0 ? this.commands[this.currentIndex] : null;
  }
}