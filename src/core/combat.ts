import { Result, Ok, Err, GameError } from "./types.ts";
import type {
  Player,
  Monster,
  Damage,
  Health,
  Mana,
  Level,
  Experience,
  BattleEvent,
  CharacterStats,
  Item,
  ElementType,
} from "./types.ts";
import { calculateTotalAttributes, calculateAttackDamage } from "./damage.ts";

// ステータス計算（属性の影響を含む）
export const calculateTotalStats = (player: Player): CharacterStats => {
  const base = { ...player.baseStats };
  const totalAttributes = calculateTotalAttributes(player);
  
  // 属性によるステータス補正
  // VIT: HP +5/point, DEF +0.5/point
  base.maxHealth = (base.maxHealth + totalAttributes.vitality * 5) as Health;
  base.defense = base.defense + Math.floor(totalAttributes.vitality * 0.5);
  
  // INT: MP +3/point, ManaRegen +0.2/point
  base.maxMana = (base.maxMana + totalAttributes.intelligence * 3) as Mana;
  base.manaRegen = base.manaRegen + Math.floor(totalAttributes.intelligence * 0.2);
  
  // DEX: CritChance +0.5%/point, CritDmg +1%/point
  base.criticalChance = Math.min(0.75, base.criticalChance + totalAttributes.dexterity * 0.005);
  base.criticalDamage = base.criticalDamage + totalAttributes.dexterity * 0.01;
  
  // Map から装備アイテムを取得
  player.equipment.forEach((item) => {
    if (!item) return;
    
    const allModifiers = [
      ...item.baseItem.baseModifiers,
      ...(item.prefix?.modifiers || []),
      ...(item.suffix?.modifiers || []),
    ];
    
    allModifiers.forEach((mod) => {
      switch (mod.type) {
        case "IncreaseDamage":
          base.damage = (base.damage + mod.value) as Damage;
          break;
        case "IncreaseHealth":
          base.maxHealth = (base.maxHealth + mod.value) as Health;
          break;
        case "IncreaseDefense":
          base.defense += mod.value;
          break;
        case "LifeSteal":
          base.lifeSteal += mod.percentage;
          break;
        case "CriticalChance":
          base.criticalChance = Math.min(0.75, base.criticalChance + mod.percentage);
          break;
        case "CriticalDamage":
          base.criticalDamage += mod.multiplier;
          break;
        case "IncreaseMana":
          base.maxMana = (base.maxMana + mod.value) as Mana;
          break;
        case "ManaRegen":
          base.manaRegen += mod.value;
          break;
        case "SkillPower":
          base.skillPower += mod.percentage;
          break;
      }
    });
  });
  
  return base;
};

// ダメージ計算
export const calculateDamage = (
  attacker: CharacterStats,
  defender: CharacterStats,
  random: () => number = Math.random
): { damage: Damage; isCritical: boolean } => {
  const baseDamage = attacker.damage;
  const defense = defender.defense;
  
  // クリティカル判定
  const isCritical = random() < attacker.criticalChance;
  const critMultiplier = isCritical ? attacker.criticalDamage : 1;
  
  // ダメージ計算（防御力で軽減）
  const damage = Math.max(
    1,
    Math.floor((baseDamage * critMultiplier * (100 / (100 + defense))) * (0.9 + random() * 0.2))
  ) as Damage;
  
  return { damage, isCritical };
};

// プレイヤー攻撃
export const playerAttack = (
  player: Player,
  monster: Monster,
  random: () => number = Math.random
): Result<{ events: BattleEvent[]; updatedMonster: Monster }, GameError> => {
  const playerStats = calculateTotalStats(player);
  
  // クリティカル判定
  const isCritical = random() < playerStats.criticalChance;
  
  // 新しいダメージ計算システムを使用
  const { damage, element } = calculateAttackDamage(player, monster, isCritical);
  
  const newHealth = Math.max(0, monster.currentHealth - damage) as Health;
  const updatedMonster: Monster = {
    ...monster,
    currentHealth: newHealth,
  };
  
  const events: BattleEvent[] = [
    { type: "PlayerAttack", damage, isCritical }
  ];
  
  // ライフスティール
  if (playerStats.lifeSteal > 0) {
    const healAmount = Math.floor(damage * playerStats.lifeSteal) as Health;
    events.push({ type: "PlayerHeal", amount: healAmount });
  }
  
  // モンスター撃破
  if (newHealth === 0) {
    const experience = (monster.level * 10) as Experience;
    events.push({
      type: "MonsterDefeated",
      monsterId: monster.id,
      experience,
    });
  }
  
  return Ok({ events, updatedMonster });
};

// モンスター攻撃
export const monsterAttack = (
  monster: Monster,
  player: Player,
  random: () => number = Math.random
): Result<{ events: BattleEvent[]; updatedPlayer: Player }, GameError> => {
  const playerStats = calculateTotalStats(player);
  const { damage } = calculateDamage(monster.stats, playerStats, random);
  
  const newHealth = Math.max(0, player.currentHealth - damage) as Health;
  const updatedPlayer: Player = {
    ...player,
    currentHealth: newHealth,
  };
  
  const events: BattleEvent[] = [
    { type: "MonsterAttack", damage }
  ];
  
  if (newHealth === 0) {
    events.push({ type: "PlayerDefeated" });
  }
  
  return Ok({ events, updatedPlayer });
};

// 経験値とレベルアップ
export const applyExperience = (
  player: Player,
  experience: Experience
): { player: Player; leveledUp: boolean } => {
  const newExp = (player.experience + experience) as Experience;
  const expForNextLevel = (player.level * 100) as Experience;
  
  if (newExp >= expForNextLevel) {
    return {
      player: {
        ...player,
        level: (player.level + 1) as Level,
        experience: (newExp - expForNextLevel) as Experience,
        baseStats: {
          ...player.baseStats,
          maxHealth: (player.baseStats.maxHealth + 10) as Health,
          damage: (player.baseStats.damage + 2) as Damage,
          maxMana: (player.baseStats.maxMana + 5) as Mana,
          manaRegen: player.baseStats.manaRegen + 1,
        },
        currentHealth: (player.currentHealth + 10) as Health,
        currentMana: (player.currentMana + 5) as Mana,
      },
      leveledUp: true,
    };
  }
  
  return {
    player: { ...player, experience: newExp },
    leveledUp: false,
  };
};