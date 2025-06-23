# Hack & Slash CLI Game

React Ink で実装されたターミナルベースのハックアンドスラッシュゲーム。

## 特徴

- 自動進行バトルシステム
- Diablo 風の Prefix/Suffix アイテムシステム
- マナとスキルシステム
- 動的なスキル発動条件
- ヘッドレスシミュレーション機能
- AI による自動評価システム
- 4 つの職業（Warrior/Mage/Rogue/Paladin）
- 職業別の初期装備と専用スキル
- 武器タイプごとの専用スキル
- ゲームスピード調整機能
- **Moonbit 統合**: コアロジックを Moonbit で実装（実験的機能）

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# ゲームの実行
pnpm start

# 開発モード
pnpm run dev
```

## ゲームプレイ

### 基本操作

- **Tab**: 戦闘詳細/装備管理画面の切り替え
- **Space**: ゲームスピード変更（x0/x1/x3/x5）
- **P**: 一時停止/再開
- **R**: 休憩（HP/MP 全回復）
- **Ctrl+C**: 終了

### 戦闘詳細画面

- **↑↓**: 戦闘ログ選択
- **←→**: ログフィルター切り替え
- **Enter**: ログ詳細表示
- **Esc**: 詳細を閉じる

### 装備管理画面

- **↑↓**: アイテム選択
- **←→**: インベントリタブ切り替え（新着/武器/防具/装飾/全て）
- **Enter**: アイテム装備
- **Delete**: アイテム売却

## 評価システム

### 1. シミュレーション実行

```bash
npm run simulate
```

50 回のゲームを自動実行し、統計情報を収集します。

### 2. 戦闘評価

```bash
npm run evaluate
```

異なるスキルセットで戦闘を評価し、以下を分析：

- 戦闘の緊張感（瀕死回数、HP 変動など）
- 装備更新の影響度（成長率、ビルド多様性など）

### 3. AI 評価

```bash
# 環境変数を設定
export ANTHROPIC_API_KEY='your-api-key-here'

# AI評価を実行
npm run evaluate:ai

# 既存のレポートから評価
npm run evaluate:ai -- --file reports/evaluation-2024-01-01.txt
```

Claude がゲームの面白さをプレイヤー視点で評価します。

## プロジェクト構造

```
src/
├── core/             # 純粋なドメインロジック
│   ├── types.ts      # 型定義（ブランド型）
│   ├── combat.ts     # 戦闘システム
│   ├── skills.ts     # スキルシステム
│   ├── damage.ts     # ダメージ計算
│   ├── loot.ts       # アイテムシステム
│   ├── session.ts    # ゲームセッション
│   └── engine.ts     # ヘッドレスエンジン
├── moonbit/          # Moonbit統合
│   ├── adapter.ts    # TypeScript-Moonbitアダプター
│   ├── interface.ts  # Moonbitモジュール型定義
│   └── integration-guide.md  # 統合ガイド
├── schemas/          # Zodスキーマ定義
│   ├── item-schema.ts
│   ├── skill-schema.ts
│   └── monster-schema.ts
├── infra/            # インフラストラクチャ
│   ├── analyzer.ts         # ログ分析
│   └── combat-analyzer.ts  # 戦闘分析
└── app/              # アプリケーション層
    ├── index.tsx     # エントリーポイント
    ├── Game.tsx      # メインゲームUI
    ├── simulate.ts   # シミュレーター
    ├── evaluate.ts   # 評価システム
    ├── components/   # UIコンポーネント
    │   ├── BattleDetailView.tsx
    │   ├── EquipmentDetailView.tsx
    │   └── CommonHeader.tsx
    └── hooks/        # カスタムフック
        └── useSelection.ts

data/                 # マスターデータ（JSON Schema付き）
├── items.json        # アイテム定義
├── monsters.json     # モンスター定義
├── skills.json       # スキル定義
├── starter-equipment.json  # 職業別初期装備
└── class-skills.json       # 職業別スキル

moonbit/              # Moonbitソースコード
├── src/
│   ├── types.mbt     # 型定義
│   ├── damage.mbt    # ダメージ計算
│   ├── loot.mbt      # アイテム生成
│   ├── js_bindings.mbt  # JavaScript連携
│   └── moon.pkg.json    # パッケージ設定
└── target/           # ビルド出力
    └── js/release/build/
        ├── hacknslash.js    # 生成されたJSモジュール
        └── hacknslash.d.ts  # TypeScript型定義

schemas/              # JSON Schema定義
├── items.schema.json
├── skills.schema.json
└── monsters.schema.json

scripts/              # ユーティリティスクリプト
├── evaluate-battle.ts  # AI評価スクリプト
├── check-schema.ts     # スキーマ検証
└── generate-schemas.ts # JSON Schema生成
```

## 開発ガイドライン

CLAUDE.md に記載された関数型プログラミングのガイドラインに従ってください：

- 純粋関数の使用
- Result 型によるエラーハンドリング
- ブランド型による型安全性
- React Ink での Ctrl-C ハンドリング

### Moonbit 統合

実験的機能として、コアロジックの一部を Moonbit で実装しています：

```bash
# Moonbitのビルド
cd moonbit && moon build --target js

# 統合テストの実行
deno run --allow-read --allow-net src/moonbit/test-integration.ts
```

Moonbit 統合を有効/無効にするには、`src/moonbit/adapter.ts`の`ENABLE_MOONBIT_INTEGRATION`フラグを変更してください。

### データ検証

```bash
# Zodスキーマでデータ検証
npm run check:schema

# JSON Schemaを再生成
npm run generate:schemas
```

### コード品質

```bash
# 型チェック
npm run typecheck

# リンティング
npm run lint

# フォーマット
npm run format
```

## 職業システム

### Warrior（戦士）

- 高 HP、高攻撃力、中防御力
- 初期装備：剣、盾、チェインメイル
- 専用スキル：バーサーカーレイジ、シールドバッシュ

### Mage（魔法使い）

- 低 HP、低攻撃力、高 MP、高スキルパワー
- 初期装備：杖、ローブ、アミュレット
- 専用スキル：マナシールド、アーケインインテレクト

### Rogue（盗賊）

- 中 HP、中攻撃力、高クリティカル率
- 初期装備：ダガー、レザーアーマー、ブーツ
- 専用スキル：シャドウストライク、回避

### Paladin（聖騎士）

- 高 HP、中攻撃力、高防御力
- 初期装備：メイス、盾、チェインメイル
- 専用スキル：ホーリーライト、ディバインシールド
