import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from '../index';

const BasicExample = () => {
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }
    if (key.upArrow) {
      setCount(c => c + 1);
    }
    if (key.downArrow) {
      setCount(c => Math.max(0, c - 1));
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text color="yellow" bold>
        React Ink Browser Example
      </Text>
      <Text>Count: <Text color="green">{count}</Text></Text>
      <Box marginTop={1}>
        <Text dimColor>↑/↓: Change count | q: Quit</Text>
      </Box>
    </Box>
  );
};

// HTMLファイルで使用する場合
// <div id="terminal-root"></div>
const container = document.getElementById('terminal-root');
if (container) {
  render(<BasicExample />, container);
}