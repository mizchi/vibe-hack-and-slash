// ビジネスルール（純粋関数）

import type { Player, Enemy } from "./entities";

// ダメージ計算
export const calculateDamage = (attacker: { attack: number }): number => {
  const baseDamage = attacker.attack;
  const variance = Math.floor(Math.random() * 5);
  return baseDamage + variance;
};

export const calculateSkillDamage = (attacker: { attack: number }): number => {
  return attacker.attack * 2;
};

export const calculateDefendedDamage = (damage: number): number => {
  return Math.floor(damage * 0.5);
};

// プレイヤーの更新
export const damagePlayer = (player: Player, damage: number): Player => ({
  ...player,
  health: Math.max(0, player.health - damage),
});

export const healPlayer = (player: Player, amount: number): Player => ({
  ...player,
  health: Math.min(player.maxHealth, player.health + amount),
});

export const levelUpPlayer = (player: Player): Player => ({
  level: player.level + 1,
  maxHealth: player.maxHealth + 20,
  health: player.maxHealth + 20, // 全回復
  attack: player.attack + 5,
  exp: 0,
});

export const addExpToPlayer = (player: Player, exp: number): Player => ({
  ...player,
  exp: player.exp + exp,
});

// 敵の更新
export const damageEnemy = (enemy: Enemy, damage: number): Enemy => ({
  ...enemy,
  health: Math.max(0, enemy.health - damage),
});

// 勝利・敗北判定
export const isPlayerDefeated = (player: Player): boolean => player.health === 0;

export const isEnemyDefeated = (enemy: Enemy): boolean => enemy.health === 0;

export const shouldLevelUp = (player: Player): boolean => {
  const requiredExp = player.level * 50;
  return player.exp >= requiredExp;
};

export const isGameClear = (floor: number): boolean => floor > 10;

// 敵の生成
export const generateEnemy = (floor: number): Enemy => {
  const enemies = [
    { name: "スライム", baseHealth: 50, baseAttack: 5, baseLevel: 1 },
    { name: "ゴブリン", baseHealth: 70, baseAttack: 8, baseLevel: 2 },
    { name: "オーク", baseHealth: 100, baseAttack: 12, baseLevel: 3 },
    { name: "ドラゴン", baseHealth: 150, baseAttack: 20, baseLevel: 5 },
  ];

  const enemyIndex = Math.min(Math.floor(floor / 3), enemies.length - 1);
  const enemyTemplate = enemies[enemyIndex];

  const health = enemyTemplate.baseHealth + (floor - 1) * 10;
  const attack = enemyTemplate.baseAttack + Math.floor(floor / 2);
  const level = enemyTemplate.baseLevel + Math.floor(floor / 3);

  return {
    name: enemyTemplate.name,
    health,
    maxHealth: health,
    attack,
    level,
  };
};

export const calculateExpReward = (enemy: Enemy): number => {
  return enemy.level * 10;
};
