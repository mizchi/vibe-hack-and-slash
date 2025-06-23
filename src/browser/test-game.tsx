import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// 最小限のテストアプリケーション
const TestApp: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cols: 80,
      rows: 30,
      convertEol: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // シンプルなテキストを表示
    term.writeln('Hack & Slash - Terminal Test');
    term.writeln('');
    term.writeln('Terminal is working!');
    term.writeln('');
    term.writeln('Press any key to test input...');

    // 入力のテスト
    term.onData((data) => {
      term.write(`You pressed: ${data}\r\n`);
    });

    setTerminal(term);

    return () => {
      term.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#1e1e1e' }}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

// アプリケーションのマウント
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<TestApp />);
}