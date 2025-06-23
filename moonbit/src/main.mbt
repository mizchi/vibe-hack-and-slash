// メインエントリーポイント
// JavaScriptとの相互運用のためのエクスポート関数

// 型定義のエクスポート
pub fn init_moonbit() -> Unit {
  println("Moonbit HackNSlash module initialized")
}

// プレイヤー作成
pub fn create_player(name: String, class_name: String) -> Player {
  let player_class = match class_name {
    "Warrior" => PlayerClass::Warrior
    "Mage" => PlayerClass::Mage
    "Rogue" => PlayerClass::Rogue
    "Paladin" => PlayerClass::Paladin
    _ => PlayerClass::Warrior // デフォルト
  }
  
  let base_stats = match player_class {
    PlayerClass::Warrior => BaseStats::{
      strength: 15,
      intelligence: 5,
      dexterity: 10,
      vitality: 20
    }
    PlayerClass::Mage => BaseStats::{
      strength: 5,
      intelligence: 20,
      dexterity: 10,
      vitality: 10
    }
    PlayerClass::Rogue => BaseStats::{
      strength: 10,
      intelligence: 10,
      dexterity: 20,
      vitality: 10
    }
    PlayerClass::Paladin => BaseStats::{
      strength: 15,
      intelligence: 10,
      dexterity: 5,
      vitality: 15
    }
  }
  
  Player::{
    id: PlayerId::{ value: "player_" + @random.Rand::new().int().to_string() },
    name: name,
    class: player_class,
    level: Level::{ value: 1 },
    current_health: Health::{ value: 100 },
    current_mana: Mana::{ value: 50 },
    experience: Experience::{ value: 0 },
    base_stats: CharacterStats::{
      max_health: Health::{ value: 100 },
      base_damage: Damage::{ value: 10 },
      critical_chance: 0.05,
      critical_damage: 1.5,
      life_steal: 0.0,
      mp_regen: Mana::{ value: 5 },
      element_modifier: ElementModifier::{
        physical: 1.0,
        arcane: 0.0,
        fire: 0.0,
        lightning: 0.0,
        holy: 0.0
      }
    },
    base_attributes: base_stats,
    equipment: Map::new(),
    inventory: [],
    skills: [],
    skill_cooldowns: Map::new(),
    skill_timers: Map::new(),
    active_buffs: [],
    element_resistance: ElementResistance::{
      physical: 0.0,
      arcane: 0.0,
      fire: 0.0,
      lightning: 0.0,
      holy: 0.0
    },
    gold: Gold::{ value: 0 }
  }
}

// ダメージ計算のエクスポート
pub fn calculate_damage_js(
  base_damage: Int,
  attacker_stats: CharacterStats,
  target_resistance: ElementResistance,
  is_critical: Bool
) -> Int {
  let damage = Damage::{ value: base_damage }
  let result = calculate_final_damage(damage, attacker_stats, target_resistance, is_critical)
  result.value
}

// アイテム生成のエクスポート
pub fn generate_item_js(
  base_item_name: String,
  level: Int,
  rarity: String
) -> Item {
  let item_rarity = match rarity {
    "Common" => ItemRarity::Common
    "Magic" => ItemRarity::Magic
    "Rare" => ItemRarity::Rare
    "Legendary" => ItemRarity::Legendary
    _ => ItemRarity::Common
  }
  
  // 仮のベースアイテム
  let base_item = BaseItem::{
    id: ItemId::{ value: "item_base_" + @random.Rand::new().int().to_string() },
    name: base_item_name,
    item_type: Weapon,
    tags: [ItemTag::Sword],
    required_level: Level::{ value: 1 },
    required_class: None,
    base_modifiers: [ModifierType::IncreaseStrength(5)],
    weapon_type: Some(WeaponType::Sword),
    weapon_unique_skills: [],
    weapon_scaling: Some(WeaponScaling::{
      strength: 1.0,
      intelligence: 0.0,
      dexterity: 0.5
    })
  }
  
  generate_item(base_item, Level::{ value: level }, item_rarity, @random.Rand::new().int())
}

// アイテム表示名の取得
pub fn get_item_name_js(item: Item) -> String {
  get_item_display_name(item)
}

// アイテムステータスの取得
pub fn get_item_stats_js(item: Item) -> Array[String] {
  get_item_stats(item)
}