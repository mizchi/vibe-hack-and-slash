import type {
  Item,
  BaseItem,
  ItemPrefix,
  ItemSuffix,
  ItemRarity,
  LootEntry,
  Level,
  ItemId,
  MonsterTier,
  ItemModifier,
} from "./types.ts";
import { adjustRarityWeights, adjustDropChance } from "./loot-modifiers.ts";
import { generateItemWithMoonbit, ENABLE_MOONBIT_INTEGRATION } from "../moonbit/adapter.ts";

// Prefix/Suffixのプール（レアリティによって効果を増幅）
export const ITEM_PREFIXES: ItemPrefix[] = [
  { name: "Sharp", modifiers: [{ type: "IncreaseDamage", value: 12 }] },
  { name: "Brutal", modifiers: [{ type: "IncreaseDamage", value: 25 }] },
  { name: "Vampiric", modifiers: [{ type: "LifeSteal", percentage: 0.2 }] },
  { name: "Precise", modifiers: [{ type: "CriticalChance", percentage: 0.15 }] },
  { name: "Devastating", modifiers: [{ type: "CriticalDamage", multiplier: 0.75 }] },
  { name: "Sturdy", modifiers: [{ type: "IncreaseHealth", value: 40 }] },
  { name: "Fortified", modifiers: [{ type: "IncreaseDefense", value: 20 }] },
  { name: "Mystic", modifiers: [{ type: "IncreaseMana", value: 30 }] },
  { name: "Arcane", modifiers: [{ type: "SkillPower", percentage: 25 }] },
  { name: "Flowing", modifiers: [{ type: "ManaRegen", value: 6 }] },
];

export const ITEM_SUFFIXES: ItemSuffix[] = [
  { name: "of Power", modifiers: [{ type: "IncreaseDamage", value: 20 }] },
  { name: "of Vitality", modifiers: [{ type: "IncreaseHealth", value: 60 }] },
  { name: "of Protection", modifiers: [{ type: "IncreaseDefense", value: 30 }] },
  { name: "of the Assassin", modifiers: [{ type: "CriticalChance", percentage: 0.25 }] },
  { name: "of Destruction", modifiers: [{ type: "CriticalDamage", multiplier: 1.0 }] },
  { name: "of Blood", modifiers: [{ type: "LifeSteal", percentage: 0.25 }] },
  { name: "of the Warrior", modifiers: [
    { type: "IncreaseDamage", value: 15 },
    { type: "IncreaseHealth", value: 35 },
  ]},
  { name: "of the Mage", modifiers: [
    { type: "IncreaseMana", value: 40 },
    { type: "SkillPower", percentage: 20 },
  ]},
  { name: "of Wisdom", modifiers: [{ type: "ManaRegen", value: 10 }] },
  { name: "of Sorcery", modifiers: [{ type: "SkillPower", percentage: 40 }] },
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

// レアリティによる倍率
const RARITY_MULTIPLIERS = {
  Common: 1.0,
  Magic: 1.5,
  Rare: 2.0,
  Legendary: 3.0,
};

// モディファイアに倍率を適用
const applyRarityMultiplier = (
  modifiers: ItemModifier[],
  rarity: ItemRarity
): ItemModifier[] => {
  const multiplier = RARITY_MULTIPLIERS[rarity];
  return modifiers.map(mod => {
    switch (mod.type) {
      case "IncreaseDamage":
      case "IncreaseHealth":
      case "IncreaseDefense":
      case "IncreaseMana":
      case "ManaRegen":
        return { ...mod, value: Math.floor(mod.value * multiplier) };
      case "LifeSteal":
      case "CriticalChance":
      case "SkillPower":
        return { ...mod, percentage: mod.percentage * multiplier };
      case "CriticalDamage":
        return { ...mod, multiplier: mod.multiplier * multiplier };
      default:
        return mod;
    }
  });
};

// アイテム生成
export const generateItem = async (
  baseItem: BaseItem,
  level: Level,
  rarity: ItemRarity,
  random: () => number = Math.random
): Promise<Item> => {
  // Moonbit統合が有効な場合、Moonbitの実装を使用
  if (ENABLE_MOONBIT_INTEGRATION) {
    const moonbitItem = await generateItemWithMoonbit(
      baseItem.name,
      level,
      rarity
    );
    if (moonbitItem) {
      return moonbitItem;
    }
    // フォールバック：Moonbitが失敗した場合は既存の実装を使用
  }
  
  return generateItemTS(baseItem, level, rarity, random);
};

// TypeScript実装（既存のコード）
const generateItemTS = (
  baseItem: BaseItem,
  level: Level,
  rarity: ItemRarity,
  random: () => number = Math.random
): Item => {
  // ベースアイテムのモディファイアにレアリティ倍率を適用
  const enhancedBaseItem = {
    ...baseItem,
    baseModifiers: applyRarityMultiplier(baseItem.baseModifiers, rarity),
  };
  
  const item: Item = {
    id: `${baseItem.id}_${Date.now()}_${Math.floor(random() * 10000)}` as ItemId,
    baseItem: enhancedBaseItem,
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
        const prefix = ITEM_PREFIXES[Math.floor(random() * ITEM_PREFIXES.length)];
        item.prefix = {
          ...prefix,
          modifiers: applyRarityMultiplier(prefix.modifiers, rarity),
        };
      } else {
        const suffix = ITEM_SUFFIXES[Math.floor(random() * ITEM_SUFFIXES.length)];
        item.suffix = {
          ...suffix,
          modifiers: applyRarityMultiplier(suffix.modifiers, rarity),
        };
      }
      break;
    case "Rare":
    case "Legendary":
      // 両方付与
      const prefix = ITEM_PREFIXES[Math.floor(random() * ITEM_PREFIXES.length)];
      const suffix = ITEM_SUFFIXES[Math.floor(random() * ITEM_SUFFIXES.length)];
      item.prefix = {
        ...prefix,
        modifiers: applyRarityMultiplier(prefix.modifiers, rarity),
      };
      item.suffix = {
        ...suffix,
        modifiers: applyRarityMultiplier(suffix.modifiers, rarity),
      };
      break;
  }
  
  return item;
};

// ドロップ判定
export const rollLoot = async (
  lootTable: LootEntry[],
  baseItems: Map<ItemId, BaseItem>,
  level: Level,
  random: () => number = Math.random,
  monsterTier: MonsterTier = "Common"
): Promise<Item[]> => {
  const drops: Item[] = [];
  
  for (const entry of lootTable) {
    // Tierに基づいてドロップ率を調整
    const adjustedDropChance = adjustDropChance(entry.dropChance, monsterTier);
    
    if (random() <= adjustedDropChance) {
      const baseItem = baseItems.get(entry.baseItemId);
      if (!baseItem) continue;
      
      // Tierに基づいてレアリティウェイトを調整
      const adjustedWeights = adjustRarityWeights(entry.rarityWeights, monsterTier);
      const rarity = determineRarity(adjustedWeights, random);
      const item = await generateItem(baseItem, level, rarity, random);
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
      case "IncreaseMana":
        aggregated.set("mana", (aggregated.get("mana") || 0) + mod.value);
        break;
      case "ManaRegen":
        aggregated.set("manaregen", (aggregated.get("manaregen") || 0) + mod.value);
        break;
      case "SkillPower":
        aggregated.set("skillpower", (aggregated.get("skillpower") || 0) + mod.percentage);
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
      case "mana":
        stats.push(`+${value} Mana`);
        break;
      case "manaregen":
        stats.push(`+${value} Mana Regen`);
        break;
      case "skillpower":
        stats.push(`+${value.toFixed(0)} Skill Power`);
        break;
    }
  });
  
  return stats;
};