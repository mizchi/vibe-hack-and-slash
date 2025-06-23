import './node-polyfills';
import React from 'react';
import { render } from 'ink';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { EventEmitter } from 'events';
import { Game } from '../app/Game.tsx';
import 'xterm/css/xterm.css';

// カスタムストリームの作成
const createStdout = (term: Terminal): any => {
  const stdout = new EventEmitter() as any;
  stdout.columns = 80;
  stdout.rows = 30;
  stdout.isTTY = true;
  stdout.write = (str: string) => {
    term.write(str);
    return true;
  };
  stdout.clearLine = () => {};
  stdout.clearScreenDown = () => {};
  stdout.getColorDepth = () => 8;
  stdout.moveCursor = () => {};
  stdout.cursorTo = () => {};
  stdout.getWindowSize = () => [stdout.columns, stdout.rows];
  return stdout;
};

const createStdin = (): any => {
  const stdin = new EventEmitter() as any;
  stdin.isTTY = true;
  stdin.isRaw = false;
  stdin.setRawMode = (raw: boolean) => {
    stdin.isRaw = raw;
  };
  stdin.setEncoding = () => {};
  stdin.read = () => null;
  stdin.pause = () => {};
  stdin.resume = () => {};
  return stdin;
};

// xterm.js の初期化
const initializeTerminal = async () => {
  const container = document.getElementById('terminal-container');
  if (!container) {
    throw new Error('Terminal container not found');
  }

  // ターミナルの作成
  const term = new Terminal({
    cols: 80,
    rows: 30,
    convertEol: true,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: 14,
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#e5e5e5'
    },
    allowProposedApi: true
  });

  // Fit addon を追加
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  // ターミナルを DOM に追加
  term.open(container);
  fitAddon.fit();

  // ウィンドウリサイズ時の処理
  window.addEventListener('resize', () => {
    fitAddon.fit();
  });

  // カスタムストリームの作成
  const stdout = createStdout(term);
  const stderr = stdout; // 同じ出力先を使用
  const stdin = createStdin();

  // 入力イベントの処理
  term.onData((data) => {
    stdin.emit('data', data);
  });

  // Ink アプリケーションのレンダリング
  const app = render(<Game />, {
    stdout,
    stderr,
    stdin,
    debug: false,
    patchConsole: false
  });

  // クリーンアップ処理
  window.addEventListener('beforeunload', () => {
    app.unmount();
  });
};

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);
});

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
  initializeTerminal().catch(console.error);
});