// JavaScript バインディング
// MoonbitからJavaScriptへのエクスポートを定義

// JSON変換ユーティリティ
pub fn player_to_json(player : Player) -> String {
  // TODO: 実際のJSON変換実装
  // 今はダミー実装
  "{\"id\": \"" + player.id.value + "\", \"name\": \"" + player.name + "\"}"
}

pub fn item_to_json(item : Item) -> String {
  let rarity_str = match item.rarity {
    Common => "Common"
    Magic => "Magic"
    Rare => "Rare"
    Legendary => "Legendary"
  }
  
  "{\"id\": \"" + item.id.value + "\", \"rarity\": \"" + rarity_str + "\"}"
}

// JavaScriptから呼び出される関数
// エクスポート時に @js.export デコレータを使用
pub fn create_new_player(name : String, class_name : String) -> String {
  let player = create_player(name, class_name)
  player_to_json(player)
}

pub fn calculate_damage_for_js(
  attacker_json : String,
  defender_resistance_json : String,
  element : String,
  is_skill : Bool
) -> String {
  // TODO: JSONパース実装
  // 今はダミー実装
  let _ = attacker_json
  let _ = defender_resistance_json
  let _ = element
  let _ = is_skill
  "{\"damage\": 100, \"is_critical\": false}"
}

// アイテム生成のJSバインディング
pub fn generate_item_for_js(
  base_item_name : String,
  level : Int,
  rarity : String
) -> String {
  let item = generate_item_js(base_item_name, level, rarity)
  item_to_json(item)
}

// イベントハンドラー
pub fn on_battle_event(event_type : String, data : String) -> String {
  match event_type {
    "player_attack" => handle_player_attack(data)
    "monster_attack" => handle_monster_attack(data)
    "skill_use" => handle_skill_use(data)
    _ => "{\"error\": \"Unknown event type\"}"
  }
}

fn handle_player_attack(data : String) -> String {
  // TODO: 実装
  let _ = data
  "{\"result\": \"attack_processed\"}"
}

fn handle_monster_attack(data : String) -> String {
  // TODO: 実装
  let _ = data
  "{\"result\": \"monster_attack_processed\"}"
}

fn handle_skill_use(data : String) -> String {
  // TODO: 実装
  let _ = data
  "{\"result\": \"skill_processed\"}"
}

// セッション管理
pub fn create_session(player_json : String) -> String {
  // TODO: JSONからPlayerをパース
  let _ = player_json
  "{\"session_id\": \"session_123\", \"state\": \"InProgress\"}"
}

pub fn update_session(session_id : String, action : String) -> String {
  let _ = session_id
  match action {
    "pause" => "{\"state\": \"Paused\"}"
    "resume" => "{\"state\": \"InProgress\"}"
    "complete" => "{\"state\": \"Completed\"}"
    _ => "{\"error\": \"Invalid action\"}"
  }
}

// ステータス計算のエクスポート
pub fn calculate_player_stats(player_json : String) -> String {
  // TODO: 実装
  let _ = player_json
  "{\"max_health\": 100, \"base_damage\": 10, \"critical_chance\": 0.05}"
}

// ルートテーブル生成
pub fn generate_loot_table(monster_tier : String, level : Int) -> String {
  let tier = match monster_tier {
    "Common" => MonsterTier::Common
    "Elite" => MonsterTier::Elite
    "Rare" => MonsterTier::Rare
    "Boss" => MonsterTier::Boss
    "Legendary" => MonsterTier::Legendary
    _ => MonsterTier::Common
  }
  let _ = tier
  let _ = level
  
  // TODO: 実際のルートテーブル生成
  "[{\"item_id\": \"sword_01\", \"drop_chance\": 0.1}]"
}

// デバッグ用関数
pub fn get_version() -> String {
  "Moonbit HackNSlash v0.1.0"
}

pub fn test_connection() -> String {
  let rand = @random.Rand::new()
  "{\"status\": \"connected\", \"timestamp\": \"" + rand.int().to_string() + "\"}"
}