#!/usr/bin/env tsx
import React, { useEffect, useState } from "react";
import { render, Text, Box, useInput, useApp } from "ink";
import { createGameStore } from "./infra/game-store";
import type { GameState } from "./core";

const Game: React.FC = () => {
  const { exit } = useApp();
  const [store] = useState(() => createGameStore());
  const [gameState, setGameState] = useState<GameState>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setGameState);
    return unsubscribe;
  }, [store]);

  useInput((input, _key) => {
    if (input === "q") {
      exit();
    }

    if (input === "a") {
      store.dispatch("attack");
    }

    if (input === "d") {
      store.dispatch("defend");
    }

    if (input === "s") {
      store.dispatch("skill");
    }

    if (input === "r" && gameState.isGameOver) {
      store.dispatch("restart");
    }
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="green" padding={1}>
        <Text>Hack n' Slash CLI Game - Floor {gameState.floor}</Text>
      </Box>

      <Box marginTop={1}>
        <Box>
          <Text color="green">
            プレイヤー Lv{gameState.player.level}: HP {gameState.player.health}/
            {gameState.player.maxHealth}
          </Text>
          <Text> | </Text>
          {gameState.enemy && (
            <Text color="red">
              {gameState.enemy.name} Lv{gameState.enemy.level}: HP {gameState.enemy.health}/
              {gameState.enemy.maxHealth}
            </Text>
          )}
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text>
          EXP: {gameState.player.exp}/{gameState.player.level * 50}
        </Text>
      </Box>

      <Box marginTop={1} borderStyle="single" padding={1} height={7}>
        <Box flexDirection="column">
          {gameState.logs.map((log, i) => (
            <Text key={i}>{log.message}</Text>
          ))}
        </Box>
      </Box>

      <Box marginTop={1}>
        {!gameState.isGameOver ? (
          <Text>操作: [A] 攻撃 | [D] 防御 | [S] スキル | [Q] 終了</Text>
        ) : (
          <Text>
            {gameState.isVictory ? "🎉 ゲームクリア！" : "💀 ゲームオーバー"} | [R] 再開 | [Q] 終了
          </Text>
        )}
      </Box>
    </Box>
  );
};

render(<Game />);
