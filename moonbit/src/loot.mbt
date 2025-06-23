// ルートシステム

// プレフィックスプール
priv struct PrefixEntry {
  rarity : ItemRarity
  prefix : ItemPrefix
}

let prefix_pool : Array[PrefixEntry] = [
  PrefixEntry::{ rarity: ItemRarity::Common, prefix: ItemPrefix::{ name: "頑丈な", modifiers: [ModifierType::IncreaseHealth(10)] } },
  PrefixEntry::{ rarity: ItemRarity::Common, prefix: ItemPrefix::{ name: "鋭い", modifiers: [ModifierType::IncreaseStrength(3)] } },
  PrefixEntry::{ rarity: ItemRarity::Magic, prefix: ItemPrefix::{ name: "戦士の", modifiers: [ModifierType::IncreaseStrength(5), ModifierType::IncreaseHealth(20)] } },
  PrefixEntry::{ rarity: ItemRarity::Magic, prefix: ItemPrefix::{ name: "魔法の", modifiers: [ModifierType::IncreaseIntelligence(5), ModifierType::IncreaseMana(20)] } },
  PrefixEntry::{ rarity: ItemRarity::Rare, prefix: ItemPrefix::{ name: "伝説の", modifiers: [ModifierType::IncreaseStrength(8), ModifierType::CriticalChance(0.1)] } },
  PrefixEntry::{ rarity: ItemRarity::Rare, prefix: ItemPrefix::{ name: "古代の", modifiers: [ModifierType::IncreaseIntelligence(8), ModifierType::SkillPower(0.15)] } },
  PrefixEntry::{ rarity: ItemRarity::Legendary, prefix: ItemPrefix::{ name: "神話の", modifiers: [
    ModifierType::IncreaseStrength(10), 
    ModifierType::IncreaseVitality(10), 
    ModifierType::CriticalDamage(0.5)
  ] } }
]

// サフィックスプール
priv struct SuffixEntry {
  rarity : ItemRarity
  suffix : ItemSuffix
}

let suffix_pool : Array[SuffixEntry] = [
  SuffixEntry::{ rarity: ItemRarity::Common, suffix: ItemSuffix::{ name: "力の", modifiers: [ModifierType::IncreaseStrength(2)] } },
  SuffixEntry::{ rarity: ItemRarity::Common, suffix: ItemSuffix::{ name: "守護の", modifiers: [ModifierType::IncreaseVitality(3)] } },
  SuffixEntry::{ rarity: ItemRarity::Magic, suffix: ItemSuffix::{ name: "俊敏の", modifiers: [ModifierType::IncreaseDexterity(5), ModifierType::CriticalChance(0.05)] } },
  SuffixEntry::{ rarity: ItemRarity::Magic, suffix: ItemSuffix::{ name: "知恵の", modifiers: [ModifierType::IncreaseIntelligence(5), ModifierType::ManaRegen(3)] } },
  SuffixEntry::{ rarity: ItemRarity::Rare, suffix: ItemSuffix::{ name: "不滅の", modifiers: [ModifierType::IncreaseHealth(50), ModifierType::LifeSteal(0.05)] } },
  SuffixEntry::{ rarity: ItemRarity::Rare, suffix: ItemSuffix::{ name: "破壊の", modifiers: [ModifierType::CriticalDamage(0.3), ModifierType::ElementModifier(ElementType::Physical, 0.2)] } },
  SuffixEntry::{ rarity: ItemRarity::Legendary, suffix: ItemSuffix::{ name: "神々の", modifiers: [
    ModifierType::IncreaseHealth(100),
    ModifierType::ElementResistance(ElementType::Physical, 0.2),
    ModifierType::ElementResistance(ElementType::Fire, 0.2)
  ] } }
]

// アイテム生成
pub fn generate_item(
  base_item: BaseItem,
  level: Level,
  rarity: ItemRarity,
  seed: Int
) -> Item {
  let item_id = generate_item_id(seed)
  
  // レアリティに応じてプレフィックス/サフィックスを付与
  let (prefix, suffix) = match rarity {
    Common => (None, None)
    Magic => {
      // 50%の確率でプレフィックスかサフィックスのどちらか
      if seed % 2 == 0 {
        (select_prefix(rarity, seed), None)
      } else {
        (None, select_suffix(rarity, seed))
      }
    }
    Rare => {
      // 両方付与
      (select_prefix(rarity, seed), select_suffix(rarity, seed))
    }
    Legendary => {
      // 特別な組み合わせ
      (select_prefix(rarity, seed), select_suffix(rarity, seed))
    }
  }
  
  Item::{
    id: item_id,
    base_item: base_item,
    rarity: rarity,
    prefix: prefix,
    suffix: suffix,
    level: level
  }
}

// プレフィックス選択
fn select_prefix(rarity: ItemRarity, seed: Int) -> Option[ItemPrefix] {
  let candidates = []
  prefix_pool.iter().each(fn(entry) {
    let matches = match (rarity, entry.rarity) {
      (ItemRarity::Common, ItemRarity::Common) => true
      (ItemRarity::Magic, ItemRarity::Common) => true
      (ItemRarity::Magic, ItemRarity::Magic) => true
      (ItemRarity::Rare, _) => true
      (ItemRarity::Legendary, _) => true
      _ => false
    }
    if matches {
      candidates.push(entry)
    }
  })
  
  if candidates.is_empty() {
    None
  } else {
    let index = seed % candidates.length()
    match candidates.get(index) {
      Some(entry) => Some(entry.prefix)
      None => None
    }
  }
}

// サフィックス選択
fn select_suffix(rarity: ItemRarity, seed: Int) -> Option[ItemSuffix] {
  let candidates = []
  suffix_pool.iter().each(fn(entry) {
    let matches = match (rarity, entry.rarity) {
      (ItemRarity::Common, ItemRarity::Common) => true
      (ItemRarity::Magic, ItemRarity::Common) => true
      (ItemRarity::Magic, ItemRarity::Magic) => true
      (ItemRarity::Rare, _) => true
      (ItemRarity::Legendary, _) => true
      _ => false
    }
    if matches {
      candidates.push(entry)
    }
  })
  
  if candidates.is_empty() {
    None
  } else {
    let index = (seed * 7) % candidates.length()
    match candidates.get(index) {
      Some(entry) => Some(entry.suffix)
      None => None
    }
  }
}

// アイテムID生成
fn generate_item_id(seed: Int) -> ItemId {
  ItemId::{ value: "item_" + seed.to_string() }
}

// アイテム表示名取得
pub fn get_item_display_name(item: Item) -> String {
  let mut name = ""
  
  // プレフィックス
  match item.prefix {
    Some(prefix) => name = prefix.name + " "
    None => ()
  }
  
  // ベース名
  name = name + item.base_item.name
  
  // サフィックス
  match item.suffix {
    Some(suffix) => name = name + " " + suffix.name
    None => ()
  }
  
  // レベル表示
  name + " Lv." + item.level.value.to_string()
}

// アイテムステータス表示
pub fn get_item_stats(item: Item) -> Array[String] {
  let stats : Array[String] = []
  
  // ベースモディファイア
  item.base_item.base_modifiers.iter().each(fn(modifier) {
    stats.push(format_modifier(modifier))
  })
  
  // プレフィックスモディファイア
  match item.prefix {
    Some(prefix) => {
      prefix.modifiers.iter().each(fn(modifier) {
        stats.push(format_modifier(modifier))
      })
    }
    None => ()
  }
  
  // サフィックスモディファイア
  match item.suffix {
    Some(suffix) => {
      suffix.modifiers.iter().each(fn(modifier) {
        stats.push(format_modifier(modifier))
      })
    }
    None => ()
  }
  
  stats
}

// モディファイアのフォーマット
fn format_modifier(modifier: ModifierType) -> String {
  match modifier {
    ModifierType::IncreaseHealth(value) => "体力 +" + value.to_string()
    ModifierType::LifeSteal(value) => "ライフスティール " + (value * 100.0).to_int().to_string() + "%"
    ModifierType::CriticalChance(value) => "クリティカル率 +" + (value * 100.0).to_int().to_string() + "%"
    ModifierType::CriticalDamage(value) => "クリティカルダメージ +" + (value * 100.0).to_int().to_string() + "%"
    ModifierType::IncreaseMana(value) => "マナ +" + value.to_string()
    ModifierType::ManaRegen(value) => "マナ回復 +" + value.to_string()
    ModifierType::SkillPower(value) => "スキル威力 +" + (value * 100.0).to_int().to_string() + "%"
    ModifierType::IncreaseStrength(value) => "STR +" + value.to_string()
    ModifierType::IncreaseIntelligence(value) => "INT +" + value.to_string()
    ModifierType::IncreaseDexterity(value) => "DEX +" + value.to_string()
    ModifierType::IncreaseVitality(value) => "VIT +" + value.to_string()
    ModifierType::ElementResistance(element, value) => {
      element_name(element) + "耐性 +" + (value * 100.0).to_int().to_string() + "%"
    }
    ModifierType::ElementModifier(element, value) => {
      element_name(element) + "ダメージ +" + (value * 100.0).to_int().to_string() + "%"
    }
  }
}

// 要素名取得
fn element_name(element: ElementType) -> String {
  match element {
    ElementType::Physical => "物理"
    ElementType::Arcane => "魔法"
    ElementType::Fire => "火"
    ElementType::Lightning => "雷"
    ElementType::Holy => "聖"
  }
}

// ドロップ判定
pub fn roll_loot(
  loot_table: Array[LootEntry],
  monster_level: Level,
  seed: Int
) -> Option[Item] {
  let _ = seed  // 現在のRand APIではシード値を使えないため、一旦無視
  // ドロップ判定
  let drop_roll = (seed % 100).to_double() / 100.0
  
  // ルートテーブルから選択
  let mut accumulated = 0.0
  let mut selected_entry : Option[LootEntry] = None
  
  loot_table.iter().each(fn(entry) {
    match selected_entry {
      None => {
        if drop_roll < accumulated + entry.drop_chance {
          selected_entry = Some(entry)
        }
      }
      Some(_) => ()
    }
    accumulated = accumulated + entry.drop_chance
  })
  
  match selected_entry {
    Some(entry) => {
      // レアリティ決定
      let rarity_roll = ((seed + 1) % 100).to_double() / 100.0
      let rarity = determine_rarity(entry.rarity_weights, rarity_roll)
      
      // ベースアイテム取得（実際の実装では外部から取得）
      // ここでは仮のベースアイテムを返す
      let base_item = BaseItem::{
        id: entry.base_item_id,
        name: "仮アイテム",
        item_type: Weapon,
        tags: [],
        required_level: Level::{ value: 1 },
        required_class: None,
        base_modifiers: [],
        weapon_type: Some(Sword),
        weapon_unique_skills: [],
        weapon_scaling: None
      }
      
      Some(generate_item(base_item, monster_level, rarity, seed + 2))
    }
    None => None
  }
}

// レアリティ決定
fn determine_rarity(weights: RarityWeights, roll: Double) -> ItemRarity {
  let total = weights.common + weights.magic + weights.rare + weights.legendary
  let normalized_roll = roll * total
  
  if normalized_roll < weights.common {
    ItemRarity::Common
  } else if normalized_roll < weights.common + weights.magic {
    ItemRarity::Magic
  } else if normalized_roll < weights.common + weights.magic + weights.rare {
    ItemRarity::Rare
  } else {
    ItemRarity::Legendary
  }
}