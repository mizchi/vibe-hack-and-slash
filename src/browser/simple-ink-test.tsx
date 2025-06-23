import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// シンプルなInk風レンダリングのテスト
const SimpleInkTest: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [count, setCount] = useState(0);

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
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    setTerminal(term);

    // キー入力の処理
    term.onData((data) => {
      if (data === 'q') {
        term.writeln('\r\nGoodbye!');
      } else if (data === '\r') {
        setCount(c => c + 1);
      }
    });

    return () => {
      term.dispose();
    };
  }, []);

  // 画面の更新
  useEffect(() => {
    if (!terminal) return;

    // 画面をクリアして再描画
    terminal.clear();
    terminal.write('\x1b[H'); // カーソルをホームポジションに移動

    // ボーダー付きボックスの描画
    terminal.writeln('╔══════════════════════════════════════╗');
    terminal.writeln('║  \x1b[33mHack & Slash - Test\x1b[0m               ║');
    terminal.writeln('╚══════════════════════════════════════╝');
    terminal.writeln('');
    
    // カウンター表示
    terminal.writeln(`Count: \x1b[32m${count}\x1b[0m`);
    terminal.writeln('');
    
    // HPバー風の表示
    const maxHP = 100;
    const currentHP = 80;
    const barWidth = 20;
    const filled = Math.floor((currentHP / maxHP) * barWidth);
    const empty = barWidth - filled;
    
    terminal.write('HP: \x1b[32m');
    terminal.write('█'.repeat(filled));
    terminal.write('\x1b[90m');
    terminal.write('░'.repeat(empty));
    terminal.write('\x1b[0m');
    terminal.writeln(` ${currentHP}/${maxHP}`);
    terminal.writeln('');
    
    // 操作説明
    terminal.writeln('\x1b[90mPress Enter to increment counter | q to quit\x1b[0m');
  }, [terminal, count]);

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#1e1e1e' }}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

// アプリケーションのマウント
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<SimpleInkTest />);
}