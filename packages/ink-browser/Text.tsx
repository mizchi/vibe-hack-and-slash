import React from 'react';

interface TextProps {
  children?: React.ReactNode;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dimColor?: boolean;
  inverse?: boolean;
  wrap?: 'wrap' | 'truncate' | 'truncate-start' | 'truncate-middle' | 'truncate-end';
}

// ANSIカラーマッピング
const colorMap: Record<string, string> = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  redBright: '\x1b[91m',
  greenBright: '\x1b[92m',
  yellowBright: '\x1b[93m',
  blueBright: '\x1b[94m',
  magentaBright: '\x1b[95m',
  cyanBright: '\x1b[96m',
  whiteBright: '\x1b[97m'
};

const backgroundColorMap: Record<string, string> = {
  black: '\x1b[40m',
  red: '\x1b[41m',
  green: '\x1b[42m',
  yellow: '\x1b[43m',
  blue: '\x1b[44m',
  magenta: '\x1b[45m',
  cyan: '\x1b[46m',
  white: '\x1b[47m'
};

export const Text: React.FC<TextProps> = ({
  children,
  color,
  backgroundColor,
  bold,
  italic,
  underline,
  strikethrough,
  dimColor,
  inverse,
  wrap = 'wrap'
}) => {
  let text = String(children || '');
  const styles: string[] = [];
  
  // スタイルの適用
  if (bold) styles.push('\x1b[1m');
  if (dimColor) styles.push('\x1b[2m');
  if (italic) styles.push('\x1b[3m');
  if (underline) styles.push('\x1b[4m');
  if (inverse) styles.push('\x1b[7m');
  if (strikethrough) styles.push('\x1b[9m');
  
  // 色の適用
  if (color && colorMap[color]) {
    styles.push(colorMap[color]);
  }
  
  if (backgroundColor && backgroundColorMap[backgroundColor]) {
    styles.push(backgroundColorMap[backgroundColor]);
  }
  
  // スタイルを適用
  if (styles.length > 0) {
    text = styles.join('') + text + '\x1b[0m';
  }
  
  return <span className="ink-text" dangerouslySetInnerHTML={{ __html: text }} />;
};