#!/usr/bin/env tsx
import { HeadlessGameEngine } from "../core/engine.ts";
import { GameLogAnalyzer } from "../infra/analyzer.ts";
import { createInitialPlayer } from "../core/session.ts";
import type { PlayerId, SessionId, ItemId, BaseItem } from "../core/types.ts";

// データ読み込み
import itemsData from "../../data/items.json" assert { type: "json" };
import monstersData from "../../data/monsters.json" assert { type: "json" };

// シミュレーション設定
type SimulationConfig = {
  runs: number;
  turnsPerRun: number;
  seed?: number;
  showDetails?: boolean;
  scenarios?: ScenarioConfig[];
};

type ScenarioConfig = {
  name: string;
  description: string;
  playerModifiers?: {
    levelBoost?: number;
    damageMultiplier?: number;
    healthMultiplier?: number;
  };
  itemDropRateMultiplier?: number;
  monsterDifficultyMultiplier?: number;
};

// シミュレーション実行
async function runSimulation(config: SimulationConfig) {
  console.log("🎮 ゲームシミュレーション開始");
  console.log(`設定: ${config.runs}回実行, 各${config.turnsPerRun}ターン`);
  console.log("");

  // アイテムデータ準備
  const baseItems = new Map<ItemId, BaseItem>(
    [...itemsData.weapons, ...itemsData.armors, ...itemsData.accessories].map(
      (item) => [item.id as ItemId, item as BaseItem]
    )
  );

  const results: any[] = [];

  // 通常シミュレーション
  for (let i = 0; i < config.runs; i++) {
    const seed = config.seed ? config.seed + i : Date.now() + i;
    const player = createInitialPlayer(`player_${i}` as PlayerId);
    const session = {
      id: `session_${i}` as SessionId,
      player,
      defeatedCount: 0,
      wave: 1,
      state: "InProgress" as const,
      startedAt: new Date(),
    };

    const engine = new HeadlessGameEngine(
      session,
      baseItems,
      monstersData.monsters,
      {
        tickInterval: 0, // 最速実行
        maxTurns: config.turnsPerRun,
        seed,
        autoEquip: true,
      }
    );

    // 実行
    engine.runSync();

    // 分析
    const analyzer = new GameLogAnalyzer(engine.getLogs(), engine.getSnapshots());
    const analysis = analyzer.analyze();
    
    results.push({
      runId: i,
      seed,
      analysis,
      stats: engine.getStats(),
    });

    if (config.showDetails) {
      console.log(`Run ${i + 1}:`, analyzer.generateReport());
    }
  }

  // 集計統計
  generateAggregateReport(results);

  // シナリオ実行
  if (config.scenarios) {
    console.log("\n📊 シナリオ分析");
    for (const scenario of config.scenarios) {
      await runScenario(scenario, config, baseItems);
    }
  }
}

// シナリオ実行
async function runScenario(
  scenario: ScenarioConfig,
  config: SimulationConfig,
  baseItems: Map<string, any>
) {
  console.log(`\n### ${scenario.name}`);
  console.log(scenario.description);

  const results: any[] = [];

  for (let i = 0; i < 10; i++) { // 各シナリオ10回実行
    const player = createInitialPlayer(`scenario_player_${i}` as PlayerId);
    
    // シナリオ修正を適用
    if (scenario.playerModifiers) {
      if (scenario.playerModifiers.levelBoost) {
        player.level = (player.level + scenario.playerModifiers.levelBoost) as any;
      }
      if (scenario.playerModifiers.damageMultiplier) {
        player.baseStats.baseDamage = (player.baseStats.baseDamage * scenario.playerModifiers.damageMultiplier) as any;
      }
      if (scenario.playerModifiers.healthMultiplier) {
        player.baseStats.maxHealth = (player.baseStats.maxHealth * scenario.playerModifiers.healthMultiplier) as any;
        player.currentHealth = player.baseStats.maxHealth;
      }
    }

    const session = {
      id: `scenario_session_${i}` as SessionId,
      player,
      defeatedCount: 0,
      wave: 1,
      state: "InProgress" as const,
      startedAt: new Date(),
    };

    const baseItemsMap = new Map<ItemId, BaseItem>(
      Array.from(baseItems).map(([id, item]) => [id as ItemId, item])
    );
    
    const engine = new HeadlessGameEngine(
      session,
      baseItemsMap,
      monstersData.monsters,
      {
        tickInterval: 0,
        maxTurns: 200,
        autoEquip: true,
      }
    );

    engine.runSync();
    
    const stats = engine.getStats();
    results.push({
      survived: engine.getSession().state !== "Completed",
      turnsLasted: engine.getTurn(),
      monstersDefeated: stats.monstersDefeated,
      finalLevel: engine.getSession().player.level,
    });
  }

  // シナリオ結果集計
  const survivalRate = results.filter(r => r.survived).length / results.length;
  const avgTurns = results.reduce((sum, r) => sum + r.turnsLasted, 0) / results.length;
  const avgKills = results.reduce((sum, r) => sum + r.monstersDefeated, 0) / results.length;

  console.log(`生存率: ${(survivalRate * 100).toFixed(1)}%`);
  console.log(`平均生存ターン: ${avgTurns.toFixed(1)}`);
  console.log(`平均撃破数: ${avgKills.toFixed(1)}`);
}

// 集計レポート生成
function generateAggregateReport(results: any[]) {
  console.log("\n📈 集計統計");
  console.log("=".repeat(50));

  // 生存率
  const survivedCount = results.filter(r => r.analysis.summary.survived).length;
  console.log(`生存率: ${(survivedCount / results.length * 100).toFixed(1)}%`);

  // 平均統計
  const avgStats = {
    turns: 0,
    level: 0,
    kills: 0,
    damage: 0,
    items: 0,
    legendaryItems: 0,
  };

  results.forEach(r => {
    avgStats.turns += r.analysis.summary.totalTurns;
    avgStats.level += r.analysis.summary.finalLevel;
    avgStats.kills += r.analysis.summary.monstersDefeated;
    avgStats.damage += r.analysis.combatAnalysis.totalDamageDealt;
    avgStats.items += r.analysis.itemAnalysis.totalItemsDropped;
    avgStats.legendaryItems += r.analysis.itemAnalysis.itemsByRarity.Legendary || 0;
  });

  (Object.keys(avgStats) as Array<keyof typeof avgStats>).forEach(key => {
    avgStats[key] /= results.length;
  });

  console.log(`平均ターン数: ${avgStats.turns.toFixed(1)}`);
  console.log(`平均最終レベル: ${avgStats.level.toFixed(1)}`);
  console.log(`平均撃破数: ${avgStats.kills.toFixed(1)}`);
  console.log(`平均総ダメージ: ${avgStats.damage.toFixed(0)}`);
  console.log(`平均アイテム獲得数: ${avgStats.items.toFixed(1)}`);
  console.log(`レジェンダリー獲得率: ${(avgStats.legendaryItems * 100).toFixed(1)}%`);

  // バランス指標
  console.log("\n⚖️ ゲームバランス指標");
  const balanceScore = calculateBalanceScore(results);
  console.log(`総合バランススコア: ${balanceScore.toFixed(2)}/10`);

  // 問題点の検出
  const issues = detectBalanceIssues(results);
  if (issues.length > 0) {
    console.log("\n⚠️ 検出された問題:");
    issues.forEach(issue => console.log(`- ${issue}`));
  }
}

// バランススコア計算
function calculateBalanceScore(results: any[]): number {
  let score = 0;
  
  // 生存率（理想: 30-70%）
  const survivalRate = results.filter(r => r.analysis.summary.survived).length / results.length;
  if (survivalRate >= 0.3 && survivalRate <= 0.7) {
    score += 2.5;
  } else {
    score += 2.5 * (1 - Math.abs(survivalRate - 0.5) * 2);
  }

  // 進行の一貫性（標準偏差が小さいほど良い）
  const turns = results.map(r => r.analysis.summary.totalTurns);
  const avgTurns = turns.reduce((a, b) => a + b) / turns.length;
  const stdDev = Math.sqrt(
    turns.reduce((sum, t) => sum + Math.pow(t - avgTurns, 2), 0) / turns.length
  );
  const consistencyScore = Math.max(0, 1 - stdDev / avgTurns);
  score += consistencyScore * 2.5;

  // アイテムドロップバランス
  const avgLegendaryRate = results.reduce((sum, r) => 
    sum + (r.analysis.itemAnalysis.itemsByRarity.Legendary || 0) / 
    r.analysis.itemAnalysis.totalItemsDropped, 0
  ) / results.length;
  // レジェンダリーは1-5%が理想
  if (avgLegendaryRate >= 0.01 && avgLegendaryRate <= 0.05) {
    score += 2.5;
  } else {
    score += 2.5 * Math.max(0, 1 - Math.abs(avgLegendaryRate - 0.03) * 20);
  }

  // 難易度カーブ（レベルと生存ターンの相関）
  const correlation = calculateCorrelation(
    results.map(r => r.analysis.summary.finalLevel),
    results.map(r => r.analysis.summary.totalTurns)
  );
  score += Math.abs(correlation) * 2.5; // 強い相関があるほど良い

  return Math.min(10, score);
}

// 相関係数計算
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return den === 0 ? 0 : num / den;
}

// バランス問題検出
function detectBalanceIssues(results: any[]): string[] {
  const issues: string[] = [];
  
  const survivalRate = results.filter(r => r.analysis.summary.survived).length / results.length;
  if (survivalRate < 0.2) {
    issues.push("ゲームが難しすぎる（生存率20%未満）");
  } else if (survivalRate > 0.8) {
    issues.push("ゲームが簡単すぎる（生存率80%超）");
  }

  const avgCritRate = results.reduce((sum, r) => 
    sum + r.analysis.combatAnalysis.criticalHitRate, 0
  ) / results.length;
  if (avgCritRate < 0.05) {
    issues.push("クリティカル率が低すぎる（5%未満）");
  }

  const avgDamageEfficiency = results.reduce((sum, r) => 
    sum + r.analysis.combatAnalysis.damageEfficiency, 0
  ) / results.length;
  if (avgDamageEfficiency < 1.0) {
    issues.push("プレイヤーの火力が不足（受けるダメージより与えるダメージが少ない）");
  }

  return issues;
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: SimulationConfig = {
    runs: 50,
    turnsPerRun: 300,
    showDetails: false,
    scenarios: [
      {
        name: "高レベルスタート",
        description: "レベル5からスタートした場合の生存率",
        playerModifiers: { levelBoost: 4 },
      },
      {
        name: "高火力ビルド",
        description: "攻撃力2倍での戦闘効率",
        playerModifiers: { damageMultiplier: 2 },
      },
      {
        name: "タンクビルド",
        description: "体力2倍での生存性",
        playerModifiers: { healthMultiplier: 2 },
      },
    ],
  };

  runSimulation(config).catch(console.error);
}