import type { Item, Gold, ItemRarity } from "./types.ts";

// レアリティごとの基本価値倍率
const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  Common: 1,
  Magic: 2.5,
  Rare: 5,
  Legendary: 10,
};

// アイテムタイプごとの基本価値
const TYPE_BASE_VALUES = {
  Weapon: 50,
  Armor: 40,
  Accessory: 30,
};

// アイテムの売却価値を計算
export const calculateItemValue = (item: Item): Gold => {
  // 基本価値
  let value = TYPE_BASE_VALUES[item.baseItem.type];
  
  // レベルボーナス
  value += item.level * 10;
  
  // レアリティ倍率
  value *= RARITY_MULTIPLIERS[item.rarity];
  
  // modifier数によるボーナス
  const totalModifiers = 
    item.baseItem.baseModifiers.length +
    (item.prefix?.modifiers.length || 0) +
    (item.suffix?.modifiers.length || 0);
  
  value += totalModifiers * 15;
  
  // 売却時は50%の価値
  return Math.floor(value * 0.5) as Gold;
};

// ゴールドを文字列形式でフォーマット
export const formatGold = (gold: Gold): string => {
  if (gold >= 1000000) {
    return `${(gold / 1000000).toFixed(1)}M`;
  } else if (gold >= 1000) {
    return `${(gold / 1000).toFixed(1)}K`;
  }
  return gold.toString();
};