#!/usr/bin/env tsx
// ゲームの状態をスナップショットとして取得・保存

import React from "react";
import { createGameStore, selectAIAction } from "./infra/game-store";
import { captureSnapshot, saveSnapshot, loadLatestSnapshot } from "./infra/snapshot";
import { GameRenderer } from "./presentation/game-renderer";

// ゲームを指定ターン実行してスナップショットを取得
const runGameWithSnapshots = async (turns: number = 10) => {
  const store = createGameStore();
  
  console.log("=== ゲームスナップショット取得開始 ===\n");

  for (let turn = 0; turn < turns; turn++) {
    const state = store.getState();

    // ゲーム終了チェック
    if (state.isGameOver) {
      console.log(`ゲーム終了 (ターン ${turn})`);
      break;
    }

    // AIアクション実行
    const action = selectAIAction(state);
    store.dispatch(action);

    // 3ターンごとにスナップショットを取得
    if ((turn + 1) % 3 === 0) {
      console.log(`ターン ${turn + 1} のスナップショットを取得中...`);
      
      // React要素を作成
      const element = React.createElement(GameRenderer, {
        gameState: store.getState(),
      });

      // スナップショットを取得
      const snapshot = await captureSnapshot(element, 50);
      
      // ファイルに保存
      const filepath = await saveSnapshot(snapshot, `game-turn-${turn + 1}`);
      console.log(`スナップショット保存: ${filepath}`);
      
      // スナップショットの内容を表示
      console.log("\n--- スナップショット内容 ---");
      console.log(snapshot);
      console.log("--- スナップショット終了 ---\n");
    }
  }
};

// 最新のスナップショットを表示
const showLatestSnapshot = async () => {
  console.log("\n=== 最新のスナップショットを読み込み ===");
  
  const snapshot = await loadLatestSnapshot("game-turn");
  
  if (snapshot) {
    console.log("\n--- 最新のスナップショット ---");
    console.log(snapshot);
    console.log("--- スナップショット終了 ---");
  } else {
    console.log("スナップショットが見つかりません");
  }
};

// メイン処理
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args[0] === "show") {
    // 最新のスナップショットを表示
    await showLatestSnapshot();
  } else {
    // ゲームを実行してスナップショットを取得
    const turns = parseInt(args[0]) || 10;
    await runGameWithSnapshots(turns);
  }
};

main().catch(console.error);