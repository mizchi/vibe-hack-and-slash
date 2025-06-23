import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { render } from '../../packages/ink-browser';
import { BrowserGame } from './BrowserGame';
import 'xterm/css/xterm.css';

// ブラウザアプリケーション
const BrowserGameApp: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    try {
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

      setTerminal(term);

      // ウィンドウリサイズ時の処理
      const handleResize = () => {
        fitAddon.fit();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    } catch (err) {
      console.error('Terminal initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    if (!terminal) return;

    // Ink互換レンダラーでゲームをレンダリング
    const app = render(<BrowserGame />, { terminal });

    return () => {
      app.unmount();
    };
  }, [terminal]);

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
  ReactDOM.createRoot(root).render(<BrowserGameApp />);
}