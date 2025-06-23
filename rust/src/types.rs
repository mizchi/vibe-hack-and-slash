use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

// ブランド型マクロ
macro_rules! branded_type {
    ($name:ident, $inner:ty) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
        pub struct $name($inner);

        impl $name {
            pub fn new(value: $inner) -> Self {
                Self(value)
            }

            pub fn value(&self) -> $inner {
                self.0
            }
        }
    };
}

// ID型の定義
branded_type!(PlayerId, Uuid);
branded_type!(ItemId, Uuid);
branded_type!(SkillId, Uuid);
branded_type!(MonsterId, Uuid);
branded_type!(SessionId, Uuid);

// 数値型の定義
branded_type!(Level, u32);
branded_type!(Health, i32);
branded_type!(Damage, i32);
branded_type!(Mana, i32);
branded_type!(Gold, u64);
branded_type!(Experience, u64);

// 基本ステータス
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct BaseStats {
    pub strength: i32,
    pub intelligence: i32,
    pub dexterity: i32,
    pub vitality: i32,
}

// 要素タイプ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ElementType {
    Physical,
    Arcane,
    Fire,
    Lightning,
    Holy,
}

// 要素耐性
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ElementResistance {
    pub physical: f64,
    pub arcane: f64,
    pub fire: f64,
    pub lightning: f64,
    pub holy: f64,
}

impl Default for ElementResistance {
    fn default() -> Self {
        Self {
            physical: 0.0,
            arcane: 0.0,
            fire: 0.0,
            lightning: 0.0,
            holy: 0.0,
        }
    }
}

// 要素倍率
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ElementModifier {
    pub physical: f64,
    pub arcane: f64,
    pub fire: f64,
    pub lightning: f64,
    pub holy: f64,
}

impl Default for ElementModifier {
    fn default() -> Self {
        Self {
            physical: 1.0,
            arcane: 0.0,
            fire: 0.0,
            lightning: 0.0,
            holy: 0.0,
        }
    }
}

// アイテムレアリティ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ItemRarity {
    Common,
    Magic,
    Rare,
    Legendary,
}

// モディファイアタイプ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ModifierType {
    IncreaseHealth(i32),
    LifeSteal(f64),
    CriticalChance(f64),
    CriticalDamage(f64),
    IncreaseMana(i32),
    ManaRegen(i32),
    SkillPower(f64),
    IncreaseStrength(i32),
    IncreaseIntelligence(i32),
    IncreaseDexterity(i32),
    IncreaseVitality(i32),
    ElementResistance { element: ElementType, value: f64 },
    ElementModifier { element: ElementType, multiplier: f64 },
}

// アイテムタイプ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ItemType {
    Weapon,
    Armor,
    Accessory,
}

// 武器タイプ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WeaponType {
    Sword,
    Axe,
    Staff,
    Bow,
    Dagger,
}

// アイテムタグ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ItemTag {
    Sword,
    Axe,
    Staff,
    Bow,
    Dagger,
    Helm,
    Gloves,
    Boots,
    Belt,
    Armor,
    Ring,
    Amulet,
    Shield,
}

// 装備スロット
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EquipmentSlot {
    MainHand,
    OffHand,
    Helm,
    Armor,
    Gloves,
    Boots,
    Belt,
    Ring1,
    Ring2,
    Amulet,
}

// プレイヤークラス
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PlayerClass {
    Warrior,
    Mage,
    Rogue,
    Paladin,
}

// 武器スケーリング
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct WeaponScaling {
    pub strength: f64,
    pub intelligence: f64,
    pub dexterity: f64,
}

// ベースアイテム
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BaseItem {
    pub id: ItemId,
    pub name: String,
    pub item_type: ItemType,
    pub tags: Vec<ItemTag>,
    pub required_level: Level,
    pub required_class: Option<Vec<PlayerClass>>,
    pub base_modifiers: Vec<ModifierType>,
    pub weapon_type: Option<WeaponType>,
    pub weapon_unique_skills: Vec<SkillId>,
    pub weapon_scaling: Option<WeaponScaling>,
}

// アイテムプレフィックス
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ItemPrefix {
    pub name: String,
    pub modifiers: Vec<ModifierType>,
}

// アイテムサフィックス
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ItemSuffix {
    pub name: String,
    pub modifiers: Vec<ModifierType>,
}

// アイテム
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Item {
    pub id: ItemId,
    pub base_item: BaseItem,
    pub rarity: ItemRarity,
    pub prefix: Option<ItemPrefix>,
    pub suffix: Option<ItemSuffix>,
    pub level: Level,
}

// キャラクターステータス
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CharacterStats {
    pub max_health: Health,
    pub base_damage: Damage,
    pub critical_chance: f64,
    pub critical_damage: f64,
    pub life_steal: f64,
    pub mp_regen: Mana,
    pub element_modifier: ElementModifier,
}

// バフタイプ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum BuffType {
    IncreaseStats(BaseStats),
    IncreaseHealth(Health),
    IncreaseMana(Mana),
    IncreaseDamage(f64),
    IncreaseDefense(f64),
    IncreaseCritical(f64),
    IncreaseLifeSteal(f64),
    ElementResistance { element: ElementType, value: f64 },
}

// バフ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Buff {
    pub id: String,
    pub name: String,
    pub buff_type: BuffType,
    pub duration: i32,
    pub remaining_turns: i32,
}

// スキルターゲット
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SkillTarget {
    #[serde(rename = "Self")]
    SelfTarget,
    Enemy,
    AllEnemies,
}

// スキルタイプ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SkillType {
    Active,
    Passive,
    Aura,
}

// スキル効果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SkillEffect {
    Damage {
        base_damage: Damage,
        scaling: f64,
        element: ElementType,
    },
    Heal {
        base_heal: Health,
        scaling: f64,
    },
    Buff {
        buff_type: BuffType,
        duration: i32,
    },
    Debuff {
        debuff_type: BuffType,
        duration: i32,
    },
    Summon {
        monster_id: MonsterId,
        duration: i32,
    },
}

// スキルトリガー条件
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SkillTriggerCondition {
    Always,
    OnCritical,
    OnKill,
    OnLowHealth(f64),
    OnHighHealth(f64),
    EveryNTurns(i32),
    OnBattleStart,
    OnBattleEnd,
}

// スキル
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Skill {
    pub id: SkillId,
    pub name: String,
    pub description: String,
    pub skill_type: SkillType,
    pub mana_cost: Mana,
    pub cooldown: i32,
    pub target_type: SkillTarget,
    pub effects: Vec<SkillEffect>,
    pub trigger_conditions: Vec<SkillTriggerCondition>,
    pub required_level: Level,
    pub weapon_type: Option<WeaponType>,
}

// プレイヤー
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Player {
    pub id: PlayerId,
    pub name: String,
    pub class: PlayerClass,
    pub level: Level,
    pub current_health: Health,
    pub current_mana: Mana,
    pub experience: Experience,
    pub base_stats: CharacterStats,
    pub base_attributes: BaseStats,
    pub equipment: HashMap<EquipmentSlot, Item>,
    pub inventory: Vec<Item>,
    pub skills: Vec<Skill>,
    pub skill_cooldowns: HashMap<SkillId, i32>,
    pub skill_timers: HashMap<SkillId, i32>,
    pub active_buffs: Vec<Buff>,
    pub element_resistance: ElementResistance,
    pub gold: Gold,
}

// モンスターティア
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MonsterTier {
    Common,
    Elite,
    Rare,
    Boss,
    Legendary,
}

// レアリティウェイト
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RarityWeights {
    pub common: f64,
    pub magic: f64,
    pub rare: f64,
    pub legendary: f64,
}

// ルートエントリー
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LootEntry {
    pub base_item_id: ItemId,
    pub drop_chance: f64,
    pub rarity_weights: RarityWeights,
}

// モンスター
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Monster {
    pub id: MonsterId,
    pub name: String,
    pub tier: MonsterTier,
    pub level: Level,
    pub current_health: Health,
    pub stats: CharacterStats,
    pub element_resistance: ElementResistance,
    pub loot_table: Vec<LootEntry>,
}

// セッション状態
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SessionState {
    InProgress,
    Paused,
    Completed,
}

// セッション
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Session {
    pub id: SessionId,
    pub player: Player,
    pub current_monster: Option<Monster>,
    pub defeated_count: u32,
    pub wave: u32,
    pub state: SessionState,
    pub started_at: String, // TODO: chrono::DateTime
}

// バトルイベント
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum BattleEvent {
    PlayerAttack { damage: Damage, is_critical: bool },
    MonsterAttack { damage: Damage },
    PlayerHeal { amount: Health },
    MonsterDefeated { experience: Experience },
    ItemDropped { item: Item },
    PlayerLevelUp { new_level: Level },
    PlayerDefeated,
    SkillUsed { skill_name: String },
    SkillDamage {
        skill_name: String,
        damage: Damage,
        target_id: MonsterId,
        target_name: String,
    },
    SkillHeal {
        skill_name: String,
        amount: Health,
    },
    ManaRegenerated { amount: Mana },
    NotEnoughMana,
}