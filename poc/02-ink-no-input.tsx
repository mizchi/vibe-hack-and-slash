#!/usr/bin/env tsx
import React, { useState, useEffect } from "react";
import { render, Text, Box } from "ink";

// キー入力を使わないバージョンのPoC

// 1. アニメーション例
const LoadingAnimation: React.FC = () => {
  const [frame, setFrame] = useState(0);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box>
      <Text color="cyan">{frames[frame]}</Text>
      <Text> Loading...</Text>
    </Box>
  );
};

// 2. プログレスバー
const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const percentage = Math.round((value / max) * 100);
  const filled = Math.round((value / max) * 20);
  const empty = 20 - filled;

  return (
    <Box flexDirection="column">
      <Text>Progress: {percentage}%</Text>
      <Box>
        <Text color="green">{"█".repeat(filled)}</Text>
        <Text dimColor>{"░".repeat(empty)}</Text>
      </Box>
    </Box>
  );
};

// 3. リアルタイムクロック
const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box borderStyle="round" padding={1}>
      <Text>{time.toLocaleTimeString()}</Text>
    </Box>
  );
};

// 4. 自動シミュレーション
const AutoBattle: React.FC = () => {
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(50);
  const [log, setLog] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      if (enemyHp > 0) {
        const damage = Math.floor(Math.random() * 10) + 5;
        setEnemyHp((hp) => Math.max(0, hp - damage));
        setLog((logs) => [...logs.slice(-2), `プレイヤーの攻撃！ ${damage}のダメージ`]);
      }

      if (enemyHp > 0 && playerHp > 0) {
        const enemyDamage = Math.floor(Math.random() * 5) + 3;
        setPlayerHp((hp) => Math.max(0, hp - enemyDamage));
        setLog((logs) => [...logs.slice(-2), `敵の反撃！ ${enemyDamage}のダメージ`]);
      }

      if (enemyHp <= 0 || playerHp <= 0) {
        setIsFinished(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [enemyHp, playerHp, isFinished]);

  return (
    <Box flexDirection="column">
      <Text underline>== 自動バトル ==</Text>
      <Box marginTop={1}>
        <Text color="green">プレイヤー HP: {playerHp}/100</Text>
        <Text> | </Text>
        <Text color="red">敵 HP: {enemyHp}/50</Text>
      </Box>
      <Box borderStyle="single" marginTop={1} padding={1} height={4}>
        <Box flexDirection="column">
          {log.map((l, i) => (
            <Text key={i}>{l}</Text>
          ))}
          {isFinished && (
            <Text bold color={playerHp > 0 ? "green" : "red"}>
              {playerHp > 0 ? "勝利！" : "敗北..."}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// メインアプリ
const App: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => (p < 100 ? p + 5 : 0));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="magenta" padding={1} marginBottom={1}>
        <Text bold>React Ink 検証 PoC - キー入力なし版</Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        <LoadingAnimation />
        <Clock />
        <ProgressBar value={progress} max={100} />
        <AutoBattle />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>このデモは自動的に動作します（キー入力不要）</Text>
      </Box>
    </Box>
  );
};

// レンダリング（キー入力を使わないのでRaw modeエラーは発生しない）
render(<App />);