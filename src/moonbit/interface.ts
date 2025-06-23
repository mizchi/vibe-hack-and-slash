/**
 * Moonbit JavaScript バインディングインターフェース
 * MoonbitからコンパイルされたJavaScriptモジュールとの連携層
 */

// Moonbitから生成されるモジュールの型定義
export interface MoonbitModule {
  // プレイヤー管理
  create_new_player(name: string, className: string): string;
  
  // ダメージ計算
  calculate_damage_for_js(
    attackerJson: string,
    defenderResistanceJson: string,
    element: string,
    isSkill: boolean
  ): string;
  
  // アイテム生成
  generate_item_for_js(name: string, level: number, rarity: string): string;
  get_item_name_js(itemJson: string): string;
  get_item_stats_js(itemJson: string): string[];
  
  // バトルイベント
  on_battle_event(eventType: string, data: string): string;
  
  // セッション管理
  create_session(playerJson: string): string;
  update_session(sessionId: string, action: string): string;
  
  // ステータス計算
  calculate_player_stats(playerJson: string): string;
  
  // ルートテーブル
  generate_loot_table(monsterTier: string, level: number): string;
  
  // ユーティリティ
  get_version(): string;
  test_connection(): string;
}

// Moonbitモジュールのロード（実際のパスは環境に応じて調整）
export async function loadMoonbitModule(): Promise<MoonbitModule | null> {
  try {
    // Moonbitから生成されたJavaScriptファイルをインポート
    // 実際のパスは、Moonbitのビルド出力に応じて調整が必要
    const module = await import('../../moonbit/target/js/release/hacknslash.js');
    return module as MoonbitModule;
  } catch (error) {
    console.warn('Moonbitモジュールの読み込みに失敗しました:', error);
    return null;
  }
}

// エレメントタイプのマッピング
export const ElementTypeMapping = {
  physical: 'Physical',
  arcane: 'Arcane',
  fire: 'Fire',
  lightning: 'Lightning',
  holy: 'Holy'
} as const;

// レアリティのマッピング
export const RarityMapping = {
  common: 'Common',
  magic: 'Magic',
  rare: 'Rare',
  legendary: 'Legendary'
} as const;

// プレイヤークラスのマッピング
export const PlayerClassMapping = {
  warrior: 'Warrior',
  mage: 'Mage',
  rogue: 'Rogue',
  paladin: 'Paladin'
} as const;