import type {
  Skill,
  SkillEffect,
  SkillTriggerCondition,
  Player,
  Monster,
  BattleEvent,
  Damage,
  Health,
  Mana,
  CharacterStats,
} from "./types.ts";
import { calculateTotalStats } from "./combat.ts";

// スキル発動条件チェック
export const checkSkillTriggerConditions = (
  conditions: SkillTriggerCondition[],
  context: {
    player: Player;
    monster?: Monster;
    lastEvent?: BattleEvent;
    turn: number;
  }
): boolean => {
  return conditions.every(condition => {
    switch (condition.type) {
      case "Always":
        return true;
        
      case "HealthBelow":
        const playerStats = calculateTotalStats(context.player);
        const healthPercent = context.player.currentHealth / playerStats.maxHealth;
        return healthPercent < condition.percentage;
        
      case "ManaAbove":
        const manaPercent = context.player.currentMana / calculateTotalStats(context.player).maxMana;
        return manaPercent >= condition.percentage;
        
      case "EnemyHealthBelow":
        if (!context.monster) return false;
        const enemyHealthPercent = context.monster.currentHealth / context.monster.stats.maxHealth;
        return enemyHealthPercent < condition.percentage;
        
      case "CriticalHit":
        return context.lastEvent?.type === "PlayerAttack" && context.lastEvent.isCritical;
        
      case "OnKill":
        return context.lastEvent?.type === "MonsterDefeated";
        
      case "TurnInterval":
        return context.turn % condition.interval === 0;
        
      default:
        return false;
    }
  });
};

// 使用可能なスキルを取得
export const getAvailableSkills = (
  player: Player,
  monster: Monster | undefined,
  lastEvent: BattleEvent | undefined,
  turn: number
): Skill[] => {
  const playerStats = calculateTotalStats(player);
  
  return player.skills
    .filter(skill => {
      // マナチェック
      if (player.currentMana < skill.manaCost) return false;
      
      // クールダウンチェック
      const cooldown = player.skillCooldowns.get(skill.id) || 0;
      if (cooldown > 0) return false;
      
      // 発動条件チェック
      return checkSkillTriggerConditions(skill.triggerConditions, {
        player,
        monster,
        lastEvent,
        turn,
      });
    })
    .sort((a, b) => b.priority - a.priority); // 優先度順にソート
};

// スキル効果の適用
export const applySkillEffects = (
  skill: Skill,
  player: Player,
  monster: Monster | undefined,
  random: () => number = Math.random
): {
  events: BattleEvent[];
  updatedPlayer: Player;
  updatedMonster?: Monster;
} => {
  const events: BattleEvent[] = [];
  let currentPlayer = { ...player };
  let currentMonster = monster ? { ...monster } : undefined;
  
  const playerStats = calculateTotalStats(currentPlayer);
  
  // マナ消費
  currentPlayer.currentMana = Math.max(0, currentPlayer.currentMana - skill.manaCost) as Mana;
  events.push({
    type: "SkillUsed",
    skillId: skill.id,
    skillName: skill.name,
    manaCost: skill.manaCost,
  });
  
  // クールダウン設定
  currentPlayer.skillCooldowns = new Map(currentPlayer.skillCooldowns);
  currentPlayer.skillCooldowns.set(skill.id, skill.cooldown);
  
  // 効果適用
  skill.effects.forEach(effect => {
    switch (effect.type) {
      case "Damage":
        if (currentMonster && skill.targetType === "Enemy") {
          const damage = Math.floor(
            effect.baseDamage + (playerStats.skillPower * effect.scaling)
          ) as Damage;
          
          const actualDamage = Math.max(
            1,
            Math.floor(damage * (100 / (100 + currentMonster.stats.defense)))
          ) as Damage;
          
          currentMonster.currentHealth = Math.max(
            0,
            currentMonster.currentHealth - actualDamage
          ) as Health;
          
          events.push({
            type: "SkillDamage",
            skillName: skill.name,
            damage: actualDamage,
            targetId: currentMonster.id,
          });
        }
        break;
        
      case "Heal":
        if (skill.targetType === "Self") {
          const healAmount = Math.floor(
            effect.baseHeal + (playerStats.skillPower * effect.scaling)
          ) as Health;
          
          const actualHeal = Math.min(
            healAmount,
            playerStats.maxHealth - currentPlayer.currentHealth
          ) as Health;
          
          currentPlayer.currentHealth = (currentPlayer.currentHealth + actualHeal) as Health;
          
          events.push({
            type: "SkillHeal",
            skillName: skill.name,
            amount: actualHeal,
          });
        }
        break;
        
      case "LifeDrain":
        if (currentMonster && skill.targetType === "Enemy") {
          // 最後に与えたダメージからライフドレイン
          const lastDamageEvent = events
            .filter(e => e.type === "SkillDamage")
            .pop();
          
          if (lastDamageEvent && lastDamageEvent.type === "SkillDamage") {
            const drainAmount = Math.floor(
              lastDamageEvent.damage * effect.percentage
            ) as Health;
            
            const actualHeal = Math.min(
              drainAmount,
              playerStats.maxHealth - currentPlayer.currentHealth
            ) as Health;
            
            currentPlayer.currentHealth = (currentPlayer.currentHealth + actualHeal) as Health;
            
            events.push({
              type: "PlayerHeal",
              amount: actualHeal,
            });
          }
        }
        break;
        
      // TODO: Buff, Debuff, Stun, DamageOverTime の実装
    }
  });
  
  return {
    events,
    updatedPlayer: currentPlayer,
    updatedMonster: currentMonster,
  };
};

// マナ回復
export const regenerateMana = (
  player: Player
): { player: Player; manaRegenerated: Mana } => {
  const stats = calculateTotalStats(player);
  const regenAmount = Math.floor(stats.manaRegen) as Mana;
  const actualRegen = Math.min(
    regenAmount,
    stats.maxMana - player.currentMana
  ) as Mana;
  
  return {
    player: {
      ...player,
      currentMana: (player.currentMana + actualRegen) as Mana,
    },
    manaRegenerated: actualRegen,
  };
};

// クールダウンを減少
export const tickCooldowns = (player: Player): Player => {
  const newCooldowns = new Map<string, number>();
  
  player.skillCooldowns.forEach((cooldown, skillId) => {
    if (cooldown > 1) {
      newCooldowns.set(skillId, cooldown - 1);
    }
  });
  
  return {
    ...player,
    skillCooldowns: newCooldowns,
  };
};