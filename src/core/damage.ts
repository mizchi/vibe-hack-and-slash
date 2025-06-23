import type { 
  Player, 
  Monster, 
  Damage, 
  ElementType, 
  ElementResistance,
  ElementModifier,
  BaseStats,
  WeaponScaling,
  Item,
  CharacterStats,
  Strength,
  Intelligence,
  Dexterity,
  Vitality,
  Health,
  Mana
} from "./types.ts";

// デフォルトの属性修正値
const DEFAULT_ELEMENT_MODIFIER: ElementModifier = {
  Physical: 1.0,
  Arcane: 1.0,
  Fire: 1.0,
  Lightning: 1.0,
  Holy: 1.0,
};

// プレイヤーの総合属性修正値を計算
export const calculateTotalElementModifiers = (player: Player): ElementModifier => {
  const result = { ...DEFAULT_ELEMENT_MODIFIER };
  
  // 装備品からの属性修正を集計
  for (const [, item] of player.equipment) {
    if (item.baseItem.elementModifiers) {
      for (const [element, modifier] of Object.entries(item.baseItem.elementModifiers)) {
        if (!Number.isFinite(modifier)) {
          throw new Error(`Invalid element modifier for ${element}: ${modifier}`);
        }
        result[element as ElementType] *= modifier;
      }
    }
  }
  
  // 結果の検証
  for (const [element, value] of Object.entries(result)) {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid total element modifier for ${element}: ${value}`);
    }
  }
  
  return result;
};

// 属性耐性によるダメージ計算
export const calculateElementalDamage = (
  baseDamage: number,
  element: ElementType,
  targetResistance: ElementResistance,
  attackerModifier: number = 1.0
): number => {
  // 引数の検証
  if (!Number.isFinite(baseDamage)) {
    throw new Error(`Invalid baseDamage: ${baseDamage}`);
  }
  if (!Number.isFinite(attackerModifier)) {
    throw new Error(`Invalid attackerModifier: ${attackerModifier}`);
  }
  
  // 攻撃側の属性修正を適用
  const modifiedDamage = baseDamage * attackerModifier;
  
  // 防御側の属性耐性を適用
  const resistance = targetResistance[element] || 0;
  if (!Number.isFinite(resistance)) {
    throw new Error(`Invalid resistance for ${element}: ${resistance}`);
  }
  
  const resistanceMultiplier = 1 - (resistance / 100);
  const finalDamage = Math.max(1, Math.floor(modifiedDamage * resistanceMultiplier));
  
  if (!Number.isFinite(finalDamage)) {
    throw new Error(`Invalid finalDamage in calculateElementalDamage: ${finalDamage}`);
  }
  
  return finalDamage;
};

// ステータスからベースダメージを計算
export const calculateBaseDamageFromStats = (
  stats: CharacterStats,
  attributes: BaseStats,
  weaponScaling?: WeaponScaling
): number => {
  let baseDamage = stats.baseDamage;
  
  if (weaponScaling) {
    // 武器のスケーリングに基づいてステータスからダメージを計算
    if (weaponScaling.strength) {
      baseDamage = (baseDamage + Math.floor(attributes.strength * weaponScaling.strength)) as Damage;
    }
    if (weaponScaling.intelligence) {
      baseDamage = (baseDamage + Math.floor(attributes.intelligence * weaponScaling.intelligence)) as Damage;
    }
    if (weaponScaling.dexterity) {
      baseDamage = (baseDamage + Math.floor(attributes.dexterity * weaponScaling.dexterity)) as Damage;
    }
  } else {
    // デフォルトはSTRの50%
    baseDamage = (baseDamage + Math.floor(attributes.strength * 0.5)) as Damage;
  }
  
  return baseDamage;
};

// プレイヤーの総合属性値を計算
export const calculateTotalAttributes = (player: Player): BaseStats => {
  // baseAttributesが未定義の場合のデフォルト値
  const baseAttributes = player.baseAttributes ? { ...player.baseAttributes } : {
    strength: 10 as Strength,
    intelligence: 10 as Intelligence,
    dexterity: 10 as Dexterity,
    vitality: 10 as Vitality,
  };
  
  // 装備からの属性ボーナスを計算
  for (const [, item] of player.equipment) {
    const allModifiers = [
      ...item.baseItem.baseModifiers,
      ...(item.prefix?.modifiers || []),
      ...(item.suffix?.modifiers || []),
    ];
    
    for (const mod of allModifiers) {
      switch (mod.type) {
        case "IncreaseStrength":
          baseAttributes.strength = (baseAttributes.strength + mod.value) as Strength;
          break;
        case "IncreaseIntelligence":
          baseAttributes.intelligence = (baseAttributes.intelligence + mod.value) as Intelligence;
          break;
        case "IncreaseDexterity":
          baseAttributes.dexterity = (baseAttributes.dexterity + mod.value) as Dexterity;
          break;
        case "IncreaseVitality":
          baseAttributes.vitality = (baseAttributes.vitality + mod.value) as Vitality;
          break;
      }
    }
  }
  
  // レベルアップボーナス（レベル毎に全属性+2）
  const levelBonus = (player.level - 1) * 2;
  baseAttributes.strength = (baseAttributes.strength + levelBonus) as Strength;
  baseAttributes.intelligence = (baseAttributes.intelligence + levelBonus) as Intelligence;
  baseAttributes.dexterity = (baseAttributes.dexterity + levelBonus) as Dexterity;
  baseAttributes.vitality = (baseAttributes.vitality + levelBonus) as Vitality;
  
  return baseAttributes;
};

// 武器による物理ダメージ計算
export const calculatePhysicalDamage = (
  player: Player,
  element: ElementType = "Physical"
): { damage: number; element: ElementType } => {
  const attributes = calculateTotalAttributes(player);
  const mainWeapon = player.equipment.get("MainHand");
  const weaponScaling = mainWeapon?.baseItem.weaponScaling;
  
  // ベースダメージを計算
  const baseDamage = calculateBaseDamageFromStats(
    player.baseStats,
    attributes,
    weaponScaling
  );
  
  // 属性修正を取得
  const elementModifiers = calculateTotalElementModifiers(player);
  const elementModifier = elementModifiers[element];
  
  return {
    damage: Math.floor(baseDamage * elementModifier),
    element
  };
};

// スキルダメージの計算
export const calculateSkillDamage = (
  player: Player,
  baseDamage: number,
  scaling: number,
  element: ElementType
): number => {
  // 引数の検証
  if (!Number.isFinite(baseDamage)) {
    throw new Error(`Invalid baseDamage: ${baseDamage}`);
  }
  if (!Number.isFinite(scaling)) {
    throw new Error(`Invalid scaling: ${scaling}`);
  }
  if (!element) {
    throw new Error(`Invalid element: ${element}`);
  }
  
  const attributes = calculateTotalAttributes(player);
  const mainWeapon = player.equipment.get("MainHand");
  
  // 基礎ダメージ
  let damage = baseDamage;
  
  // スキルパワーによる増幅
  const stats = calculateTotalStats(player);
  const skillPowerMultiplier = 1 + (stats.skillPower / 100);
  
  // NaNチェック
  if (!Number.isFinite(skillPowerMultiplier)) {
    throw new Error(`Invalid skillPowerMultiplier: ${skillPowerMultiplier}, skillPower: ${stats.skillPower}`);
  }
  
  damage *= skillPowerMultiplier;
  
  // ステータススケーリング
  if (mainWeapon && mainWeapon.baseItem.weaponScaling) {
    const weaponScaling = mainWeapon.baseItem.weaponScaling;
    let scalingDamage = 0;
    
    if (weaponScaling.strength) {
      scalingDamage += attributes.strength * weaponScaling.strength;
    }
    if (weaponScaling.intelligence) {
      scalingDamage += attributes.intelligence * weaponScaling.intelligence;
    }
    if (weaponScaling.dexterity) {
      scalingDamage += attributes.dexterity * weaponScaling.dexterity;
    }
    
    damage += scalingDamage * scaling;
  } else {
    // デフォルトはINTスケーリング
    damage += attributes.intelligence * scaling;
  }
  
  // 属性修正を適用
  const elementModifiers = calculateTotalElementModifiers(player);
  const elementModifier = elementModifiers[element];
  
  // 最終的なダメージ計算前のチェック
  if (!Number.isFinite(damage)) {
    throw new Error(`Invalid damage before element modifier: ${damage}`);
  }
  if (!Number.isFinite(elementModifier)) {
    throw new Error(`Invalid elementModifier for ${element}: ${elementModifier}`);
  }
  
  const finalDamage = Math.floor(damage * elementModifier);
  
  // 最終結果の検証
  if (!Number.isFinite(finalDamage)) {
    throw new Error(`Invalid finalDamage: ${finalDamage}, damage: ${damage}, elementModifier: ${elementModifier}`);
  }
  
  return finalDamage;
};

// 総合ステータスを計算（互換性のため）
export const calculateTotalStats = (player: Player): CharacterStats => {
  // baseStatsが未定義の場合のデフォルト値
  const stats = player.baseStats ? { ...player.baseStats } : {
    maxHealth: 100 as Health,
    baseDamage: 10 as Damage,
    criticalChance: 0.1,
    criticalDamage: 1.5,
    lifeSteal: 0,
    maxMana: 50 as Mana,
    manaRegen: 5,
    skillPower: 0,
  };
  
  const attributes = calculateTotalAttributes(player);
  
  // VITによるHP増加
  const healthBonus = attributes.vitality * 5;
  stats.maxHealth = (isNaN(stats.maxHealth) ? 100 : stats.maxHealth + healthBonus) as Health;
  
  // INTによるMP増加
  const manaBonus = attributes.intelligence * 3;
  stats.maxMana = (isNaN(stats.maxMana) ? 50 : stats.maxMana + manaBonus) as Mana;
  
  // DEXによるクリティカル率増加
  stats.criticalChance = stats.criticalChance + attributes.dexterity * 0.005;
  
  // 装備からのステータスボーナス
  for (const [, item] of player.equipment) {
    const allModifiers = [
      ...item.baseItem.baseModifiers,
      ...(item.prefix?.modifiers || []),
      ...(item.suffix?.modifiers || []),
    ];
    
    for (const mod of allModifiers) {
      switch (mod.type) {
        case "IncreaseHealth":
          stats.maxHealth = (stats.maxHealth + mod.value) as Health;
          break;
        case "IncreaseMana":
          stats.maxMana = (stats.maxMana + mod.value) as Mana;
          break;
        case "CriticalChance":
          stats.criticalChance += mod.percentage;
          break;
        case "CriticalDamage":
          stats.criticalDamage += mod.multiplier;
          break;
        case "LifeSteal":
          stats.lifeSteal += mod.percentage;
          break;
        case "ManaRegen":
          stats.manaRegen += mod.value;
          break;
        case "SkillPower":
          stats.skillPower += mod.percentage;
          break;
      }
    }
  }
  
  return stats;
};