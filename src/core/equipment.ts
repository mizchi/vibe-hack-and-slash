import type {
  PlayerClass,
  EquipmentSlot,
  ItemTag,
  ClassEquipmentSlots,
  Item,
  Player,
} from "./types.ts";

// クラス別の装備スロット定義
export const CLASS_EQUIPMENT_SLOTS: ClassEquipmentSlots = {
  Warrior: {
    slots: ["MainHand", "OffHand", "Armor", "Helm", "Gloves", "Boots", "Ring1", "Ring2", "Amulet", "Belt"],
    restrictions: {
      MainHand: ["OneHanded", "TwoHanded"],
      OffHand: ["Shield", "OneHanded"], // 盾または二刀流
      Armor: ["HeavyArmor", "LightArmor"],
      Helm: ["Helm"],
      Gloves: ["Gloves"],
      Boots: ["Boots"],
      Ring1: ["Ring"],
      Ring2: ["Ring"],
      Amulet: ["Amulet"],
      Belt: ["Belt"],
    },
  },
  Mage: {
    slots: ["MainHand", "OffHand", "Armor", "Helm", "Gloves", "Boots", "Ring1", "Ring2", "Amulet", "Belt"],
    restrictions: {
      MainHand: ["Staff", "OneHanded"],
      OffHand: ["Shield"], // 魔法使いは基本的に盾のみ
      Armor: ["ClothArmor"],
      Helm: ["Helm"],
      Gloves: ["Gloves"],
      Boots: ["Boots"],
      Ring1: ["Ring"],
      Ring2: ["Ring"],
      Amulet: ["Amulet"],
      Belt: ["Belt"],
    },
  },
  Rogue: {
    slots: ["MainHand", "OffHand", "Armor", "Helm", "Gloves", "Boots", "Ring1", "Ring2", "Amulet", "Belt"],
    restrictions: {
      MainHand: ["Dagger", "OneHanded"],
      OffHand: ["Dagger", "OneHanded"], // 二刀流可能
      Armor: ["LightArmor"],
      Helm: ["Helm"],
      Gloves: ["Gloves"],
      Boots: ["Boots"],
      Ring1: ["Ring"],
      Ring2: ["Ring"],
      Amulet: ["Amulet"],
      Belt: ["Belt"],
    },
  },
  Paladin: {
    slots: ["MainHand", "OffHand", "Armor", "Helm", "Gloves", "Boots", "Ring1", "Ring2", "Amulet", "Belt"],
    restrictions: {
      MainHand: ["OneHanded", "TwoHanded"],
      OffHand: ["Shield"],
      Armor: ["HeavyArmor", "LightArmor"],
      Helm: ["Helm"],
      Gloves: ["Gloves"],
      Boots: ["Boots"],
      Ring1: ["Ring"],
      Ring2: ["Ring"],
      Amulet: ["Amulet"],
      Belt: ["Belt"],
    },
  },
};

// アイテムが特定のスロットに装備可能かチェック
export const canEquipItem = (
  item: Item,
  slot: EquipmentSlot,
  playerClass: PlayerClass,
  playerLevel: number
): { canEquip: boolean; reason?: string } => {
  // レベル制限チェック
  if (item.baseItem.requiredLevel && playerLevel < item.baseItem.requiredLevel) {
    return {
      canEquip: false,
      reason: `レベル${item.baseItem.requiredLevel}以上が必要です`,
    };
  }

  // クラス制限チェック
  if (item.baseItem.requiredClass && !item.baseItem.requiredClass.includes(playerClass)) {
    return {
      canEquip: false,
      reason: `${playerClass}は装備できません`,
    };
  }

  // スロット制限チェック
  const classSlots = CLASS_EQUIPMENT_SLOTS[playerClass];
  if (!classSlots.slots.includes(slot)) {
    return {
      canEquip: false,
      reason: `${playerClass}はこのスロットを使用できません`,
    };
  }

  // タグによる装備可能チェック
  const allowedTags = classSlots.restrictions[slot];
  if (!allowedTags) {
    return {
      canEquip: false,
      reason: "このスロットには装備できません",
    };
  }

  // アイテムのタグが許可されているかチェック
  const hasMatchingTag = item.baseItem.tags.some(tag => allowedTags.includes(tag));
  if (!hasMatchingTag) {
    return {
      canEquip: false,
      reason: "このタイプのアイテムは装備できません",
    };
  }

  // 両手武器の特殊処理
  if (item.baseItem.tags.includes("TwoHanded") && slot === "MainHand") {
    // 両手武器はOffHandも空いている必要がある（実装は後で）
    return { canEquip: true };
  }

  return { canEquip: true };
};

// プレイヤーの装備可能なスロットを取得
export const getPlayerEquipmentSlots = (playerClass: PlayerClass): EquipmentSlot[] => {
  return CLASS_EQUIPMENT_SLOTS[playerClass].slots;
};

// アイテムが装備可能なスロットを取得
export const getValidSlotsForItem = (
  item: Item,
  playerClass: PlayerClass,
  playerLevel: number
): EquipmentSlot[] => {
  const classSlots = CLASS_EQUIPMENT_SLOTS[playerClass];
  const validSlots: EquipmentSlot[] = [];

  classSlots.slots.forEach(slot => {
    const { canEquip } = canEquipItem(item, slot, playerClass, playerLevel);
    if (canEquip) {
      validSlots.push(slot);
    }
  });

  return validSlots;
};

// 装備の総重量計算（将来的な拡張用）
export const calculateEquipmentWeight = (equipment: Map<EquipmentSlot, Item>): number => {
  let totalWeight = 0;
  
  equipment.forEach(item => {
    // 重装甲ほど重い
    if (item.baseItem.tags.includes("HeavyArmor")) totalWeight += 10;
    else if (item.baseItem.tags.includes("LightArmor")) totalWeight += 5;
    else if (item.baseItem.tags.includes("ClothArmor")) totalWeight += 2;
    
    // 両手武器は重い
    if (item.baseItem.tags.includes("TwoHanded")) totalWeight += 8;
    else if (item.baseItem.tags.includes("OneHanded")) totalWeight += 4;
    else if (item.baseItem.tags.includes("Shield")) totalWeight += 6;
  });
  
  return totalWeight;
};

// 両手武器装備時の処理
export const handleTwoHandedEquip = (
  equipment: Map<EquipmentSlot, Item>,
  item: Item
): Map<EquipmentSlot, Item> => {
  const newEquipment = new Map(equipment);
  
  if (item.baseItem.tags.includes("TwoHanded")) {
    // 両手武器装備時はOffHandを外す
    newEquipment.delete("OffHand");
    newEquipment.set("MainHand", item);
  }
  
  return newEquipment;
};