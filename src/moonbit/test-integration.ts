/**
 * Moonbit統合テストスクリプト
 */

import { initializeMoonbit, testMoonbitConnection, getMoonbitVersion, generateItemWithMoonbit } from './adapter.ts';
import { BaseItem, ItemId } from '../core/types.ts';

async function testMoonbitIntegration() {
  console.log('=== Moonbit統合テスト開始 ===\n');

  // 1. Moonbitの初期化
  console.log('1. Moonbitモジュールを初期化中...');
  await initializeMoonbit();

  // 2. 接続テスト
  console.log('\n2. 接続テスト実行中...');
  const isConnected = await testMoonbitConnection();
  console.log(`接続状態: ${isConnected ? '成功' : '失敗'}`);

  // 3. バージョン確認
  console.log('\n3. バージョン情報取得中...');
  const version = await getMoonbitVersion();
  console.log(`Moonbitバージョン: ${version}`);

  // 4. アイテム生成テスト
  if (isConnected) {
    console.log('\n4. アイテム生成テスト実行中...');
    
    const testBaseItem: BaseItem = {
      id: 'sword_01' as ItemId,
      name: 'Iron Sword',
      type: 'Weapon' as ItemType,
      tags: ['Sword' as ItemTag],
      requiredLevel: 1 as Level,
      baseModifiers: []
    };

    // 異なるレアリティでアイテムを生成
    const rarities = ['Common', 'Magic', 'Rare', 'Legendary'] as const;
    
    for (const rarity of rarities) {
      console.log(`\n生成中: ${rarity} アイテム`);
      const item = await generateItemWithMoonbit(testBaseItem.name, 10, rarity);
      
      if (item) {
        console.log(`- ID: ${item.id}`);
        console.log(`- ベースアイテム: ${item.baseItem.name}`);
        console.log(`- レアリティ: ${item.rarity}`);
        console.log(`- レベル: ${item.level}`);
        if (item.prefix) console.log(`- プレフィックス: ${item.prefix.name}`);
        if (item.suffix) console.log(`- サフィックス: ${item.suffix.name}`);
      } else {
        console.log('アイテム生成に失敗しました');
      }
    }
  }

  console.log('\n=== テスト完了 ===');
}

// テスト実行
testMoonbitIntegration().catch(console.error);