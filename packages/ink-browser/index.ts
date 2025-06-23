/**
 * React Ink Browser Compatibility Layer
 * 
 * ブラウザでInk APIを使用するための互換レイヤー
 * xterm.jsを使用してターミナルUIをブラウザで実現
 */

// コンポーネント
export { Box } from './Box';
export { Text } from './Text';
export { TerminalContext, TerminalProvider, useTerminal } from './TerminalContext';
export { TerminalRenderer } from './TerminalRenderer';

// フック
export { useInput } from './useInput';
export { useApp } from './useApp';

// レンダリング
export { render } from './render';

// 型定義
export type { BoxProps } from './Box';
export type { TextProps } from './Text';