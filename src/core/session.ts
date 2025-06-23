import { Result, Ok, Err, GameError } from "./types.ts";
import skillsData from "../../data/skills.json" assert { type: "json" };
import type {
  Session,
  SessionId,
  SessionState,
  Player,
  Monster,
  GameAction,
  BattleEvent,
  Item,
  BaseItem,
  ItemId,
  MonsterId,
  PlayerId,
  Level,
  Health,
  Mana,
  Damage,
  Experience,
  Skill,
  PlayerClass,
  EquipmentSlot,
  Gold,
  Strength,
  Intelligence,
  Dexterity,
  Vitality,
  ElementResistance,
} from "./types.ts";
import { playerAttack, monsterAttack, applyExperience } from "./combat.ts";
import { rollLoot } from "./loot.ts";
import { getAvailableSkills, applySkillEffects, regenerateMana, tickCooldowns, updateSkillTimers } from "./skills.ts";
import { TIER_MODIFIERS } from "./loot-modifiers.ts";
import { calculateTotalStats } from "./damage.ts";

// クラス別の初期ステータス
const CLASS_BASE_STATS = {
  Warrior: {
    maxHealth: 120 as Health,
    baseDamage: 15 as Damage,
    criticalChance: 0.1,
    criticalDamage: 1.5,
    lifeSteal: 0,
    maxMana: 30 as Mana,
    manaRegen: 5,
    skillPower: 5,
  },
  Mage: {
    maxHealth: 80 as Health,
    baseDamage: 8 as Damage,
    criticalChance: 0.15,
    criticalDamage: 2.0,
    lifeSteal: 0,
    maxMana: 100 as Mana,
    manaRegen: 15,
    skillPower: 20,
  },
  Rogue: {
    maxHealth: 90 as Health,
    baseDamage: 12 as Damage,
    criticalChance: 0.25,
    criticalDamage: 2.5,
    lifeSteal: 0.05,
    maxMana: 50 as Mana,
    manaRegen: 8,
    skillPower: 10,
  },
  Paladin: {
    maxHealth: 110 as Health,
    baseDamage: 12 as Damage,
    criticalChance: 0.1,
    criticalDamage: 1.5,
    lifeSteal: 0.02,
    maxMana: 60 as Mana,
    manaRegen: 10,
    skillPower: 15,
  },
};

// クラス別の初期属性
const CLASS_BASE_ATTRIBUTES = {
  Warrior: {
    strength: 20 as Strength,
    intelligence: 5 as Intelligence,
    dexterity: 10 as Dexterity,
    vitality: 15 as Vitality,
  },
  Mage: {
    strength: 5 as Strength,
    intelligence: 20 as Intelligence,
    dexterity: 10 as Dexterity,
    vitality: 8 as Vitality,
  },
  Rogue: {
    strength: 10 as Strength,
    intelligence: 10 as Intelligence,
    dexterity: 20 as Dexterity,
    vitality: 10 as Vitality,
  },
  Paladin: {
    strength: 15 as Strength,
    intelligence: 10 as Intelligence,
    dexterity: 8 as Dexterity,
    vitality: 12 as Vitality,
  },
};

// 初期属性耐性
const INITIAL_ELEMENT_RESISTANCE: ElementResistance = {
  Physical: 0,
  Arcane: 0,
  Fire: 0,
  Lightning: 0,
  Holy: 0,
};

// 初期プレイヤー作成
export const createInitialPlayer = (id: PlayerId, playerClass: PlayerClass = "Warrior", skills: Skill[] = []): Player => {
  const baseStats = CLASS_BASE_STATS[playerClass];
  const baseAttributes = CLASS_BASE_ATTRIBUTES[playerClass];
  
  return {
    id,
    name: playerClass, // プレイヤー名はクラス名で初期化
    class: playerClass,
    level: 1 as Level,
    experience: 0 as Experience,
    currentHealth: baseStats.maxHealth,
    currentMana: baseStats.maxMana,
    baseStats,
    baseAttributes,
    equipment: new Map(),
    inventory: [], // 空のインベントリ
    skills, // 全スキルを付与
    skillCooldowns: new Map(),
    skillTimers: new Map(), // スキルタイマー
    activeBuffs: [], // 空のバフリスト
    elementResistance: { ...INITIAL_ELEMENT_RESISTANCE },
    gold: 100 as Gold, // 初期ゴールド
  };
};

// セッション作成
export const createSession = (
  sessionId: SessionId,
  player: Player
): Session => ({
  id: sessionId,
  player,
  currentMonster: undefined,
  defeatedCount: 0,
  wave: 1, // Wave 1から開始
  state: "InProgress",
  startedAt: new Date(),
});

// モンスター生成
export const spawnMonster = (
  monsterTemplates: any[],
  playerLevel: Level,
  random: () => number = Math.random
): Monster => {
  // プレイヤーレベルに応じたモンスターを選択
  const suitable = monsterTemplates.filter(
    (t) => playerLevel >= t.levelRange.min && playerLevel <= t.levelRange.max + 2
  );
  
  const template = suitable.length > 0 
    ? suitable[Math.floor(random() * suitable.length)]
    : monsterTemplates[0];
  
  // レベル調整
  const levelDiff = Math.floor(random() * 3) - 1;
  const monsterLevel = Math.max(1, playerLevel + levelDiff) as Level;
  
  // デフォルトの属性耐性（テンプレートに定義がない場合）
  const defaultResistance: ElementResistance = {
    Physical: 0,
    Arcane: 0,
    Fire: 0,
    Lightning: 0,
    Holy: 0,
  };
  
  // 安全なヘルス計算
  const baseHealth = template.baseStats?.health || 30;
  const maxHealth = (baseHealth + monsterLevel * 10) as Health;
  
  
  return {
    id: `${template.id}_${Date.now()}` as MonsterId,
    name: template.name,
    tier: template.tier || "Common",
    level: monsterLevel,
    currentHealth: maxHealth,
    stats: {
      maxHealth: maxHealth,
      baseDamage: ((template.baseStats?.baseDamage || template.baseStats?.damage || 5) + monsterLevel * 2) as Damage,
      criticalChance: template.baseStats?.criticalChance || 0.05,
      criticalDamage: template.baseStats?.criticalDamage || 1.5,
      lifeSteal: template.baseStats?.lifeSteal || 0,
      maxMana: 0 as Mana,
      manaRegen: 0,
      skillPower: 0,
    },
    elementResistance: template.elementResistance || defaultResistance,
    lootTable: template.lootTable || [],
  };
};

// バトルターン処理
export type TurnResult = {
  events: BattleEvent[];
  updatedSession: Session;
  droppedItems?: Item[];
};

export const processBattleTurn = async (
  session: Session,
  baseItems: Map<ItemId, BaseItem>,
  monsterTemplates: any[],
  skills: Skill[] = [],
  turn: number = 0,
  random: () => number = Math.random
): Promise<Result<TurnResult, GameError>> => {
  if (session.state !== "InProgress") {
    return Err({ type: "InvalidAction", message: "Session is not in progress" });
  }
  
  const events: BattleEvent[] = [];
  let currentPlayer = session.player;
  let currentMonster = session.currentMonster;
  
  // モンスターがいなければスポーン
  if (!currentMonster) {
    currentMonster = spawnMonster(monsterTemplates, currentPlayer.level, random);
  }
  
  // マナ回復
  const { player: playerWithMana, manaRegenerated } = regenerateMana(currentPlayer);
  currentPlayer = playerWithMana;
  if (manaRegenerated > 0) {
    events.push({ type: "ManaRegenerated", amount: manaRegenerated });
  }
  
  // クールダウン減少
  currentPlayer = tickCooldowns(currentPlayer);
  
  // スキルタイマー更新
  currentPlayer = updateSkillTimers(currentPlayer);
  
  // 利用可能なスキルをチェック
  const lastEvent = events[events.length - 1];
  const availableSkills = getAvailableSkills(currentPlayer, currentMonster, lastEvent, turn);
  
  // 最優先スキルを使用
  if (availableSkills.length > 0 && currentMonster.currentHealth > 0) {
    const skillResult = applySkillEffects(availableSkills[0], currentPlayer, currentMonster, random);
    events.push(...skillResult.events);
    currentPlayer = skillResult.updatedPlayer;
    if (skillResult.updatedMonster) {
      currentMonster = skillResult.updatedMonster;
    }
  } else if (currentMonster.currentHealth > 0) {
    // 通常攻撃（スキルを使わなかった場合）
    const playerAttackResult = playerAttack(currentPlayer, currentMonster, random);
    if (!playerAttackResult.ok) return playerAttackResult;
    
    events.push(...playerAttackResult.value.events);
    currentMonster = playerAttackResult.value.updatedMonster;
  }
  
  // ライフスティールによる回復
  const healEvent = events.find(e => e.type === "PlayerHeal");
  if (healEvent && healEvent.type === "PlayerHeal") {
    const totalStats = calculateTotalStats(currentPlayer);
    currentPlayer = {
      ...currentPlayer,
      currentHealth: Math.min(
        totalStats.maxHealth,
        currentPlayer.currentHealth + healEvent.amount
      ) as Health,
    };
  }
  
  let droppedItems: Item[] | undefined;
  
  // モンスター撃破処理
  if (currentMonster.currentHealth === 0) {
    // 経験値付与
    const defeatEvent = events.find(e => e.type === "MonsterDefeated");
    if (defeatEvent && defeatEvent.type === "MonsterDefeated") {
      const { player: updatedPlayer, leveledUp } = applyExperience(
        currentPlayer,
        defeatEvent.experience
      );
      currentPlayer = updatedPlayer;
      
      if (leveledUp) {
        events.push({ type: "PlayerLevelUp", newLevel: currentPlayer.level });
      }
    }
    
    // アイテムドロップ
    droppedItems = await rollLoot(currentMonster.lootTable, baseItems, currentMonster.level, random, currentMonster.tier);
    droppedItems.forEach(item => {
      events.push({ type: "ItemDropped", item });
    });
    
    // ゴールドドロップ
    const baseGold = Math.floor((currentMonster.level * 10 + 20) * (0.8 + random() * 0.4));
    const goldMultiplier = TIER_MODIFIERS[currentMonster.tier].goldMultiplier;
    const goldDrop = Math.floor(baseGold * goldMultiplier) as Gold;
    
    if (goldDrop > 0) {
      events.push({ type: "GoldDropped", amount: goldDrop });
      currentPlayer = {
        ...currentPlayer,
        gold: (currentPlayer.gold + goldDrop) as Gold,
      };
    }
    
    // 次のモンスターをスポーン
    currentMonster = spawnMonster(monsterTemplates, currentPlayer.level, random);
  } else {
    // モンスター反撃
    const monsterAttackResult = monsterAttack(currentMonster, currentPlayer, random);
    if (!monsterAttackResult.ok) return monsterAttackResult;
    
    events.push(...monsterAttackResult.value.events);
    currentPlayer = monsterAttackResult.value.updatedPlayer;
  }
  
  // セッション更新
  const updatedSession: Session = {
    ...session,
    player: currentPlayer,
    currentMonster,
    defeatedCount: currentMonster.currentHealth === 0 
      ? session.defeatedCount + 1 
      : session.defeatedCount,
    state: currentPlayer.currentHealth === 0 ? "Completed" : session.state,
  };
  
  return Ok({ events, updatedSession, droppedItems });
};

// アクション処理
export const processAction = (
  session: Session,
  action: GameAction
): Result<Session, GameError> => {
  switch (action.type) {
    case "PauseSession":
      if (session.state !== "InProgress") {
        return Err({ type: "InvalidAction", message: "Session is not in progress" });
      }
      return Ok({ ...session, state: "Paused" });
      
    case "ResumeSession":
      if (session.state !== "Paused") {
        return Err({ type: "InvalidAction", message: "Session is not paused" });
      }
      return Ok({ ...session, state: "InProgress" });
      
    case "EquipItem":
      const { item, slot } = action;
      const newEquipment = new Map(session.player.equipment);
      newEquipment.set(slot, item);
      
      // 武器スキルの自動設定
      let newSkills = [...session.player.skills];
      
      // MainHandに武器を装備した場合
      if (slot === "MainHand" && item.baseItem.tags) {
        // 既存の武器スキルを削除（クラス専用スキルは保持）
        newSkills = newSkills.filter(skill => 
          !skill.requiredWeaponTags || 
          skill.requiredWeaponTags.length === 0 ||
          (skill.requiredClass && skill.requiredClass.includes(session.player.class))
        );
        
        // 新しい武器に対応するスキルを追加
        const weaponSkills = (skillsData.skills as Skill[]).filter(skill => {
          // 武器タグ要求があるスキル
          if (skill.requiredWeaponTags && skill.requiredWeaponTags.length > 0) {
            // 武器のタグがスキルの要求タグを満たすか
            const hasRequiredTag = skill.requiredWeaponTags.some(tag => 
              item.baseItem.tags.includes(tag)
            );
            if (!hasRequiredTag) return false;
            
            // クラス制限がある場合、プレイヤーのクラスが一致するか
            if (skill.requiredClass && skill.requiredClass.length > 0) {
              return skill.requiredClass.includes(session.player.class);
            }
            
            return true;
          }
          return false;
        });
        
        // 新しい武器スキルを追加（重複を避ける）
        weaponSkills.forEach(weaponSkill => {
          if (!newSkills.some(s => s.id === weaponSkill.id)) {
            newSkills.push(weaponSkill);
          }
        });
      }
      
      return Ok({
        ...session,
        player: {
          ...session.player,
          equipment: newEquipment,
          skills: newSkills,
        },
      });
      
    case "UnequipItem":
      const updatedEquipment = new Map(session.player.equipment);
      const removedItem = updatedEquipment.get(action.slot);
      updatedEquipment.delete(action.slot);
      
      // 武器スキルの削除
      let updatedSkills = [...session.player.skills];
      
      // MainHandから武器を外した場合
      if (action.slot === "MainHand" && removedItem) {
        // 武器要求スキルを削除（クラス専用スキルは保持）
        updatedSkills = updatedSkills.filter(skill => 
          !skill.requiredWeaponTags || 
          skill.requiredWeaponTags.length === 0 ||
          (skill.requiredClass && skill.requiredClass.includes(session.player.class))
        );
      }
      
      return Ok({
        ...session,
        player: {
          ...session.player,
          equipment: updatedEquipment,
          skills: updatedSkills,
        },
      });
      
    default:
      return Err({ type: "InvalidAction", message: "Unknown action type" });
  }
};