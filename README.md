# Hack & Slash CLI Game

React Inkで実装されたターミナルベースのハックアンドスラッシュゲーム。

## 特徴

- 自動進行バトルシステム
- Diablo風のPrefix/Suffixアイテムシステム
- マナとスキルシステム
- 動的なスキル発動条件
- ヘッドレスシミュレーション機能
- AI による自動評価システム

## セットアップ

```bash
# 依存関係のインストール
npm install

# ゲームの実行
npm start

# 開発モード
npm run dev
```

## ゲームプレイ

- **スペース**: 一時停止/再開
- **I**: インベントリ開閉
- **↑↓**: アイテム選択
- **Enter**: アイテム装備
- **Ctrl+C**: 終了

## 評価システム

### 1. シミュレーション実行

```bash
npm run simulate
```

50回のゲームを自動実行し、統計情報を収集します。

### 2. 戦闘評価

```bash
npm run evaluate
```

異なるスキルセットで戦闘を評価し、以下を分析：
- 戦闘の緊張感（瀕死回数、HP変動など）
- 装備更新の影響度（成長率、ビルド多様性など）

### 3. AI評価

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
├── core/       # 純粋なドメインロジック
│   ├── types.ts      # 型定義
│   ├── combat.ts     # 戦闘システム
│   ├── skills.ts     # スキルシステム
│   ├── loot.ts       # アイテムシステム
│   ├── session.ts    # ゲームセッション
│   └── engine.ts     # ヘッドレスエンジン
├── infra/      # インフラストラクチャ
│   ├── analyzer.ts         # ログ分析
│   └── combat-analyzer.ts  # 戦闘分析
└── app/        # アプリケーション層
    ├── index.tsx    # エントリーポイント
    ├── Game.tsx     # メインゲームUI
    ├── simulate.ts  # シミュレーター
    └── evaluate.ts  # 評価システム

data/           # マスターデータ
├── items.json      # アイテム定義
├── monsters.json   # モンスター定義
└── skills.json     # スキル定義

scripts/        # ユーティリティスクリプト
└── evaluate-battle.ts  # AI評価スクリプト
```

## 開発ガイドライン

CLAUDE.md に記載された関数型プログラミングのガイドラインに従ってください：
- 純粋関数の使用
- Result型によるエラーハンドリング
- ブランド型による型安全性
- React InkでのCtrl-Cハンドリング