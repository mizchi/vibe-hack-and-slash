// ダメージ計算モジュール（修正版）

// 基礎ダメージ計算
pub fn calculate_base_damage(attacker: Player) -> Damage {
  let base_damage = attacker.base_stats.base_damage
  let strength_bonus = attacker.base_attributes.strength
  
  // STRボーナス: 1 STR = 2ダメージ
  let total_damage = Damage::{ value: base_damage.value + strength_bonus * 2 }
  
  total_damage
}

// ステータス合計計算
pub fn calculate_total_stats(player: Player) -> CharacterStats {
  let stats = player.base_stats
  
  // 新しいステータスを作成
  let mut max_health = stats.max_health.value
  let base_damage = stats.base_damage.value
  let mut critical_chance = stats.critical_chance
  let mut critical_damage = stats.critical_damage
  let mut life_steal = stats.life_steal
  let mut mp_regen = stats.mp_regen.value
  let mut element_modifier = stats.element_modifier
  
  // 装備からのステータス加算
  player.equipment.iter().each(fn(entry) {
    let (_, item) = entry
    item.base_item.base_modifiers.iter().each(fn(modifier) {
      match modifier {
        ModifierType::IncreaseHealth(value) => {
          max_health = max_health + value
        }
        ModifierType::CriticalChance(value) => {
          critical_chance = critical_chance + value
        }
        ModifierType::CriticalDamage(value) => {
          critical_damage = critical_damage + value
        }
        ModifierType::LifeSteal(value) => {
          life_steal = life_steal + value
        }
        _ => ()
      }
    })
    
    // プレフィックスとサフィックスのモディファイア
    match item.prefix {
      Some(prefix) => {
        prefix.modifiers.iter().each(fn(modifier) {
          match modifier {
            ModifierType::IncreaseHealth(value) => {
              max_health = max_health + value
            }
            ModifierType::CriticalChance(value) => {
              critical_chance = critical_chance + value
            }
            ModifierType::CriticalDamage(value) => {
              critical_damage = critical_damage + value
            }
            ModifierType::LifeSteal(value) => {
              life_steal = life_steal + value
            }
            ModifierType::ManaRegen(value) => {
              mp_regen = mp_regen + value
            }
            ModifierType::ElementModifier(element, value) => {
              match element {
                Physical => element_modifier = ElementModifier::{
                  physical: element_modifier.physical + value,
                  arcane: element_modifier.arcane,
                  fire: element_modifier.fire,
                  lightning: element_modifier.lightning,
                  holy: element_modifier.holy
                }
                Arcane => element_modifier = ElementModifier::{
                  physical: element_modifier.physical,
                  arcane: element_modifier.arcane + value,
                  fire: element_modifier.fire,
                  lightning: element_modifier.lightning,
                  holy: element_modifier.holy
                }
                Fire => element_modifier = ElementModifier::{
                  physical: element_modifier.physical,
                  arcane: element_modifier.arcane,
                  fire: element_modifier.fire + value,
                  lightning: element_modifier.lightning,
                  holy: element_modifier.holy
                }
                Lightning => element_modifier = ElementModifier::{
                  physical: element_modifier.physical,
                  arcane: element_modifier.arcane,
                  fire: element_modifier.fire,
                  lightning: element_modifier.lightning + value,
                  holy: element_modifier.holy
                }
                Holy => element_modifier = ElementModifier::{
                  physical: element_modifier.physical,
                  arcane: element_modifier.arcane,
                  fire: element_modifier.fire,
                  lightning: element_modifier.lightning,
                  holy: element_modifier.holy + value
                }
              }
            }
            _ => ()
          }
        })
      }
      None => ()
    }
    
    match item.suffix {
      Some(suffix) => {
        suffix.modifiers.iter().each(fn(modifier) {
          match modifier {
            ModifierType::IncreaseHealth(value) => {
              max_health = max_health + value
            }
            ModifierType::CriticalChance(value) => {
              critical_chance = critical_chance + value
            }
            ModifierType::CriticalDamage(value) => {
              critical_damage = critical_damage + value
            }
            ModifierType::LifeSteal(value) => {
              life_steal = life_steal + value
            }
            ModifierType::ManaRegen(value) => {
              mp_regen = mp_regen + value
            }
            _ => ()
          }
        })
      }
      None => ()
    }
  })
  
  // VITによる体力ボーナス (1 VIT = 5 HP)
  max_health = max_health + player.base_attributes.vitality * 5
  
  // INTによるマナボーナス (1 INT = 3 MP)
  mp_regen = mp_regen + player.base_attributes.intelligence / 5
  
  CharacterStats::{
    max_health: Health::{ value: max_health },
    base_damage: Damage::{ value: base_damage },
    critical_chance: critical_chance,
    critical_damage: critical_damage,
    life_steal: life_steal,
    mp_regen: Mana::{ value: mp_regen },
    element_modifier: element_modifier
  }
}

// ダメージ計算（敵への攻撃）
pub fn calculate_damage(
  attacker: Player,
  defender_resistance: ElementResistance,
  element: ElementType,
  is_skill: Bool
) -> (Damage, Bool) { // damage, is_critical
  let _ = is_skill  // 未使用だが引数として必要
  let stats = calculate_total_stats(attacker)
  let base = stats.base_damage.value
  
  // 基礎ダメージ計算
  let mut damage = base.to_double()
  
  // 武器による属性倍率
  let element_mult = match element {
    Physical => stats.element_modifier.physical
    Arcane => stats.element_modifier.arcane
    Fire => stats.element_modifier.fire
    Lightning => stats.element_modifier.lightning
    Holy => stats.element_modifier.holy
  }
  damage = damage * element_mult
  
  // クリティカル判定
  let rand = @random.Rand::new()
  let is_critical = rand.double() < stats.critical_chance
  if is_critical {
    damage = damage * stats.critical_damage
  }
  
  // 敵の属性耐性適用
  let resistance = match element {
    Physical => defender_resistance.physical
    Arcane => defender_resistance.arcane
    Fire => defender_resistance.fire
    Lightning => defender_resistance.lightning
    Holy => defender_resistance.holy
  }
  damage = damage * (1.0 - resistance)
  
  // 最小ダメージ保証
  let final_damage = if damage < 1.0 { 1 } else { damage.to_int() }
  
  (Damage::{ value: final_damage }, is_critical)
}

// スキルダメージ計算
pub fn calculate_skill_damage(
  caster: Player,
  base_damage: Damage,
  scaling: Double,
  element: ElementType
) -> Damage {
  let stats = calculate_total_stats(caster)
  let base = base_damage.value
  
  // スケーリング計算（主にINTベース）
  let scaled_damage = base.to_double() + 
    (caster.base_attributes.intelligence.to_double() * scaling)
  
  // 属性倍率
  let element_mult = match element {
    Physical => stats.element_modifier.physical
    Arcane => stats.element_modifier.arcane
    Fire => stats.element_modifier.fire
    Lightning => stats.element_modifier.lightning
    Holy => stats.element_modifier.holy
  }
  
  let final_damage = (scaled_damage * element_mult).to_int()
  Damage::{ value: if final_damage < 1 { 1 } else { final_damage } }
}

// 被ダメージ計算（プレイヤーが受けるダメージ）
pub fn calculate_damage_taken(
  defender: Player,
  raw_damage: Damage,
  element: ElementType
) -> Damage {
  let damage = raw_damage.value
  let mut reduced_damage = damage.to_double()
  
  // VITによる軽減 (1 VIT = 0.5% 軽減, 最大50%)
  let vit_red = defender.base_attributes.vitality.to_double() * 0.005
  let vit_reduction = if vit_red > 0.5 { 0.5 } else { vit_red }
  reduced_damage = reduced_damage * (1.0 - vit_reduction)
  
  // 属性耐性
  let resistance = match element {
    Physical => defender.element_resistance.physical
    Arcane => defender.element_resistance.arcane
    Fire => defender.element_resistance.fire
    Lightning => defender.element_resistance.lightning
    Holy => defender.element_resistance.holy
  }
  reduced_damage = reduced_damage * (1.0 - resistance)
  
  // 最小ダメージ保証
  let final_damage = if reduced_damage < 1.0 { 1 } else { reduced_damage.to_int() }
  Damage::{ value: final_damage }
}

// 最終ダメージ計算（JSバインディング用）
pub fn calculate_final_damage(
  base_damage: Damage,
  attacker_stats: CharacterStats,
  target_resistance: ElementResistance,
  is_critical: Bool
) -> Damage {
  let mut damage = base_damage.value.to_double()
  
  // クリティカル適用
  if is_critical {
    damage = damage * attacker_stats.critical_damage
  }
  
  // 耐性適用（物理ダメージと仮定）
  damage = damage * (1.0 - target_resistance.physical)
  
  // 最小ダメージ保証
  let final_damage = if damage < 1.0 { 1 } else { damage.to_int() }
  Damage::{ value: final_damage }
}