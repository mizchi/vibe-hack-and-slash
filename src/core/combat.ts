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
import { 
  calculateTotalAttributes, 
  calculateTotalStats, 
  calculatePhysicalDamage, 
  calculateElementalDamage,
  calculateTotalElementModifiers,
  calculateBaseDamageFromStats
} from "./damage.ts";

// プレイヤー攻撃（属性システム対応）
export const playerAttack = (
  player: Player,
  monster: Monster,
  random: () => number = Math.random
): Result<{ events: BattleEvent[]; updatedMonster: Monster }, GameError> => {
  const events: BattleEvent[] = [];
  
  // 物理ダメージを計算（武器の属性修正込み）
  const { damage: baseDamage, element } = calculatePhysicalDamage(player);
  
  // クリティカル判定
  const playerStats = calculateTotalStats(player);
  const isCritical = random() < playerStats.criticalChance;
  const criticalMultiplier = isCritical ? playerStats.criticalDamage : 1;
  
  // クリティカルダメージ適用
  const criticalDamage = Math.floor(baseDamage * criticalMultiplier);
  
  // 属性修正を取得
  const elementModifiers = calculateTotalElementModifiers(player);
  const attackerModifier = elementModifiers[element];
  
  // 属性耐性によるダメージ計算
  const finalDamage = calculateElementalDamage(
    criticalDamage,
    element,
    monster.elementResistance,
    attackerModifier
  ) as Damage;
  
  // ダメージ適用
  const newHealth = Math.max(0, monster.currentHealth - finalDamage) as Health;
  const updatedMonster = { ...monster, currentHealth: newHealth };
  
  // イベント生成
  events.push({
    type: "PlayerAttack",
    damage: finalDamage,
    isCritical,
    targetId: monster.id,
    targetName: monster.name,
  });
  
  // ライフスティール
  if (playerStats.lifeSteal > 0 && finalDamage > 0) {
    const healAmount = Math.floor(finalDamage * playerStats.lifeSteal) as Health;
    if (healAmount > 0) {
      events.push({ type: "PlayerHeal", amount: healAmount });
    }
  }
  
  // モンスター撃破判定
  if (newHealth === 0) {
    const baseExp = monster.level * 10 + 20;
    const expGain = Math.floor(baseExp * (0.8 + random() * 0.4)) as Experience;
    events.push({
      type: "MonsterDefeated",
      monsterId: monster.id,
      monsterName: monster.name,
      experience: expGain,
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
  const events: BattleEvent[] = [];
  const playerStats = calculateTotalStats(player);
  
  // モンスターの基礎ダメージ
  const baseDamage = monster.stats.baseDamage;
  
  // クリティカル判定
  const isCritical = random() < monster.stats.criticalChance;
  const criticalMultiplier = isCritical ? monster.stats.criticalDamage : 1;
  const criticalDamage = Math.floor(baseDamage * criticalMultiplier);
  
  // モンスターは物理攻撃として扱う（将来的に属性を持たせることも可能）
  const element: ElementType = "Physical";
  
  // プレイヤーの属性耐性を計算（装備から）
  const playerResistance = { ...player.elementResistance };
  for (const [, item] of player.equipment) {
    if (item.baseItem.elementModifiers) {
      // 装備の属性修正値を耐性として扱う（1.0より大きい = 耐性、小さい = 弱点）
      for (const [elem, modifier] of Object.entries(item.baseItem.elementModifiers)) {
        const resistanceBonus = (1 - modifier) * 20; // 修正値0.8なら+20%耐性
        playerResistance[elem as ElementType] += resistanceBonus;
      }
    }
  }
  
  // 属性耐性によるダメージ計算
  const finalDamage = calculateElementalDamage(
    criticalDamage,
    element,
    playerResistance,
    1.0
  ) as Damage;
  
  // ダメージ適用
  const newHealth = Math.max(0, player.currentHealth - finalDamage) as Health;
  const updatedPlayer = { ...player, currentHealth: newHealth };
  
  // イベント生成
  events.push({
    type: "MonsterAttack",
    damage: finalDamage,
    attackerId: monster.id,
    attackerName: monster.name,
  });
  
  // プレイヤー敗北判定
  if (newHealth === 0) {
    events.push({ type: "PlayerDefeated" });
  }
  
  return Ok({ events, updatedPlayer });
};

// 経験値付与
export const applyExperience = (
  player: Player,
  experience: Experience
): { player: Player; leveledUp: boolean } => {
  const newExperience = (player.experience + experience) as Experience;
  const expForNextLevel = (player.level * 100) as Experience;
  
  if (newExperience >= expForNextLevel) {
    // レベルアップ
    const newLevel = (player.level + 1) as Level;
    const remainingExp = (newExperience - expForNextLevel) as Experience;
    
    // ステータス上昇（レベルアップ時に自動的に属性値が上がる）
    const leveledPlayer = {
      ...player,
      level: newLevel,
      experience: remainingExp,
      // HP/MP全回復
      currentHealth: calculateTotalStats(player).maxHealth,
      currentMana: calculateTotalStats(player).maxMana,
    };
    
    return { player: leveledPlayer, leveledUp: true };
  }
  
  return {
    player: { ...player, experience: newExperience },
    leveledUp: false,
  };
};