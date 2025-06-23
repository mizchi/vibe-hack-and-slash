import { useEffect, useContext } from 'react';
import { TerminalContext } from './TerminalContext';

type Key = {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  return: boolean;
  escape: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  pageUp: boolean;
  pageDown: boolean;
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
};

type InputHandler = (input: string, key: Key) => void;

export const useInput = (inputHandler: InputHandler, options?: { isActive?: boolean }) => {
  const { terminal } = useContext(TerminalContext);
  const isActive = options?.isActive ?? true;
  
  useEffect(() => {
    if (!terminal || !isActive) return;
    
    const handleData = (data: string) => {
      const key: Key = {
        upArrow: data === '\x1b[A',
        downArrow: data === '\x1b[B',
        rightArrow: data === '\x1b[C',
        leftArrow: data === '\x1b[D',
        return: data === '\r' || data === '\n',
        escape: data === '\x1b',
        tab: data === '\t',
        backspace: data === '\x7f' || data === '\b',
        delete: data === '\x1b[3~',
        pageUp: data === '\x1b[5~',
        pageDown: data === '\x1b[6~',
        shift: false,
        ctrl: false,
        meta: false
      };
      
      // Ctrl+C
      if (data === '\x03') {
        key.ctrl = true;
        inputHandler('c', key);
        return;
      }
      
      inputHandler(data, key);
    };
    
    const disposable = terminal.onData(handleData);
    
    return () => {
      disposable.dispose();
    };
  }, [terminal, inputHandler, isActive]);
};