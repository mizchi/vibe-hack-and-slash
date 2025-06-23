import React, { createContext } from 'react';
import { Terminal } from 'xterm';

interface TerminalContextValue {
  terminal: Terminal | null;
  write: (text: string) => void;
  writeln: (text: string) => void;
  clear: () => void;
}

export const TerminalContext = createContext<TerminalContextValue>({
  terminal: null,
  write: () => {},
  writeln: () => {},
  clear: () => {}
});

interface TerminalProviderProps {
  terminal: Terminal | null;
  children: React.ReactNode;
}

export const TerminalProvider: React.FC<TerminalProviderProps> = ({ terminal, children }) => {
  const value: TerminalContextValue = {
    terminal,
    write: (text: string) => terminal?.write(text),
    writeln: (text: string) => terminal?.writeln(text),
    clear: () => terminal?.clear()
  };
  
  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
};