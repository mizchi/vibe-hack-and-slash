/**
 * Moonbitアダプター
 * 既存のTypeScriptコードとMoonbitモジュールを繋ぐアダプター層
 */

import type { Item, BaseItem, ItemRarity, ItemId, Level, ItemModifier } from '../core/types.ts';

// Moonbit統合を有効にするかどうかのフラグ
export const ENABLE_MOONBIT_INTEGRATION = false;

// Moonbitモジュールのスタブ（実際の実装はMoonbitのJS出力に依存）
interface MoonbitModule {
  create_new_player(name: string, className: string): string;
  generate_item_for_js(name: string, level: number, rarity: string): string;
  get_item_name_js(itemJson: string): string;
  get_item_stats_js(itemJson: string): string[];
  calculate_damage_for_js(
    attackerJson: string,
    defenderResistanceJson: string,
    element: string,
    isSkill: boolean
  ): string;
  test_connection(): string;
  get_version(): string;
}

let moonbitModule: MoonbitModule | null = null;

// Moonbitモジュールのロード
async function loadMoonbitModule(): Promise<MoonbitModule | null> {
  if (!ENABLE_MOONBIT_INTEGRATION) {
    return null;
  }
  
  try {
    console.log('Moonbitモジュールのロードを試みています...');
    // 動的インポートを使用してMoonbitモジュールを読み込む
    const module = await import('../../moonbit/target/js/release/build/hacknslash.js');
    console.log('Moonbitモジュールが正常にロードされました');
    return module as MoonbitModule;
  } catch (error) {
    console.warn('Moonbitモジュールの読み込みに失敗しました:', error);
    return null;
  }
}

// 初期化
export async function initializeMoonbit(): Promise<void> {
  moonbitModule = await loadMoonbitModule();
}

/**
 * Moonbitを使用したアイテム生成
 */
export async function generateItemWithMoonbit(
  baseItemName: string,
  level: number,
  rarity: ItemRarity
): Promise<Item | null> {
  if (!moonbitModule) {
    return null;
  }

  try {
    // レアリティをMoonbitの文字列形式に変換
    const rarityStr = rarity;
    
    // Moonbitの関数を呼び出し
    const itemJson = moonbitModule.generate_item_for_js(
      baseItemName,
      level,
      rarityStr
    );
    
    // JSONをパースしてTypeScriptの型に変換
    const moonbitItem = JSON.parse(itemJson);
    
    // 簡易的な変換（実際の実装はMoonbitの出力形式に依存）
    const item: Item = {
      id: `item_${Date.now()}` as ItemId,
      baseItem: {
        id: `base_${baseItemName}` as ItemId,
        name: baseItemName,
        type: 'Weapon' as ItemType,
        tags: [],
        requiredLevel: 1 as Level,
        baseModifiers: []
      },
      rarity,
      level: level as Level,
      prefix: moonbitItem.prefix ? {
        name: moonbitItem.prefix.name,
        modifiers: convertMoonbitModifiers(moonbitItem.prefix.modifiers)
      } : undefined,
      suffix: moonbitItem.suffix ? {
        name: moonbitItem.suffix.name,
        modifiers: convertMoonbitModifiers(moonbitItem.suffix.modifiers)
      } : undefined
    };
    
    return item;
  } catch (error) {
    console.error('Moonbitアイテム生成エラー:', error);
    return null;
  }
}

/**
 * Moonbitのモディファイアを変換
 */
function convertMoonbitModifiers(moonbitModifiers: any[]): ItemModifier[] {
  if (!moonbitModifiers || !Array.isArray(moonbitModifiers)) {
    return [];
  }
  
  return moonbitModifiers.map(mod => {
    // Moonbitのモディファイア形式からTypeScriptの形式に変換
    // 実際の変換ロジックはMoonbitの出力形式に依存
    if (typeof mod === 'string') {
      // 文字列形式の場合の処理
      return { type: 'IncreaseDamage', value: 10 };
    }
    
    // オブジェクト形式の場合
    return mod as ItemModifier;
  });
}

/**
 * デバッグ用：Moonbit接続テスト
 */
export async function testMoonbitConnection(): Promise<boolean> {
  if (!moonbitModule) {
    await initializeMoonbit();
  }
  
  if (!moonbitModule) {
    return false;
  }
  
  try {
    const result = moonbitModule.test_connection();
    const parsed = JSON.parse(result);
    return parsed.status === 'connected';
  } catch (error) {
    return false;
  }
}

/**
 * デバッグ用：Moonbitバージョン取得
 */
export async function getMoonbitVersion(): Promise<string> {
  if (!moonbitModule) {
    return 'Moonbit not loaded';
  }
  
  try {
    return moonbitModule.get_version();
  } catch (error) {
    return 'Version unavailable';
  }
}