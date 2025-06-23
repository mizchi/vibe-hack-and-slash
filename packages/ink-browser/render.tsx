import React from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from 'xterm';
import { TerminalProvider } from './TerminalContext';
import { TerminalRenderer } from './TerminalRenderer';

interface RenderOptions {
  terminal: Terminal;
  debug?: boolean;
}

export const render = (element: React.ReactElement, options: RenderOptions) => {
  // 仮想DOMコンテナを作成
  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);
  
  const root = ReactDOM.createRoot(container);
  
  // Reactアプリケーションをレンダリング
  root.render(
    <TerminalProvider terminal={options.terminal}>
      <TerminalRenderer terminal={options.terminal}>
        {element}
      </TerminalRenderer>
    </TerminalProvider>
  );
  
  return {
    unmount: () => {
      root.unmount();
      container.remove();
    },
    waitUntilExit: () => Promise.resolve(),
    clear: () => options.terminal.clear(),
    rerender: (newElement: React.ReactElement) => {
      root.render(
        <TerminalProvider terminal={options.terminal}>
          <TerminalRenderer terminal={options.terminal}>
            {newElement}
          </TerminalRenderer>
        </TerminalProvider>
      );
    }
  };
};