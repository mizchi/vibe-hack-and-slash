# React Ink Browser Compatibility Layer

ブラウザ環境でReact Inkアプリケーションを実行するための互換レイヤー。xterm.jsを使用してターミナルUIをブラウザで実現します。

## 特徴

- React Inkの主要なコンポーネント（Box、Text）をサポート
- useInput、useAppなどのフックをブラウザ環境で利用可能
- xterm.jsによる本格的なターミナルエミュレーション
- ANSIエスケープシーケンスのサポート

## 使用方法

```tsx
import React from 'react';
import { render, Box, Text, useInput, useApp } from './ink-compat';

const App = () => {
  const { exit } = useApp();
  
  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="green">Hello from Browser Terminal!</Text>
      <Text>Press 'q' to quit</Text>
    </Box>
  );
};

// HTMLにマウント
const container = document.getElementById('root');
render(<App />, container);
```

## サポートされているコンポーネント

### Box
フレックスボックスレイアウトコンテナ

```tsx
<Box flexDirection="column" borderStyle="single" padding={1}>
  <Text>Content</Text>
</Box>
```

### Text
テキスト表示コンポーネント

```tsx
<Text color="green" bold>Bold Green Text</Text>
<Text backgroundColor="red">Background Color</Text>
```

## サポートされているフック

### useInput
キーボード入力を処理

```tsx
useInput((input, key) => {
  if (key.upArrow) {
    // 上矢印が押された
  }
  if (input === 'a') {
    // 'a'キーが押された
  }
});
```

### useApp
アプリケーションの制御

```tsx
const { exit } = useApp();
// アプリケーションを終了
exit();
```

## 制限事項

- 一部のInk固有の機能（標準入出力の直接操作など）は利用できません
- パフォーマンスは実際のターミナルに比べて劣る場合があります
- 全てのANSIエスケープシーケンスがサポートされているわけではありません

## 技術的な詳細

このライブラリは以下の技術を使用しています：

- **xterm.js**: ブラウザ用のターミナルエミュレーター
- **React**: UIコンポーネントの構築
- **TypeScript**: 型安全性の確保

## ライセンス

MIT