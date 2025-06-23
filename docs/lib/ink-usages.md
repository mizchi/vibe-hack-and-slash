# React Ink 使い方ガイド

React Inkは、CLIアプリケーションをReactコンポーネントとして構築できるライブラリです。

## セットアップ

```bash
pnpm add ink react
pnpm add -D @types/react ink-testing-library
```

## 基本コンポーネント

### Text
```tsx
<Text color="green" bold>緑色の太字</Text>
<Text backgroundColor="blue" dimColor>背景色付き</Text>
```

### Box
```tsx
// レイアウト
<Box flexDirection="column" gap={1}>
  <Text>上</Text>
  <Text>下</Text>
</Box>

// ボーダー
<Box borderStyle="round" borderColor="green" padding={1}>
  <Text>枠線付き</Text>
</Box>
```

ボーダースタイル: `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`

## フック

### useInput
```tsx
useInput((input, key) => {
  if (input === 'q') exit();
  if (key.leftArrow) moveLeft();
  if (key.return) confirm();
});
```

### useApp
```tsx
const { exit } = useApp();
exit(); // アプリケーション終了
```

## 実装例

### ゲームUI
```tsx
const GameUI = () => {
  const [hp, setHp] = useState(100);
  
  useInput((input) => {
    if (input === 'a') attack();
    if (input === 'q') exit();
  });
  
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" padding={1}>
        <Text bold>ステータス</Text>
      </Box>
      <Text color="red">HP: {hp}/100</Text>
      <Text dimColor>[A] 攻撃 [Q] 終了</Text>
    </Box>
  );
};
```

## テスト

### ink-testing-library

```tsx
import { render } from 'ink-testing-library';

// 基本的なテスト
const { lastFrame } = render(<Text>Hello</Text>);
expect(lastFrame()).toBe('Hello');

// 再レンダリング
const { lastFrame, rerender } = render(<Counter value={1} />);
expect(lastFrame()).toBe('Count: 1');

rerender(<Counter value={2} />);
expect(lastFrame()).toBe('Count: 2');

// キー入力シミュレーション（useInputを使用するコンポーネントでは動作しない）
const { stdin } = render(<App />);
stdin.write('a'); // 通常の文字
stdin.write('\x1B[A'); // 上矢印
stdin.write('\r'); // Enter
```

### 特殊キー
```
Enter: '\r'
Escape: '\x1B'
上矢印: '\x1B[A'
下矢印: '\x1B[B'
右矢印: '\x1B[C'
左矢印: '\x1B[D'
Backspace: '\x7F'
Delete: '\x1B[3~'
Tab: '\t'
```

### テスト環境設定
```tsx
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});
```

## 注意点

- Raw Modeは一部の環境でサポートされない
- 頻繁な再レンダリングはちらつきの原因になる
- `console.log`は使用できない（デバッグはファイル出力で）

## 実装例

- `/docs/lib/ink-usages.test.tsx` - テストコードの実例

## 参考リンク

- [Ink 公式ドキュメント](https://github.com/vadimdemedes/ink)
- [ink-testing-library](https://github.com/vadimdemedes/ink-testing-library)