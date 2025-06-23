// ブランド型の実装（Moonbitの正しい構文）
// Moonbitでは newtype は struct{} で実装する

pub struct PlayerId { value : String } derive(Eq, Show)
pub struct ItemId { value : String } derive(Eq, Show)
pub struct SkillId { value : String } derive(Eq, Show, Hash)
pub struct MonsterId { value : String } derive(Eq, Show)
pub struct SessionId { value : String } derive(Eq, Show)

// 数値型のブランド型
pub struct Level { value : Int } derive(Eq, Show)
pub struct Health { value : Int } derive(Eq, Show)
pub struct Damage { value : Int } derive(Eq, Show)
pub struct Mana { value : Int } derive(Eq, Show)
pub struct Gold { value : Int } derive(Eq, Show)
pub struct Experience { value : Int } derive(Eq, Show)

// 基本ステータス
pub struct BaseStats {
  strength : Int
  intelligence : Int
  dexterity : Int
  vitality : Int
} derive(Eq, Show)

// 要素タイプ
pub enum ElementType {
  Physical
  Arcane
  Fire
  Lightning
  Holy
} derive(Eq, Show)

// 要素耐性
pub struct ElementResistance {
  physical : Double
  arcane : Double
  fire : Double
  lightning : Double
  holy : Double
} derive(Eq, Show)

// 要素倍率
pub struct ElementModifier {
  physical : Double
  arcane : Double
  fire : Double
  lightning : Double
  holy : Double
} derive(Eq, Show)

// アイテムレアリティ
pub enum ItemRarity {
  Common
  Magic
  Rare
  Legendary
} derive(Eq, Show)

// モディファイアタイプ
pub enum ModifierType {
  IncreaseHealth(Int)
  LifeSteal(Double)
  CriticalChance(Double)
  CriticalDamage(Double)
  IncreaseMana(Int)
  ManaRegen(Int)
  SkillPower(Double)
  IncreaseStrength(Int)
  IncreaseIntelligence(Int)
  IncreaseDexterity(Int)
  IncreaseVitality(Int)
  ElementResistance(ElementType, Double)
  ElementModifier(ElementType, Double)
} derive(Eq, Show)

// アイテムタイプ
pub enum ItemType {
  Weapon
  Armor
  Accessory
} derive(Eq, Show)

// 武器タイプ
pub enum WeaponType {
  Sword
  Axe
  Staff
  Bow
  Dagger
} derive(Eq, Show)

// アイテムタグ
pub enum ItemTag {
  Sword
  Axe
  Staff
  Bow
  Dagger
  Helm
  Gloves
  Boots
  Belt
  Armor
  Ring
  Amulet
  Shield
} derive(Eq, Show)

// 装備スロット
pub enum EquipmentSlot {
  MainHand
  OffHand
  Helm
  Armor
  Gloves
  Boots
  Belt
  Ring1
  Ring2
  Amulet
} derive(Eq, Show, Hash)

// プレイヤークラス
pub enum PlayerClass {
  Warrior
  Mage
  Rogue
  Paladin
} derive(Eq, Show)

// 武器スケーリング
pub struct WeaponScaling {
  strength : Double
  intelligence : Double
  dexterity : Double
} derive(Eq, Show)

// ベースアイテム
pub struct BaseItem {
  id : ItemId
  name : String
  item_type : ItemType
  tags : Array[ItemTag]
  required_level : Level
  required_class : Option[Array[PlayerClass]]
  base_modifiers : Array[ModifierType]
  weapon_type : Option[WeaponType]
  weapon_unique_skills : Array[SkillId]
  weapon_scaling : Option[WeaponScaling]
} derive(Eq, Show)

// アイテムプレフィックス
pub struct ItemPrefix {
  name : String
  modifiers : Array[ModifierType]
} derive(Eq, Show)

// アイテムサフィックス
pub struct ItemSuffix {
  name : String
  modifiers : Array[ModifierType]
} derive(Eq, Show)

// アイテム
pub struct Item {
  id : ItemId
  base_item : BaseItem
  rarity : ItemRarity
  prefix : Option[ItemPrefix]
  suffix : Option[ItemSuffix]
  level : Level
} derive(Eq, Show)

// キャラクターステータス
pub struct CharacterStats {
  max_health : Health
  base_damage : Damage
  critical_chance : Double
  critical_damage : Double
  life_steal : Double
  mp_regen : Mana
  element_modifier : ElementModifier
} derive(Eq, Show)

// バフタイプ
pub enum BuffType {
  IncreaseStats(BaseStats)
  IncreaseHealth(Health)
  IncreaseMana(Mana)
  IncreaseDamage(Double)
  IncreaseDefense(Double)
  IncreaseCritical(Double)
  IncreaseLifeSteal(Double)
  ElementResistance(ElementType, Double)
} derive(Eq, Show)

// バフ
pub struct Buff {
  id : String
  name : String
  buff_type : BuffType
  duration : Int
  remaining_turns : Int
} derive(Eq, Show)

// スキルターゲット
pub enum SkillTarget {
  Self
  Enemy
  AllEnemies
} derive(Eq, Show)

// スキルタイプ
pub enum SkillType {
  Active
  Passive
  Aura
} derive(Eq, Show)

// スキル効果
pub struct SkillEffect {
  effect_type : SkillEffectType
} derive(Eq, Show)

// スキル効果タイプ
pub enum SkillEffectType {
  Damage(Damage, Double, ElementType)
  Heal(Health, Double)
  Buff(BuffType, Int)
  Debuff(BuffType, Int)
  Summon(MonsterId, Int)
} derive(Eq, Show)

// スキルトリガー条件
pub enum SkillTriggerCondition {
  Always
  OnCritical
  OnKill
  OnLowHealth(Double)
  OnHighHealth(Double)
  EveryNTurns(Int)
  OnBattleStart
  OnBattleEnd
} derive(Eq, Show)

// スキル
pub struct Skill {
  id : SkillId
  name : String
  description : String
  skill_type : SkillType
  mana_cost : Mana
  cooldown : Int
  target_type : SkillTarget
  effects : Array[SkillEffect]
  trigger_conditions : Array[SkillTriggerCondition]
  required_level : Level
  weapon_type : Option[WeaponType]
} derive(Eq, Show)

// プレイヤー
pub struct Player {
  id : PlayerId
  name : String
  class : PlayerClass
  level : Level
  current_health : Health
  current_mana : Mana
  experience : Experience
  base_stats : CharacterStats
  base_attributes : BaseStats
  equipment : Map[EquipmentSlot, Item]
  inventory : Array[Item]
  skills : Array[Skill]
  skill_cooldowns : Map[SkillId, Int]
  skill_timers : Map[SkillId, Int]
  active_buffs : Array[Buff]
  element_resistance : ElementResistance
  gold : Gold
} derive(Eq, Show)

// モンスターティア
pub enum MonsterTier {
  Common
  Elite
  Rare
  Boss
  Legendary
} derive(Eq, Show)

// レアリティウェイト
pub struct RarityWeights {
  common : Double
  magic : Double
  rare : Double
  legendary : Double
} derive(Eq, Show)

// ルートエントリー
pub struct LootEntry {
  base_item_id : ItemId
  drop_chance : Double
  rarity_weights : RarityWeights
} derive(Eq, Show)

// モンスター
pub struct Monster {
  id : MonsterId
  name : String
  tier : MonsterTier
  level : Level
  current_health : Health
  stats : CharacterStats
  element_resistance : ElementResistance
  loot_table : Array[LootEntry]
} derive(Eq, Show)

// セッション状態
pub enum SessionState {
  InProgress
  Paused
  Completed
} derive(Eq, Show)

// セッション
pub struct Session {
  id : SessionId
  player : Player
  current_monster : Option[Monster]
  defeated_count : Int
  wave : Int
  state : SessionState
  started_at : String
} derive(Eq, Show)

// バトルイベント
pub enum BattleEvent {
  PlayerAttack(Damage, Bool)
  MonsterAttack(Damage)
  PlayerHeal(Health)
  MonsterDefeated(Experience)
  ItemDropped(Item)
  PlayerLevelUp(Level)
  PlayerDefeated
  SkillUsed(String)
  SkillDamage(String, Damage, MonsterId, String)
  SkillHeal(String, Health)
  ManaRegenerated(Mana)
  NotEnoughMana
} derive(Eq, Show)