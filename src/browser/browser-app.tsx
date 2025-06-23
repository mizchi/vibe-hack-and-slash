import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const BrowserApp: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTerminal = async () => {
      try {
        if (!terminalRef.current) return;

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
          }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        // デモメッセージを表示
        term.writeln('⚔️  Hack & Slash - Browser Version');
        term.writeln('');
        term.writeln('現在、Inkライブラリのブラウザ対応を実装中です...');
        term.writeln('');
        term.writeln('Inkはtop-level awaitを使用しているため、');
        term.writeln('ブラウザでの直接実行には追加の対応が必要です。');
        term.writeln('');
        term.writeln('代替案：');
        term.writeln('1. サーバーサイドでInkを実行し、WebSocketで通信');
        term.writeln('2. pty.jsやnode-ptyを使用したバックエンド実装');
        term.writeln('3. Ink互換のブラウザ用レンダラーの自作');

        // 入力のデモ
        term.onData((data) => {
          // エコーバック
          term.write(data);
          
          // Enterキーの処理
          if (data === '\r') {
            term.write('\n');
          }
        });

      } catch (err) {
        console.error('Terminal initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initializeTerminal();
  }, []);

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        <h2>Error</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#1e1e1e' }}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

// アプリケーションのマウント
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<BrowserApp />);
}