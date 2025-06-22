import { Result, Ok, Err, GameError } from "./types.ts";
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
  Damage,
  Experience,
} from "./types.ts";
import { playerAttack, monsterAttack, applyExperience } from "./combat.ts";
import { rollLoot } from "./loot.ts";

// 初期プレイヤー作成
export const createInitialPlayer = (id: PlayerId): Player => ({
  id,
  level: 1 as Level,
  experience: 0 as Experience,
  currentHealth: 100 as Health,
  baseStats: {
    maxHealth: 100 as Health,
    damage: 10 as Damage,
    defense: 0,
    criticalChance: 0.1,
    criticalDamage: 1.5,
    lifeSteal: 0,
  },
  equipment: {},
});

// セッション作成
export const createSession = (
  sessionId: SessionId,
  player: Player
): Session => ({
  id: sessionId,
  player,
  defeatedCount: 0,
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
  
  return {
    id: `${template.id}_${Date.now()}` as MonsterId,
    name: template.name,
    level: monsterLevel,
    currentHealth: (template.baseStats.health + monsterLevel * 10) as Health,
    stats: {
      maxHealth: (template.baseStats.health + monsterLevel * 10) as Health,
      damage: (template.baseStats.damage + monsterLevel * 2) as Damage,
      defense: template.baseStats.defense + Math.floor(monsterLevel / 2),
      criticalChance: template.baseStats.criticalChance,
      criticalDamage: template.baseStats.criticalDamage,
      lifeSteal: template.baseStats.lifeSteal,
    },
    lootTable: template.lootTable,
  };
};

// バトルターン処理
export type TurnResult = {
  events: BattleEvent[];
  updatedSession: Session;
  droppedItems?: Item[];
};

export const processBattleTurn = (
  session: Session,
  baseItems: Map<ItemId, BaseItem>,
  monsterTemplates: any[],
  random: () => number = Math.random
): Result<TurnResult, GameError> => {
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
  
  // プレイヤー攻撃
  const playerAttackResult = playerAttack(currentPlayer, currentMonster, random);
  if (!playerAttackResult.ok) return playerAttackResult;
  
  events.push(...playerAttackResult.value.events);
  currentMonster = playerAttackResult.value.updatedMonster;
  
  // ライフスティールによる回復
  const healEvent = events.find(e => e.type === "PlayerHeal");
  if (healEvent && healEvent.type === "PlayerHeal") {
    const totalStats = currentPlayer.baseStats;
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
    droppedItems = rollLoot(currentMonster.lootTable, baseItems, currentMonster.level, random);
    droppedItems.forEach(item => {
      events.push({ type: "ItemDropped", item });
    });
    
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
      const { item } = action;
      const slot = item.baseItem.type.toLowerCase() as keyof Player["equipment"];
      return Ok({
        ...session,
        player: {
          ...session.player,
          equipment: {
            ...session.player.equipment,
            [slot]: item,
          },
        },
      });
      
    case "UnequipItem":
      return Ok({
        ...session,
        player: {
          ...session.player,
          equipment: {
            ...session.player.equipment,
            [action.slot]: undefined,
          },
        },
      });
      
    default:
      return Err({ type: "InvalidAction", message: "Unknown action type" });
  }
};