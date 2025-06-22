import type { 
  Player, 
  Monster, 
  Damage, 
  ElementType, 
  ElementResistance,
  BaseStats,
  WeaponScaling,
  Item
} from "./types.ts";
import { calculateTotalStats } from "./combat.ts";

// 属性耐性によるダメージ計算
export const calculateElementalDamage = (
  baseDamage: number,
  element: ElementType,
  targetResistance: ElementResistance
): number => {
  const resistance = targetResistance[element] || 0;
  // 耐性は-100%から100%の間で計算
  // 負の値は弱点（ダメージ増加）
  const multiplier = 1 - (resistance / 100);
  return Math.max(0, Math.floor(baseDamage * multiplier));
};

// 武器ダメージの計算（ステータススケーリング込み）
export const calculateWeaponDamage = (
  weapon: Item | undefined,
  playerAttributes: BaseStats
): number => {
  if (!weapon || weapon.baseItem.type !== "Weapon") {
    // 素手の場合はSTRの半分
    return Math.floor(playerAttributes.strength / 2);
  }

  const baseItem = weapon.baseItem;
  const scaling = baseItem.weaponScaling || { strength: 0.5 }; // デフォルトはSTR50%
  
  // 基礎ダメージを取得
  let baseDamage = 0;
  for (const mod of baseItem.baseModifiers) {
    if (mod.type === "IncreaseDamage") {
      baseDamage += mod.value;
    }
  }
  
  // Prefix/Suffixからの追加ダメージ
  if (weapon.prefix) {
    for (const mod of weapon.prefix.modifiers) {
      if (mod.type === "IncreaseDamage") {
        baseDamage += mod.value;
      }
    }
  }
  if (weapon.suffix) {
    for (const mod of weapon.suffix.modifiers) {
      if (mod.type === "IncreaseDamage") {
        baseDamage += mod.value;
      }
    }
  }
  
  // ステータススケーリングを適用
  let scaledDamage = baseDamage;
  if (scaling.strength) {
    scaledDamage += Math.floor(playerAttributes.strength * scaling.strength);
  }
  if (scaling.intelligence) {
    scaledDamage += Math.floor(playerAttributes.intelligence * scaling.intelligence);
  }
  if (scaling.dexterity) {
    scaledDamage += Math.floor(playerAttributes.dexterity * scaling.dexterity);
  }
  
  return scaledDamage;
};

// プレイヤーの合計属性を計算
export const calculateTotalAttributes = (player: Player): BaseStats => {
  const total = { ...player.baseAttributes };
  
  // 装備からの属性ボーナスを加算
  for (const [_, item] of player.equipment) {
    const allModifiers = [
      ...item.baseItem.baseModifiers,
      ...(item.prefix?.modifiers || []),
      ...(item.suffix?.modifiers || [])
    ];
    
    for (const mod of allModifiers) {
      switch (mod.type) {
        case "IncreaseStrength":
          total.strength = (total.strength + mod.value) as any;
          break;
        case "IncreaseIntelligence":
          total.intelligence = (total.intelligence + mod.value) as any;
          break;
        case "IncreaseDexterity":
          total.dexterity = (total.dexterity + mod.value) as any;
          break;
        case "IncreaseVitality":
          total.vitality = (total.vitality + mod.value) as any;
          break;
      }
    }
  }
  
  // レベルアップボーナス（レベルごとに各属性+2）
  const levelBonus = (player.level - 1) * 2;
  total.strength = (total.strength + levelBonus) as any;
  total.intelligence = (total.intelligence + levelBonus) as any;
  total.dexterity = (total.dexterity + levelBonus) as any;
  total.vitality = (total.vitality + levelBonus) as any;
  
  return total;
};

// プレイヤーの合計属性耐性を計算
export const calculateTotalElementResistance = (player: Player): ElementResistance => {
  const total = { ...player.elementResistance };
  
  // 装備からの属性耐性を加算
  for (const [_, item] of player.equipment) {
    const allModifiers = [
      ...item.baseItem.baseModifiers,
      ...(item.prefix?.modifiers || []),
      ...(item.suffix?.modifiers || [])
    ];
    
    for (const mod of allModifiers) {
      if (mod.type === "ElementResistance") {
        total[mod.element] = Math.min(75, total[mod.element] + mod.value); // 最大75%
      }
    }
  }
  
  return total;
};

// 実際の攻撃ダメージ計算
export const calculateAttackDamage = (
  attacker: Player,
  target: Monster,
  isCritical: boolean = false
): { damage: number; element: ElementType } => {
  const totalAttributes = calculateTotalAttributes(attacker);
  const mainWeapon = attacker.equipment.get("MainHand");
  
  // 武器ダメージを計算
  const weaponDamage = calculateWeaponDamage(mainWeapon, totalAttributes);
  
  // クリティカル計算
  const stats = calculateTotalStats(attacker);
  const critMultiplier = isCritical ? stats.criticalDamage : 1;
  
  // 基本ダメージ
  let totalDamage = weaponDamage * critMultiplier;
  
  // 防御力による軽減
  const defenseReduction = target.stats.defense / (target.stats.defense + 100);
  totalDamage = Math.floor(totalDamage * (1 - defenseReduction));
  
  // 属性決定
  const element = mainWeapon?.baseItem.elementType || "Physical";
  
  // 属性耐性による計算
  const finalDamage = calculateElementalDamage(totalDamage, element, target.elementResistance);
  
  return {
    damage: Math.max(1, finalDamage) as Damage,
    element
  };
};

// スキルダメージの計算
export const calculateSkillDamage = (
  player: Player,
  baseDamage: number,
  scaling: number,
  element: ElementType,
  target?: Monster
): number => {
  const totalAttributes = calculateTotalAttributes(player);
  const stats = calculateTotalStats(player);
  
  // INTベースのスキルパワー計算
  const skillPower = stats.skillPower + (totalAttributes.intelligence * 0.5);
  
  // ダメージ計算
  let damage = baseDamage + (skillPower * scaling);
  
  // ターゲットがいる場合は属性耐性を適用
  if (target) {
    damage = calculateElementalDamage(damage, element, target.elementResistance);
  }
  
  return Math.max(1, Math.floor(damage));
};