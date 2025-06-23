import type {
  Skill,
  SkillId,
  SkillEffect,
  SkillTriggerCondition,
  Player,
  Monster,
  BattleEvent,
  Damage,
  Health,
  Mana,
  CharacterStats,
  ElementType,
  ResourceColor,
  ResourcePool,
} from "./types.ts";
import { calculateTotalStats, calculateSkillDamage } from "./damage.ts";

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
        // マナシステムは削除されたため、常にfalse
        return false;
        
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
      // パッシブスキルは使用対象から除外（効果は常に有効）
      if (skill.type === "Passive") return false;
      
      // スキルタイプによるチェック
      if (skill.type === "Active" || skill.type === "Basic") {
        // アクティブスキルと基礎スキルはリソースコストをチェック
        if (skill.resourceCost) {
          const canAfford = (Object.keys(skill.resourceCost) as ResourceColor[]).every(color => 
            player.resourcePool[color] >= skill.resourceCost![color]
          );
          if (!canAfford) return false;
        }
      }
      
      // クールダウンチェック
      const cooldown = player.skillCooldowns.get(skill.id) || 0;
      if (cooldown > 0) return false;
      
      // 自動発動タイマーチェック
      const timer = player.skillTimers.get(skill.id) || 0;
      if (timer > 0) return false;
      
      // 職業制限チェック
      if (skill.requiredClass && skill.requiredClass.length > 0) {
        if (!skill.requiredClass.includes(player.class)) return false;
      }
      
      // 武器タグチェック
      if (skill.requiredWeaponTags && skill.requiredWeaponTags.length > 0) {
        // MainHandの武器を取得
        const mainHandWeapon = player.equipment.get("MainHand");
        if (!mainHandWeapon) return false;
        
        // 武器のタグに必要なタグが含まれているかチェック
        const hasRequiredTag = skill.requiredWeaponTags.some(tag => 
          mainHandWeapon.baseItem.tags.includes(tag)
        );
        if (!hasRequiredTag) return false;
      }
      
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

// スキルタイマーを更新
export const updateSkillTimers = (player: Player): Player => {
  const newTimers = new Map(player.skillTimers);
  
  // 各スキルのタイマーを減少
  for (const [skillId, timer] of newTimers) {
    if (timer > 0) {
      newTimers.set(skillId, timer - 1);
    }
  }
  
  return {
    ...player,
    skillTimers: newTimers,
  };
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
  
  // リソース消費（基礎スキルとアクティブスキル）
  if ((skill.type === "Basic" || skill.type === "Active") && skill.resourceCost) {
    const newResourcePool = { ...currentPlayer.resourcePool };
    (Object.keys(skill.resourceCost) as ResourceColor[]).forEach(color => {
      newResourcePool[color] = (newResourcePool[color] - skill.resourceCost![color]) as any;
    });
    currentPlayer.resourcePool = newResourcePool;
  }
  
  // リソース生成（基礎スキルの場合）
  if (skill.type === "Basic" && skill.resourceGeneration) {
    const newResourcePool = { ...currentPlayer.resourcePool };
    skill.resourceGeneration.forEach(gen => {
      if (random() < gen.chance) {
        newResourcePool[gen.color] = (newResourcePool[gen.color] + gen.amount) as any;
      }
    });
    currentPlayer.resourcePool = newResourcePool;
  }
  
  events.push({
    type: "SkillUsed",
    skillId: skill.id,
    skillName: skill.name,
    manaCost: 0 as Mana, // MPシステム削除
  });
  
  // クールダウン設定
  currentPlayer.skillCooldowns = new Map(currentPlayer.skillCooldowns);
  currentPlayer.skillCooldowns.set(skill.id, skill.cooldown);
  
  // 自動発動タイマー設定（スキルごとの固定間隔）
  currentPlayer.skillTimers = new Map(currentPlayer.skillTimers);
  const autoInterval = Math.max(2, skill.cooldown + 1); // クールダウン+1ターン
  currentPlayer.skillTimers.set(skill.id, autoInterval);
  
  // 効果適用
  skill.effects.forEach(effect => {
    switch (effect.type) {
      case "Damage":
        if (currentMonster && skill.targetType === "Enemy") {
          // 新しいダメージ計算システムを使用
          // elementが未定義の場合はデフォルトでPhysicalを使用
          const element = effect.element || "Physical";
          const damage = calculateSkillDamage(
            currentPlayer,
            effect.baseDamage,
            effect.scaling,
            element
          );
          
          const actualDamage = Math.max(1, damage) as Damage;
          
          currentMonster.currentHealth = Math.max(
            0,
            currentMonster.currentHealth - actualDamage
          ) as Health;
          
          events.push({
            type: "SkillDamage",
            skillName: skill.name,
            damage: actualDamage,
            targetId: currentMonster.id,
            targetName: currentMonster.name,
          });
        }
        break;
        
      case "Heal":
        if (skill.targetType === "Self") {
          // ヒール量の計算と検証
          const baseHeal = effect.baseHeal || 0;
          const scaling = effect.scaling || 0;
          const skillPower = playerStats.skillPower || 0;
          
          if (!Number.isFinite(baseHeal)) {
            throw new Error(`Invalid baseHeal: ${baseHeal}`);
          }
          if (!Number.isFinite(scaling)) {
            throw new Error(`Invalid heal scaling: ${scaling}`);
          }
          if (!Number.isFinite(skillPower)) {
            throw new Error(`Invalid skillPower: ${skillPower}`);
          }
          
          const healAmount = Math.floor(
            baseHeal + (skillPower * scaling)
          ) as Health;
          
          if (!Number.isFinite(healAmount)) {
            throw new Error(`Invalid healAmount: ${healAmount}`);
          }
          
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

// クールダウンを減少
export const tickCooldowns = (player: Player): Player => {
  const newCooldowns = new Map<SkillId, number>();
  
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