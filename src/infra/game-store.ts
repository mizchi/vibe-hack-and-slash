// インフラ層 - 状態管理（関数型アプローチ）

import type { GameState, GameAction } from "../core";
import { createInitialGameState, executeGameAction } from "../core";

// 状態を保持するストア型
export type GameStore = {
  getState: () => GameState;
  dispatch: (action: GameAction) => void;
  subscribe: (listener: (state: GameState) => void) => () => void;
};

// ストアの作成（関数型アプローチ）
export const createGameStore = (): GameStore => {
  let state = createInitialGameState();
  const listeners = new Set<(state: GameState) => void>();

  const getState = () => state;

  const dispatch = (action: GameAction) => {
    state = executeGameAction(state, action);
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener: (state: GameState) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, dispatch, subscribe };
};

// AIエージェント用の戦略関数
export const selectAIAction = (state: GameState): GameAction => {
  if (state.isGameOver) {
    return "restart";
  }

  if (!state.enemy) {
    return "attack";
  }

  // 体力が少ない時は防御
  if (state.player.health < state.player.maxHealth * 0.3) {
    return "defend";
  }

  // 敵の体力が少ない時はスキル
  if (state.enemy.health < state.enemy.maxHealth * 0.3) {
    return "skill";
  }

  // 通常は攻撃
  return "attack";
};
