import { useContext } from 'react';
import { TerminalContext } from './TerminalContext';

export const useApp = () => {
  const { terminal } = useContext(TerminalContext);
  
  return {
    exit: (error?: Error) => {
      if (error) {
        console.error('App exit with error:', error);
        if (terminal) {
          terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
        }
      }
      // ブラウザでは実際には終了できないので、メッセージを表示
      if (terminal) {
        terminal.writeln('\x1b[33mApplication terminated. Refresh to restart.\x1b[0m');
      }
    }
  };
};