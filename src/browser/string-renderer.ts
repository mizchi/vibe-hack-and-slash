import { EventEmitter } from 'events';

// Inkアプリケーションの出力を文字列として取得するためのカスタムストリーム
export class StringStream extends EventEmitter {
  private buffer: string = '';
  public columns = 80;
  public rows = 30;
  public isTTY = true;

  write(chunk: string): boolean {
    this.buffer += chunk;
    this.emit('data', chunk);
    return true;
  }

  getBuffer(): string {
    return this.buffer;
  }

  clearBuffer(): void {
    this.buffer = '';
  }

  // ダミー実装
  clearLine() {}
  clearScreenDown() {}
  getColorDepth() { return 8; }
  moveCursor() {}
  cursorTo() {}
  getWindowSize() { return [this.columns, this.rows]; }
}