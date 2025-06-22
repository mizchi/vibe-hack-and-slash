# React Ink 使い方ガイド

React Inkは、CLIアプリケーションをReactコンポーネントとして構築できるライブラリです。

## 基本的な使い方

### 1. セットアップ

```bash
pnpm add ink react
pnpm add -D @types/react
```

### 2. 基本構造

```tsx
#!/usr/bin/env tsx
import React from "react";
import { render, Text } from "ink";

const App = () => {
  return <Text>Hello, CLI!</Text>;
};

render(<App />);
```

## 主要コンポーネント

### Text
テキストを表示する基本コンポーネント

```tsx
<Text>通常のテキスト</Text>
<Text color="green">緑色のテキスト</Text>
<Text color="red" bold>赤色の太字</Text>
<Text backgroundColor="blue">背景色付き</Text>
```

### Box
レイアウト用のコンテナコンポーネント

```tsx
// 縦並び（デフォルト）
<Box flexDirection="column">
  <Text>上</Text>
  <Text>下</Text>
</Box>

// 横並び
<Box flexDirection="row">
  <Text>左</Text>
  <Text>右</Text>
</Box>

// ボーダー付き
<Box borderStyle="round" borderColor="green" padding={1}>
  <Text>枠線付きボックス</Text>
</Box>

// マージン・パディング
<Box marginTop={1} paddingX={2}>
  <Text>余白付き</Text>
</Box>
```

### ボーダースタイル
- `single`: 一重線
- `double`: 二重線
- `round`: 角丸
- `bold`: 太線
- `singleDouble`: 上下が一重、左右が二重
- `doubleSingle`: 上下が二重、左右が一重
- `classic`: クラシックスタイル

## フックの使い方

### useInput
キーボード入力を処理

```tsx
import { useInput } from "ink";

const Game = () => {
  useInput((input, key) => {
    // 通常のキー入力
    if (input === "q") {
      // qキーが押された
    }
    
    // 特殊キー
    if (key.leftArrow) {
      // 左矢印キー
    }
    if (key.return) {
      // Enterキー
    }
    if (key.escape) {
      // ESCキー
    }
  });
};
```

### useApp
アプリケーションの制御

```tsx
import { useApp } from "ink";

const App = () => {
  const { exit } = useApp();
  
  // アプリケーションを終了
  exit();
  
  // エラーで終了
  exit(new Error("Something went wrong"));
};
```

### useState/useEffect
通常のReact Hooksも使用可能

```tsx
const Timer = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <Text>経過時間: {count}秒</Text>;
};
```

## 実装例

### ゲームUIの例

```tsx
const GameUI = () => {
  const [gameState, setGameState] = useState(initialState);
  const { exit } = useApp();
  
  useInput((input, key) => {
    switch (input) {
      case "a":
        // 攻撃
        break;
      case "d":
        // 防御
        break;
      case "q":
        exit();
        break;
    }
  });
  
  return (
    <Box flexDirection="column">
      {/* タイトル */}
      <Box borderStyle="round" borderColor="green" padding={1}>
        <Text>ゲームタイトル</Text>
      </Box>
      
      {/* ステータス */}
      <Box marginTop={1}>
        <Text color="green">HP: {gameState.hp}/100</Text>
      </Box>
      
      {/* ログ */}
      <Box borderStyle="single" marginTop={1} padding={1} height={5}>
        {gameState.logs.map((log, i) => (
          <Text key={i}>{log}</Text>
        ))}
      </Box>
      
      {/* 操作説明 */}
      <Box marginTop={1}>
        <Text>操作: [A] 攻撃 | [D] 防御 | [Q] 終了</Text>
      </Box>
    </Box>
  );
};
```

## 注意点

### 1. Raw Modeサポート
Inkはデフォルトでstdinをraw modeにしてキー入力を受け付けます。
一部の環境ではサポートされていない場合があります。

Raw modeがサポートされていない環境での対処法：

```tsx
import { render } from "ink";

// stdin/stdoutを明示的に指定
render(<App />, {
  stdin: process.stdin,
  stdout: process.stdout,
  debug: true,
});

// または、キー入力を無効化
const App = () => {
  // useInputを使用しない
  return <Text>キー入力なしのアプリ</Text>;
};
```

### 2. 絵文字の使用
絵文字を使用する場合、ターミナルのサポート状況により表示が崩れる可能性があります。

```tsx
// 絵文字の例
<Text>🎮 ゲーム開始！</Text>
<Text>💀 ゲームオーバー</Text>
<Text>🎉 クリア！</Text>
```

### 3. パフォーマンス
頻繁な再レンダリングは避けるようにしましょう。
大量のログを表示する場合は、表示数を制限します。

```tsx
// ログの表示数を制限
const displayLogs = logs.slice(-5); // 最新5件のみ
```

## デバッグ

### 開発モード
```bash
# ファイル変更を監視して自動再起動
tsx watch src/index.tsx
```

### ログ出力
通常の`console.log`は使用できないため、ファイルに出力するか、
専用のデバッグエリアを作成します。

```tsx
import fs from "fs";

// デバッグログをファイルに出力
const debug = (message: string) => {
  fs.appendFileSync("debug.log", `${new Date().toISOString()} ${message}\n`);
};
```

## 検証結果

PoCの実行により以下が確認されました：

### 動作確認済み
- ✅ Textコンポーネント（色、太字、背景色、イタリック、取り消し線）
- ✅ Boxコンポーネント（レイアウト、ボーダー、マージン、パディング）
- ✅ useStateとuseEffectの動作
- ✅ アニメーション（ローディングスピナー、プログレスバー）
- ✅ リアルタイム更新（時計、自動バトル）
- ✅ 絵文字の表示

### 注意が必要な点
- ⚠️ useInputはRaw modeが必要（一部の環境で動作しない）
- ⚠️ 頻繁な再レンダリングはちらつきの原因になる
- ⚠️ ターミナルのサイズ変更への対応が必要な場合がある

## 参考リンク

- [Ink 公式ドキュメント](https://github.com/vadimdemedes/ink)
- [React 公式ドキュメント](https://react.dev/)
- [サンプルプロジェクト](https://github.com/vadimdemedes/ink#examples)