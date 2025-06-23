import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { renderToStaticMarkup } from 'react-dom/server';

interface TerminalRendererProps {
  terminal: Terminal;
  children: React.ReactNode;
}

// React要素をANSIエスケープシーケンス付き文字列に変換
const reactToAnsi = (element: React.ReactNode, context: { inRow?: boolean } = {}): string => {
  if (element === null || element === undefined) {
    return '';
  }
  
  if (typeof element === 'string') {
    return element;
  }
  
  if (typeof element === 'number') {
    return String(element);
  }
  
  if (Array.isArray(element)) {
    return element.map(child => reactToAnsi(child, context)).join('');
  }
  
  if (!React.isValidElement(element)) {
    return '';
  }
  
  // コンポーネントのタイプに基づいて処理
  const { type, props } = element;
  
  // React.Fragment の処理
  if (type === React.Fragment) {
    return reactToAnsi(props.children, context);
  }
  
  if (type === 'span' && props.dangerouslySetInnerHTML) {
    return props.dangerouslySetInnerHTML.__html || '';
  }
  
  if (type === 'div') {
    const className = props.className || '';
    const isColumn = className.includes('column');
    const isRow = className.includes('row');
    const isBordered = className.includes('bordered');
    const isPadding = className.includes('padding');
    
    // 子要素を処理
    let childrenOutput = '';
    if (isRow) {
      // 行レイアウト: 子要素を横に並べる
      childrenOutput = React.Children.map(props.children, child => 
        reactToAnsi(child, { inRow: true })
      )?.join('') || '';
    } else if (isColumn) {
      // 列レイアウト: 子要素を縦に並べる
      const childOutputs = React.Children.map(props.children, child => 
        reactToAnsi(child, { inRow: false })
      ) || [];
      childrenOutput = childOutputs.filter(s => s).join('\n');
    } else {
      childrenOutput = reactToAnsi(props.children, context);
    }
    
    // パディング処理
    if (isPadding && props['data-padding']) {
      const padding = Number(props['data-padding']) || 1;
      const lines = childrenOutput.split('\n');
      childrenOutput = lines.map(line => ' '.repeat(padding) + line + ' '.repeat(padding)).join('\n');
      childrenOutput = '\n'.repeat(padding) + childrenOutput + '\n'.repeat(padding);
    }
    
    // ボーダー処理
    if (isBordered && props['data-border-style']) {
      const borderStyle = props['data-border-style'];
      const borderChars: Record<string, any> = {
        single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
        double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
        round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
        bold: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
      };
      
      const border = borderChars[borderStyle] || borderChars.single;
      const lines = childrenOutput.split('\n');
      const maxLength = Math.max(...lines.map(line => 
        Array.from(line.replace(/\x1b\[[0-9;]*m/g, '')).length
      ));
      
      const top = border.tl + border.h.repeat(maxLength) + border.tr;
      const bottom = border.bl + border.h.repeat(maxLength) + border.br;
      
      const borderedLines = lines.map(line => {
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        const padding = ' '.repeat(Math.max(0, maxLength - Array.from(cleanLine).length));
        return border.v + line + padding + border.v;
      });
      
      return [top, ...borderedLines, bottom].join('\n');
    }
    
    // 行レイアウトで改行を追加しない
    if (context.inRow) {
      return childrenOutput;
    }
    
    return childrenOutput;
  }
  
  // 子要素を再帰的に処理
  return reactToAnsi(props.children, context);
};

export const TerminalRenderer: React.FC<TerminalRendererProps> = ({ terminal, children }) => {
  const lastOutput = useRef<string>('');
  
  useEffect(() => {
    if (!terminal) {
      console.log('Terminal not available');
      return;
    }
    
    // React要素をANSI文字列に変換
    const output = reactToAnsi(children);
    console.log('Terminal output:', output);
    
    // 前回の出力と異なる場合のみ更新
    if (output !== lastOutput.current) {
      terminal.clear();
      terminal.write(output);
      lastOutput.current = output;
    }
  }, [terminal, children]);
  
  return null;
};