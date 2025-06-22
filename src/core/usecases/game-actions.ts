// ユースケース層 - ゲームアクションの処理

import type { GameState, GameAction } from "../domain/entities";
import { createGameLog, createInitialGameState } from "../domain/entities";
import {
  calculateDamage,
  calculateSkillDamage,
  calculateDefendedDamage,
  damagePlayer,
  damageEnemy,
  isPlayerDefeated,
  isEnemyDefeated,
  shouldLevelUp,
  levelUpPlayer,
  addExpToPlayer,
  calculateExpReward,
  generateEnemy,
  isGameClear,
} from "../domain/rules";

// ログの追加
const addLog = (state: GameState, message: string): GameState => ({
  ...state,
  logs: [...state.logs.slice(-4), createGameLog(message)],
});

// 攻撃アクション
const executeAttack = (state: GameState): GameState => {
  if (!state.enemy || state.isGameOver) return state;

  // プレイヤーの攻撃
  const damage = calculateDamage(state.player);
  const damagedEnemy = damageEnemy(state.enemy, damage);
  let newState: GameState = {
    ...state,
    enemy: damagedEnemy,
  };
  newState = addLog(newState, `プレイヤーの攻撃！ ${damage}のダメージ！`);

  // 敵が倒れたかチェック
  if (isEnemyDefeated(damagedEnemy)) {
    return handleEnemyDefeat(newState);
  }

  // 敵の反撃
  return enemyCounterAttack(newState);
};

// 防御アクション
const executeDefend = (state: GameState): GameState => {
  if (!state.enemy || state.isGameOver) return state;

  const enemyDamage = calculateDamage(state.enemy);
  const reducedDamage = calculateDefendedDamage(enemyDamage);
  const damagedPlayer = damagePlayer(state.player, reducedDamage);

  let newState = {
    ...state,
    player: damagedPlayer,
  };
  newState = addLog(newState, `防御姿勢！ 敵の攻撃を軽減し、${reducedDamage}のダメージ！`);

  if (isPlayerDefeated(damagedPlayer)) {
    return handlePlayerDefeat(newState);
  }

  return newState;
};

// スキルアクション
const executeSkill = (state: GameState): GameState => {
  if (!state.enemy || state.isGameOver) return state;

  const skillDamage = calculateSkillDamage(state.player);
  const damagedEnemy = damageEnemy(state.enemy, skillDamage);
  let newState: GameState = {
    ...state,
    enemy: damagedEnemy,
  };
  newState = addLog(newState, `必殺技発動！ ${skillDamage}の大ダメージ！`);

  if (isEnemyDefeated(damagedEnemy)) {
    return handleEnemyDefeat(newState);
  }

  return enemyCounterAttack(newState);
};

// 敵の反撃
const enemyCounterAttack = (state: GameState): GameState => {
  if (!state.enemy) return state;

  const damage = calculateDamage(state.enemy);
  const damagedPlayer = damagePlayer(state.player, damage);

  let newState = {
    ...state,
    player: damagedPlayer,
  };
  newState = addLog(newState, `${state.enemy.name}の反撃！ ${damage}のダメージ！`);

  if (isPlayerDefeated(damagedPlayer)) {
    return handlePlayerDefeat(newState);
  }

  return newState;
};

// 敵撃破処理
const handleEnemyDefeat = (state: GameState): GameState => {
  if (!state.enemy) return state;

  const expReward = calculateExpReward(state.enemy);
  let updatedPlayer = addExpToPlayer(state.player, expReward);

  let newState = addLog(state, `${state.enemy.name}を倒した！ ${expReward}の経験値を獲得！`);

  // レベルアップチェック
  if (shouldLevelUp(updatedPlayer)) {
    updatedPlayer = levelUpPlayer(updatedPlayer);
    newState = addLog(newState, `レベルアップ！ レベル${updatedPlayer.level}になった！`);
  }

  // 次のフロアへ
  const nextFloor = state.floor + 1;
  if (isGameClear(nextFloor)) {
    return {
      ...newState,
      player: updatedPlayer,
      enemy: null,
      floor: nextFloor,
      isGameOver: true,
      isVictory: true,
    };
  }

  // 新しい敵を生成
  const newEnemy = generateEnemy(nextFloor);
  newState = {
    ...newState,
    player: updatedPlayer,
    enemy: newEnemy,
    floor: nextFloor,
  };
  return addLog(newState, `フロア${nextFloor}：${newEnemy.name}が現れた！`);
};

// プレイヤー敗北処理
const handlePlayerDefeat = (state: GameState): GameState => {
  let newState = {
    ...state,
    isGameOver: true,
    isVictory: false,
  };
  return addLog(newState, "プレイヤーが倒れた...ゲームオーバー");
};

// メインのアクション実行関数
export const executeGameAction = (state: GameState, action: GameAction): GameState => {
  switch (action) {
    case "attack":
      return executeAttack(state);
    case "defend":
      return executeDefend(state);
    case "skill":
      return executeSkill(state);
    case "restart":
      return createInitialGameState();
    default:
      return state;
  }
};
