# UI レンダリングテストスクリプト

このスクリプトは、ゲームのUIを特定の状態でレンダリングして確認するためのツールです。

## 使い方

```bash
tsx scripts/render-ui.ts <state.json>
```

## サンプル状態ファイル

`sample-states/` ディレクトリに以下のサンプルファイルがあります：

### battle-view.json
戦闘画面の表示確認用。戦闘中の状態とログが含まれています。

```bash
tsx scripts/render-ui.ts scripts/sample-states/battle-view.json
```

### equipment-view.json
装備管理画面の表示確認用。複数のアイテムと装備が含まれています。

```bash
tsx scripts/render-ui.ts scripts/sample-states/equipment-view.json
```

### equipment-empty.json
装備管理画面の空の状態確認用。アイテムや装備がない状態です。

```bash
tsx scripts/render-ui.ts scripts/sample-states/equipment-empty.json
```

## 状態ファイルの形式

状態ファイルは以下の構造を持つJSONファイルです：

```json
{
  "session": {
    "player": {
      "class": "Warrior",
      "level": 1,
      "equipment": [],
      "skills": [],
      // ... その他のプレイヤー情報
    },
    "currentMonster": { /* オプション */ },
    // ... その他のセッション情報
  },
  "inventory": [ /* アイテムの配列 */ ],
  "battleLog": [ /* 戦闘ログイベントの配列 */ ],
  "battleStatus": {
    "isInBattle": false
  }
}
```

## 注意事項

- このスクリプトは開発時のUI確認専用です
- 実際のゲームロジックは動作しません（表示のみ）
- Tab キーでビューの切り替えができます
- Ctrl+C で終了します