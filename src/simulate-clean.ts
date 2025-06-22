#!/usr/bin/env tsx
import { createGameStore, selectAIAction } from "./infra/game-store";

// シミュレーション実行
const runSimulation = async (maxTurns: number = 100): Promise<void> => {
  console.log("=== ハックアンドスラッシュ・シミュレーション開始 ===\n");

  const store = createGameStore();

  for (let turn = 0; turn < maxTurns; turn++) {
    const state = store.getState();

    // 状態を表示
    console.log(`ターン ${turn + 1}:`);
    console.log(`フロア: ${state.floor}`);
    console.log(
      `プレイヤー: Lv${state.player.level} HP ${state.player.health}/${state.player.maxHealth}`,
    );
    if (state.enemy) {
      console.log(
        `${state.enemy.name}: Lv${state.enemy.level} HP ${state.enemy.health}/${state.enemy.maxHealth}`,
      );
    }
    console.log("ログ:");
    state.logs.forEach((log) => console.log(`  > ${log.message}`));

    // ゲーム終了チェック
    if (state.isGameOver) {
      console.log("\n=== ゲーム終了 ===");
      if (state.isVictory) {
        console.log("🎉 勝利！全フロアクリア！");
      } else {
        console.log("💀 ゲームオーバー");
      }
      break;
    }

    // AIアクション選択と実行
    const action = selectAIAction(state);
    console.log(`\n選択アクション: ${action}`);
    store.dispatch(action);

    // 少し待機（視覚的な区切り）
    console.log("-".repeat(50));
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

// メイン関数
const main = async () => {
  await runSimulation();
};

main().catch(console.error);
