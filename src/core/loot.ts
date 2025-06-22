import type {
  Item,
  BaseItem,
  ItemPrefix,
  ItemSuffix,
  ItemRarity,
  LootEntry,
  Level,
  ItemId,
} from "./types.ts";

// Prefix/Suffixのプール
export const ITEM_PREFIXES: ItemPrefix[] = [
  { name: "Sharp", modifiers: [{ type: "IncreaseDamage", value: 5 }] },
  { name: "Brutal", modifiers: [{ type: "IncreaseDamage", value: 10 }] },
  { name: "Vampiric", modifiers: [{ type: "LifeSteal", percentage: 0.1 }] },
  { name: "Precise", modifiers: [{ type: "CriticalChance", percentage: 0.1 }] },
  { name: "Devastating", modifiers: [{ type: "CriticalDamage", multiplier: 0.5 }] },
  { name: "Sturdy", modifiers: [{ type: "IncreaseHealth", value: 20 }] },
  { name: "Fortified", modifiers: [{ type: "IncreaseDefense", value: 10 }] },
];

export const ITEM_SUFFIXES: ItemSuffix[] = [
  { name: "of Power", modifiers: [{ type: "IncreaseDamage", value: 8 }] },
  { name: "of Vitality", modifiers: [{ type: "IncreaseHealth", value: 30 }] },
  { name: "of Protection", modifiers: [{ type: "IncreaseDefense", value: 15 }] },
  { name: "of the Assassin", modifiers: [{ type: "CriticalChance", percentage: 0.15 }] },
  { name: "of Destruction", modifiers: [{ type: "CriticalDamage", multiplier: 0.75 }] },
  { name: "of Blood", modifiers: [{ type: "LifeSteal", percentage: 0.15 }] },
  { name: "of the Warrior", modifiers: [
    { type: "IncreaseDamage", value: 5 },
    { type: "IncreaseHealth", value: 15 },
  ]},
];

// レアリティ決定
export const determineRarity = (
  weights: LootEntry["rarityWeights"],
  random: () => number = Math.random
): ItemRarity => {
  const total = weights.common + weights.magic + weights.rare + weights.legendary;
  const roll = random() * total;
  
  if (roll < weights.common) return "Common";
  if (roll < weights.common + weights.magic) return "Magic";
  if (roll < weights.common + weights.magic + weights.rare) return "Rare";
  return "Legendary";
};

// アイテム生成
export const generateItem = (
  baseItem: BaseItem,
  level: Level,
  rarity: ItemRarity,
  random: () => number = Math.random
): Item => {
  const item: Item = {
    id: `${baseItem.id}_${Date.now()}_${Math.floor(random() * 10000)}` as ItemId,
    baseItem,
    rarity,
    level,
  };
  
  // レアリティに応じてPrefix/Suffixを付与
  switch (rarity) {
    case "Common":
      // 何も付与しない
      break;
    case "Magic":
      // PrefixかSuffixのどちらか
      if (random() < 0.5) {
        item.prefix = ITEM_PREFIXES[Math.floor(random() * ITEM_PREFIXES.length)];
      } else {
        item.suffix = ITEM_SUFFIXES[Math.floor(random() * ITEM_SUFFIXES.length)];
      }
      break;
    case "Rare":
    case "Legendary":
      // 両方付与
      item.prefix = ITEM_PREFIXES[Math.floor(random() * ITEM_PREFIXES.length)];
      item.suffix = ITEM_SUFFIXES[Math.floor(random() * ITEM_SUFFIXES.length)];
      break;
  }
  
  return item;
};

// ドロップ判定
export const rollLoot = (
  lootTable: LootEntry[],
  baseItems: Map<ItemId, BaseItem>,
  level: Level,
  random: () => number = Math.random
): Item[] => {
  const drops: Item[] = [];
  
  for (const entry of lootTable) {
    if (random() <= entry.dropChance) {
      const baseItem = baseItems.get(entry.baseItemId);
      if (!baseItem) continue;
      
      const rarity = determineRarity(entry.rarityWeights, random);
      const item = generateItem(baseItem, level, rarity, random);
      drops.push(item);
    }
  }
  
  return drops;
};

// アイテム名の生成
export const getItemDisplayName = (item: Item): string => {
  const parts: string[] = [];
  
  if (item.prefix) parts.push(item.prefix.name);
  parts.push(item.baseItem.name);
  if (item.suffix) parts.push(item.suffix.name);
  
  return parts.join(" ");
};

// アイテムのトータルステータス表示
export const getItemStats = (item: Item): string[] => {
  const stats: string[] = [];
  const allModifiers = [
    ...item.baseItem.baseModifiers,
    ...(item.prefix?.modifiers || []),
    ...(item.suffix?.modifiers || []),
  ];
  
  // 同じタイプのモディファイアを集計
  const aggregated = new Map<string, number>();
  
  allModifiers.forEach((mod) => {
    switch (mod.type) {
      case "IncreaseDamage":
        aggregated.set("damage", (aggregated.get("damage") || 0) + mod.value);
        break;
      case "IncreaseHealth":
        aggregated.set("health", (aggregated.get("health") || 0) + mod.value);
        break;
      case "IncreaseDefense":
        aggregated.set("defense", (aggregated.get("defense") || 0) + mod.value);
        break;
      case "LifeSteal":
        aggregated.set("lifesteal", (aggregated.get("lifesteal") || 0) + mod.percentage * 100);
        break;
      case "CriticalChance":
        aggregated.set("critchance", (aggregated.get("critchance") || 0) + mod.percentage * 100);
        break;
      case "CriticalDamage":
        aggregated.set("critdamage", (aggregated.get("critdamage") || 0) + mod.multiplier * 100);
        break;
    }
  });
  
  aggregated.forEach((value, key) => {
    switch (key) {
      case "damage":
        stats.push(`+${value} Damage`);
        break;
      case "health":
        stats.push(`+${value} Health`);
        break;
      case "defense":
        stats.push(`+${value} Defense`);
        break;
      case "lifesteal":
        stats.push(`${value.toFixed(1)}% Life Steal`);
        break;
      case "critchance":
        stats.push(`${value.toFixed(1)}% Critical Chance`);
        break;
      case "critdamage":
        stats.push(`${value.toFixed(1)}% Critical Damage`);
        break;
    }
  });
  
  return stats;
};