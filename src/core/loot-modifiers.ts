import type { MonsterTier } from "./types.ts";

// Tier別のドロップ率とレアリティ修正値
export const TIER_MODIFIERS = {
  Common: {
    dropRateMultiplier: 0.3,     // 基本ドロップ率の30%
    rarityBonus: {
      common: 0,
      magic: 0,
      rare: -5,       // レアが出にくい
      legendary: -10  // レジェンダリーがかなり出にくい
    },
    goldMultiplier: 0.8
  },
  Elite: {
    dropRateMultiplier: 0.5,     // 基本ドロップ率の50%
    rarityBonus: {
      common: -10,
      magic: 5,
      rare: 5,
      legendary: 0
    },
    goldMultiplier: 1.5
  },
  Rare: {
    dropRateMultiplier: 0.8,     // 基本ドロップ率の80%
    rarityBonus: {
      common: -20,
      magic: 5,
      rare: 10,
      legendary: 5
    },
    goldMultiplier: 3
  },
  Boss: {
    dropRateMultiplier: 1.0,     // 基本ドロップ率の100%
    rarityBonus: {
      common: -30,
      magic: 0,
      rare: 20,
      legendary: 10
    },
    goldMultiplier: 5
  },
  Legendary: {
    dropRateMultiplier: 1.0,     // 必ずドロップ
    rarityBonus: {
      common: -50,
      magic: -10,
      rare: 30,
      legendary: 30
    },
    goldMultiplier: 10
  }
};

// Tierに基づいてレアリティウェイトを調整
export const adjustRarityWeights = (
  baseWeights: { common: number; magic: number; rare: number; legendary: number },
  tier: MonsterTier
): { common: number; magic: number; rare: number; legendary: number } => {
  const modifier = TIER_MODIFIERS[tier];
  
  return {
    common: Math.max(0, baseWeights.common + modifier.rarityBonus.common),
    magic: Math.max(0, baseWeights.magic + modifier.rarityBonus.magic),
    rare: Math.max(0, baseWeights.rare + modifier.rarityBonus.rare),
    legendary: Math.max(0, baseWeights.legendary + modifier.rarityBonus.legendary)
  };
};

// Tierに基づいてドロップ率を調整
export const adjustDropChance = (baseChance: number, tier: MonsterTier): number => {
  const modifier = TIER_MODIFIERS[tier];
  return Math.min(1, baseChance * modifier.dropRateMultiplier);
};