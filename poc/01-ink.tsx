#!/usr/bin/env tsx
import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput, useApp } from "ink";

// 1. 基本的なTextコンポーネントのテスト
const TextExamples: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text underline>== Textコンポーネントの例 ==</Text>
      <Text>通常のテキスト</Text>
      <Text color="green">緑色のテキスト</Text>
      <Text color="red" bold>赤色の太字</Text>
      <Text backgroundColor="blue" color="white">背景色付き</Text>
      <Text dimColor>薄い色のテキスト</Text>
      <Text italic>イタリック体</Text>
      <Text strikethrough>取り消し線</Text>
    </Box>
  );
};

// 2. Boxレイアウトのテスト
const BoxExamples: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text underline>== Boxレイアウトの例 ==</Text>
      
      {/* 横並び */}
      <Box marginBottom={1}>
        <Box borderStyle="single" padding={1} marginRight={1}>
          <Text>左のボックス</Text>
        </Box>
        <Box borderStyle="double" padding={1}>
          <Text>右のボックス</Text>
        </Box>
      </Box>

      {/* 各種ボーダースタイル */}
      <Box flexDirection="column" gap={1}>
        <Box borderStyle="round" borderColor="green" padding={1}>
          <Text>round（角丸）</Text>
        </Box>
        <Box borderStyle="bold" borderColor="red" padding={1}>
          <Text>bold（太線）</Text>
        </Box>
        <Box borderStyle="classic" padding={1}>
          <Text>classic</Text>
        </Box>
      </Box>
    </Box>
  );
};

// 3. インタラクティブな例（useInput）
const InteractiveExample: React.FC = () => {
  const [count, setCount] = useState(0);
  const [lastKey, setLastKey] = useState("なし");
  const [logs, setLogs] = useState<string[]>(["アプリ開始"]);

  useInput((input, key) => {
    // 通常のキー入力
    if (input === "+") {
      setCount(c => c + 1);
      setLastKey("+");
    }
    if (input === "-") {
      setCount(c => c - 1);
      setLastKey("-");
    }

    // 特殊キー
    if (key.leftArrow) {
      setLastKey("←");
      setLogs(prev => [...prev, "左矢印キーが押されました"]);
    }
    if (key.rightArrow) {
      setLastKey("→");
      setLogs(prev => [...prev, "右矢印キーが押されました"]);
    }
    if (key.return) {
      setLastKey("Enter");
      setLogs(prev => [...prev, "Enterキーが押されました"]);
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text underline>== インタラクティブな例 ==</Text>
      <Text>カウント: {count} （+/- キーで増減）</Text>
      <Text>最後に押されたキー: {lastKey}</Text>
      
      <Box borderStyle="single" marginTop={1} padding={1} height={4}>
        <Box flexDirection="column">
          {logs.slice(-3).map((log, i) => (
            <Text key={i}>{log}</Text>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// 4. タイマーの例（useEffect）
const TimerExample: React.FC = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text underline>== タイマーの例 ==</Text>
      <Text>経過時間: {seconds}秒</Text>
      <Box>
        <Text color="green">{"█".repeat(Math.min(seconds, 20))}</Text>
        <Text dimColor>{"░".repeat(Math.max(20 - seconds, 0))}</Text>
      </Box>
    </Box>
  );
};

// 5. 絵文字の例
const EmojiExample: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text underline>== 絵文字の例 ==</Text>
      <Text>🎮 ゲーム関連: 🎯 🎲 🃏 ⚔️ 🛡️</Text>
      <Text>💀 状態: ❤️ 💙 💚 💛 💜</Text>
      <Text>🎉 イベント: ✨ 💥 🔥 ⚡ 🌟</Text>
    </Box>
  );
};

// メインアプリ
const App: React.FC = () => {
  const { exit } = useApp();
  const [showSection, setShowSection] = useState(0);

  useInput((input) => {
    if (input === "q") {
      exit();
    }
    if (input >= "1" && input <= "5") {
      setShowSection(parseInt(input));
    }
    if (input === "0") {
      setShowSection(0);
    }
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold>React Ink 検証 PoC</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>セクション選択: [1-5] 各セクション | [0] 全表示 | [Q] 終了</Text>
      </Box>

      {(showSection === 0 || showSection === 1) && <TextExamples />}
      {(showSection === 0 || showSection === 2) && <BoxExamples />}
      {(showSection === 0 || showSection === 3) && <InteractiveExample />}
      {(showSection === 0 || showSection === 4) && <TimerExample />}
      {(showSection === 0 || showSection === 5) && <EmojiExample />}
    </Box>
  );
};

// レンダリング
render(<App />);