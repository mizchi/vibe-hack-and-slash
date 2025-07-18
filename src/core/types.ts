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
export type Mana = Brand<number, "Mana">;
export type SkillId = Brand<string, "SkillId">;
export type Gold = Brand<number, "Gold">;

// 基本ステータス
export type Strength = Brand<number, "Strength">;  // STR: 物理ダメージ
export type Intelligence = Brand<number, "Intelligence">;  // INT: 魔法ダメージ、MP
export type Dexterity = Brand<number, "Dexterity">;  // DEX: クリティカル率、命中率
export type Vitality = Brand<number, "Vitality">;  // VIT: HP、防御力

// 属性タイプ
export type ElementType = 
  | "Physical"  // 物理
  | "Arcane"    // 神秘
  | "Fire"      // 火
  | "Lightning" // 雷
  | "Holy";     // 聖

// 属性耐性
export type ElementResistance = {
  [key in ElementType]: number; // 0-100% (負の値は弱点)
};

// 属性修正（装備によるダメージ倍率）
export type ElementModifier = {
  [key in ElementType]: number; // デフォルト1.0
};

// プレイヤータイプ
export type PlayerClass = "Warrior" | "Mage" | "Rogue" | "Paladin";

// 装備スロット
export type EquipmentSlot = 
  | "MainHand" 
  | "OffHand" 
  | "Armor" 
  | "Helm"
  | "Gloves"
  | "Boots"
  | "Ring1" 
  | "Ring2"
  | "Amulet"
  | "Belt";

// 装備タグ（アイテムが装備可能なスロットを示す）
export type ItemTag = 
  | "OneHanded"      // 片手武器
  | "TwoHanded"      // 両手武器
  | "Shield"         // 盾
  | "Staff"          // 杖
  | "Dagger"         // 短剣
  | "Sword"          // 剣
  | "Axe"            // 斧
  | "Mace"           // メイス
  | "Bow"            // 弓
  | "Spear"          // 槍
  | "HeavyArmor"     // 重装甲
  | "LightArmor"     // 軽装甲
  | "ClothArmor"     // 布装甲
  | "Ring"           // 指輪
  | "Amulet"         // アミュレット
  | "Belt"           // ベルト
  | "Helm"           // 兜
  | "Gloves"         // 手袋
  | "Boots";         // ブーツ

// プレイヤータイプ別の装備スロット定義
export type ClassEquipmentSlots = {
  [key in PlayerClass]: {
    slots: EquipmentSlot[];
    restrictions: {
      [slot in EquipmentSlot]?: ItemTag[]; // そのスロットに装備可能なタグ
    };
  };
};

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
  | { type: "CriticalDamage"; multiplier: number }
  | { type: "IncreaseMana"; value: number }
  | { type: "ManaRegen"; value: number }
  | { type: "SkillPower"; percentage: number }
  | { type: "IncreaseStrength"; value: number }
  | { type: "IncreaseIntelligence"; value: number }
  | { type: "IncreaseDexterity"; value: number }
  | { type: "IncreaseVitality"; value: number }
  | { type: "ElementResistance"; element: ElementType; value: number }
  | { type: "ElementModifier"; element: ElementType; multiplier: number }; // 属性ダメージ倍率

export type ItemType = "Weapon" | "Armor" | "Accessory";

// 武器のスケーリング
export type WeaponScaling = {
  strength?: number;      // STRによるダメージ倍率
  intelligence?: number;  // INTによるダメージ倍率
  dexterity?: number;    // DEXによるダメージ倍率
};

export type BaseItem = {
  id: ItemId;
  name: string;
  type: ItemType;
  tags: ItemTag[]; // 装備可能なスロットを示すタグ
  baseModifiers: ItemModifier[];
  requiredLevel?: Level; // 装備レベル制限
  requiredClass?: PlayerClass[]; // 装備可能なクラス
  weaponScaling?: WeaponScaling; // 武器の場合のスケーリング
  elementModifiers?: ElementModifier; // 属性ダメージ倍率
  weaponSkillId?: SkillId; // 武器固有スキル
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
  baseDamage: Damage; // 基礎ダメージ
  criticalChance: number;
  criticalDamage: number;
  lifeSteal: number;
  skillPower: number;
};

// 基本ステータス
export type BaseStats = {
  strength: Strength;
  intelligence: Intelligence;
  dexterity: Dexterity;
  vitality: Vitality;
};

// バフ/デバフシステム
export type Buff = {
  id: string;
  name: string;
  stat: keyof CharacterStats;
  value: number;
  duration: number; // 残りターン数
};

// リソースシステム
export type ResourceColor = "White" | "Red" | "Blue" | "Green" | "Black";
export type ResourcePool = {
  [key in ResourceColor]: number;
};

export type Player = {
  id: PlayerId;
  name: string;
  class: PlayerClass;
  level: Level;
  experience: Experience;
  currentHealth: Health;
  baseStats: CharacterStats;
  baseAttributes: BaseStats; // STR/INT/DEX/VIT
  equipment: Map<EquipmentSlot, Item>; // スロットごとの装備
  inventory: Item[]; // インベントリ
  skills: Skill[];
  skillCooldowns: Map<SkillId, number>; // 残りクールダウンターン
  skillTimers: Map<SkillId, number>; // スキル自動発動タイマー
  activeBuffs: Buff[]; // アクティブなバフ
  elementResistance: ElementResistance; // 属性耐性
  gold: Gold;
  resourcePool: ResourcePool; // 現在のリソース
};

// モンスターティア
export type MonsterTier = "Common" | "Elite" | "Rare" | "Boss" | "Legendary";

// モンスター
export type Monster = {
  id: MonsterId;
  name: string;
  tier: MonsterTier;
  level: Level;
  currentHealth: Health;
  stats: CharacterStats;
  elementResistance: ElementResistance; // 属性耐性
  lootTable: LootEntry[];
  resourcePool?: ResourcePool; // リソースプール（オプション）
  skills?: Skill[]; // スキル（オプション）
  skillCooldowns?: Map<SkillId, number>; // クールダウン（オプション）
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
  currentMonster?: Monster; // 現在の敵（オプショナル）
  defeatedCount: number;
  wave: number; // ウェーブ番号
  state: SessionState;
  startedAt: Date;
};

// スキルシステム
export type SkillType = "Active" | "Passive" | "Basic";
export type SkillTargetType = "Self" | "Enemy" | "All";

export type SkillEffect =
  | { type: "Damage"; baseDamage: Damage; scaling: number; element: ElementType } // scaling = skillPowerの倍率
  | { type: "Heal"; baseHeal: Health; scaling: number }
  | { type: "Buff"; stat: keyof CharacterStats; value: number; duration: number }
  | { type: "Debuff"; stat: string; value: number; duration: number }
  | { type: "Stun"; duration: number }
  | { type: "DamageOverTime"; damage: Damage; duration: number; element: ElementType }
  | { type: "LifeDrain"; percentage: number };

export type SkillTriggerCondition =
  | { type: "Always" } // 常に発動可能
  | { type: "HealthBelow"; percentage: number }
  | { type: "ManaAbove"; percentage: number }
  | { type: "EnemyHealthBelow"; percentage: number }
  | { type: "CriticalHit" }
  | { type: "OnKill" }
  | { type: "TurnInterval"; interval: number };

export type ResourceGeneration = {
  color: ResourceColor;
  amount: number;
  chance: number;
};

export type Skill = {
  id: SkillId;
  name: string;
  description: string;
  type: SkillType;
  manaCost: Mana;
  cooldown: number; // ターン数
  targetType: SkillTargetType;
  effects: SkillEffect[];
  triggerConditions: SkillTriggerCondition[]; // 全て満たす必要がある
  priority: number; // 高いほど優先
  requiredWeaponTags?: ItemTag[]; // 必要な武器タグ（いずれか1つ満たせばOK）
  requiredClass?: PlayerClass[]; // 必要な職業（いずれか1つ満たせばOK）
  guaranteedCritical?: boolean; // 確実にクリティカルになるか
  resourceCost?: ResourcePool; // リソース消費
  resourceGeneration?: ResourceGeneration[]; // リソース生成
};

// バトルイベント
export type BattleEvent =
  | { type: "PlayerAttack"; damage: Damage; isCritical: boolean; targetId: MonsterId; targetName: string }
  | { type: "MonsterAttack"; damage: Damage; attackerId: MonsterId; attackerName: string }
  | { type: "PlayerHeal"; amount: Health }
  | { type: "MonsterDefeated"; monsterId: MonsterId; monsterName: string; experience: Experience }
  | { type: "ItemDropped"; item: Item }
  | { type: "PlayerLevelUp"; newLevel: Level }
  | { type: "PlayerDefeated" }
  | { type: "SkillUsed"; skillId: SkillId; skillName: string; manaCost: Mana }
  | { type: "SkillDamage"; skillName: string; damage: Damage; targetId: MonsterId; targetName: string }
  | { type: "SkillHeal"; skillName: string; amount: Health }
  | { type: "ManaRegenerated"; amount: Mana }
  | { type: "NotEnoughMana"; skillName: string; required: Mana; current: Mana }
  | { type: "GoldDropped"; amount: Gold }
  | { type: "WaveStart"; wave: number; monsterCount: number }
  | { type: "WaveCleared"; wave: number; reward?: Item[] }
  | { type: "PassiveTriggered"; skillName: string; effect: string };

// アクション
export type GameAction =
  | { type: "StartSession" }
  | { type: "PauseSession" }
  | { type: "ResumeSession" }
  | { type: "EquipItem"; item: Item; slot: EquipmentSlot }
  | { type: "UnequipItem"; slot: EquipmentSlot };