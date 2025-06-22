// ブランド型の定義
export type Brand<K, T> = K & { __brand: T };

// ID型
export type PlayerId = Brand<string, "PlayerId">;
export type ItemId = Brand<string, "ItemId">;
export type MonsterId = Brand<string, "MonsterId">;
export type SessionId = Brand<string, "SessionId">;

// Result型
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ゲームエラー
export type GameError =
  | { type: "InvalidAction"; message: string }
  | { type: "ItemNotFound"; itemId: ItemId }
  | { type: "MonsterNotFound"; monsterId: MonsterId }
  | { type: "SessionNotFound"; sessionId: SessionId };

// 基本的な値型
export type Damage = Brand<number, "Damage">;
export type Health = Brand<number, "Health">;
export type Level = Brand<number, "Level">;
export type Experience = Brand<number, "Experience">;

// アイテムシステム
export type ItemRarity = "Common" | "Magic" | "Rare" | "Legendary";

export type ItemPrefix = {
  name: string;
  modifiers: ItemModifier[];
};

export type ItemSuffix = {
  name: string;
  modifiers: ItemModifier[];
};

export type ItemModifier =
  | { type: "IncreaseDamage"; value: number }
  | { type: "IncreaseHealth"; value: number }
  | { type: "IncreaseDefense"; value: number }
  | { type: "LifeSteal"; percentage: number }
  | { type: "CriticalChance"; percentage: number }
  | { type: "CriticalDamage"; multiplier: number };

export type ItemType = "Weapon" | "Armor" | "Accessory";

export type BaseItem = {
  id: ItemId;
  name: string;
  type: ItemType;
  baseModifiers: ItemModifier[];
};

export type Item = {
  id: ItemId;
  baseItem: BaseItem;
  rarity: ItemRarity;
  prefix?: ItemPrefix;
  suffix?: ItemSuffix;
  level: Level;
};

// キャラクター
export type CharacterStats = {
  maxHealth: Health;
  damage: Damage;
  defense: number;
  criticalChance: number;
  criticalDamage: number;
  lifeSteal: number;
};

export type Player = {
  id: PlayerId;
  level: Level;
  experience: Experience;
  currentHealth: Health;
  baseStats: CharacterStats;
  equipment: {
    weapon?: Item;
    armor?: Item;
    accessory?: Item;
  };
};

// モンスター
export type Monster = {
  id: MonsterId;
  name: string;
  level: Level;
  currentHealth: Health;
  stats: CharacterStats;
  lootTable: LootEntry[];
};

export type LootEntry = {
  baseItemId: ItemId;
  dropChance: number; // 0-1
  rarityWeights: {
    common: number;
    magic: number;
    rare: number;
    legendary: number;
  };
};

// セッション
export type SessionState = "InProgress" | "Paused" | "Completed";

export type Session = {
  id: SessionId;
  player: Player;
  currentMonster?: Monster;
  defeatedCount: number;
  state: SessionState;
  startedAt: Date;
};

// バトルイベント
export type BattleEvent =
  | { type: "PlayerAttack"; damage: Damage; isCritical: boolean }
  | { type: "MonsterAttack"; damage: Damage }
  | { type: "PlayerHeal"; amount: Health }
  | { type: "MonsterDefeated"; monsterId: MonsterId; experience: Experience }
  | { type: "ItemDropped"; item: Item }
  | { type: "PlayerLevelUp"; newLevel: Level }
  | { type: "PlayerDefeated" };

// アクション
export type GameAction =
  | { type: "StartSession" }
  | { type: "PauseSession" }
  | { type: "ResumeSession" }
  | { type: "EquipItem"; item: Item }
  | { type: "UnequipItem"; slot: keyof Player["equipment"] };