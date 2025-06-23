#!/usr/bin/env tsx
import { HeadlessGameEngine } from "../core/engine.ts";
import { CombatAnalyzer } from "../infra/combat-analyzer.ts";
import { createInitialPlayer } from "../core/session.ts";
import type { PlayerId, SessionId, Skill, ItemId, BaseItem } from "../core/types.ts";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// データ読み込み
import itemsData from "../../data/items.json" assert { type: "json" };
import monstersData from "../../data/monsters.json" assert { type: "json" };
import skillsData from "../../data/skills.json" assert { type: "json" };

// 評価設定
type EvaluationConfig = {
  runs: number;
  turnsPerRun: number;
  skillSets: Array<{
    name: string;
    skills: string[]; // skill IDs
  }>;
  showDetailedReport?: boolean;
};

// 評価結果
type EvaluationResult = {
  config: string;
  runs: number;
  averageTension: number;
  averageEquipmentImpact: number;
  survivalRate: number;
  insights: string[];
};

// 評価実行
async function runEvaluation(config: EvaluationConfig): Promise<EvaluationResult[]> {
  console.log("🎮 ゲームバランス評価開始");
  console.log(`設定: ${config.runs}回実行, 各${config.turnsPerRun}ターン`);
  console.log("");

  const baseItems = new Map<ItemId, BaseItem>(
    [...itemsData.weapons, ...itemsData.armors, ...itemsData.accessories].map(
      (item) => [item.id as ItemId, item as BaseItem]
    )
  );

  const results: EvaluationResult[] = [];

  // 各スキルセットで評価
  for (const skillSet of config.skillSets) {
    console.log(`\n📊 評価: ${skillSet.name}`);
    console.log("=".repeat(50));

    const skills = skillsData.skills.filter(s => 
      skillSet.skills.includes(s.id)
    ) as Skill[];

    let totalTension = 0;
    let totalEquipmentImpact = 0;
    let survivedRuns = 0;
    const detailedResults: any[] = [];

    // 複数回実行
    for (let i = 0; i < config.runs; i++) {
      const player = createInitialPlayer(`player_${i}` as PlayerId);
      player.skills = skills;
      
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
          tickInterval: 0,
          maxTurns: config.turnsPerRun,
          seed: Date.now() + i,
          autoEquip: true,
        }
      );

      // シミュレーション実行
      engine.runSync();

      // 分析
      const analyzer = new CombatAnalyzer(engine.getLogs(), engine.getSnapshots());
      const analysis = analyzer.analyze();

      totalTension += analysis.tension.tensionScore;
      totalEquipmentImpact += analysis.equipmentImpact.impactScore;
      
      if (engine.getSession().player.currentHealth > 0) {
        survivedRuns++;
      }

      detailedResults.push({
        runId: i,
        analysis,
        finalState: engine.getSession(),
      });

      // 詳細表示
      if (config.showDetailedReport && i === 0) {
        console.log("\n【初回実行の詳細分析】");
        printDetailedAnalysis(analysis);
      }
    }

    // 集計
    const avgTension = totalTension / config.runs;
    const avgEquipmentImpact = totalEquipmentImpact / config.runs;
    const survivalRate = survivedRuns / config.runs;

    console.log(`\n【集計結果】`);
    console.log(`平均緊張感スコア: ${avgTension.toFixed(1)}/100`);
    console.log(`平均装備影響度スコア: ${avgEquipmentImpact.toFixed(1)}/100`);
    console.log(`生存率: ${(survivalRate * 100).toFixed(1)}%`);

    // インサイト生成
    const insights = generateInsights(avgTension, avgEquipmentImpact, survivalRate, detailedResults);
    
    console.log("\n【インサイト】");
    insights.forEach(insight => console.log(`・${insight}`));

    results.push({
      config: skillSet.name,
      runs: config.runs,
      averageTension: avgTension,
      averageEquipmentImpact: avgEquipmentImpact,
      survivalRate,
      insights,
    });
  }

  // 比較分析
  if (results.length > 1) {
    console.log("\n\n📊 スキルセット比較");
    console.log("=".repeat(50));
    compareResults(results);
  }

  return results;
}

// 詳細分析の表示
function printDetailedAnalysis(analysis: any) {
  console.log("\n緊張感分析:");
  console.log(`  - 平均HP割合: ${(analysis.tension.averageHealthRatio * 100).toFixed(1)}%`);
  console.log(`  - 瀕死回数: ${analysis.tension.nearDeathMoments}`);
  console.log(`  - HP変動性: ${analysis.tension.healthVolatility.toFixed(3)}`);
  console.log(`  - 危機的瞬間: ${analysis.tension.criticalTurns}`);
  console.log(`  - 逆転の瞬間: ${analysis.tension.comebackMoments}`);

  console.log("\n装備影響度分析:");
  console.log(`  - 戦闘力成長率: ${(analysis.equipmentImpact.powerGrowthRate * 100).toFixed(1)}%`);
  console.log(`  - 装備変更回数: ${analysis.equipmentImpact.equipmentChanges}`);
  console.log(`  - ビルド多様性: ${analysis.equipmentImpact.buildDiversity.toFixed(1)}%`);
  console.log(`  - 状況適応性: ${analysis.equipmentImpact.adaptability.toFixed(1)}%`);

  console.log("\n戦闘フロー:");
  analysis.combatFlow.phasesIdentified.forEach((phase: any) => {
    console.log(`  - ${phase.type}期 (Turn ${phase.startTurn}-${phase.endTurn}): ${phase.characteristics.join(", ")}`);
  });

  console.log("\nパワースパイク:");
  analysis.combatFlow.powerSpikes.slice(0, 5).forEach((spike: any) => {
    console.log(`  - Turn ${spike.turn}: ${spike.type} (強度: ${spike.magnitude.toFixed(2)})`);
  });

  if (analysis.recommendations.length > 0) {
    console.log("\n推奨事項:");
    analysis.recommendations.forEach((rec: any) => console.log(`  - ${rec}`));
  }
}

// インサイト生成
function generateInsights(
  avgTension: number,
  avgEquipmentImpact: number,
  survivalRate: number,
  detailedResults: any[]
): string[] {
  const insights: string[] = [];

  // 緊張感評価
  if (avgTension > 70) {
    insights.push("優れた戦闘緊張感 - プレイヤーは常に注意深くプレイする必要があります");
  } else if (avgTension > 50) {
    insights.push("適度な戦闘緊張感 - バランスの取れた難易度です");
  } else {
    insights.push("低い戦闘緊張感 - より挑戦的な要素が必要かもしれません");
  }

  // 装備影響度評価
  if (avgEquipmentImpact > 70) {
    insights.push("装備更新の手応えが大きい - プレイヤーの成長実感が得られます");
  } else if (avgEquipmentImpact > 50) {
    insights.push("装備更新の効果は適度 - さらなる装備の差別化余地があります");
  } else {
    insights.push("装備更新の影響が小さい - アイテムシステムの見直しが必要です");
  }

  // 生存率評価
  if (survivalRate < 0.3) {
    insights.push("高難度 - カジュアルプレイヤーには厳しいかもしれません");
  } else if (survivalRate > 0.8) {
    insights.push("低難度 - 熟練プレイヤーには物足りないかもしれません");
  } else {
    insights.push("バランスの良い生存率 - 幅広いプレイヤーに適しています");
  }

  // 詳細分析から追加インサイト
  const avgNearDeath = detailedResults.reduce((sum, r) => 
    sum + r.analysis.tension.nearDeathMoments, 0
  ) / detailedResults.length;

  if (avgNearDeath > 2) {
    insights.push("頻繁な瀕死状態 - スリリングな体験を提供します");
  }

  const avgEquipChanges = detailedResults.reduce((sum, r) => 
    sum + r.analysis.equipmentImpact.equipmentChanges, 0
  ) / detailedResults.length;

  if (avgEquipChanges > 5) {
    insights.push("活発な装備更新 - プレイヤーは常に新しい選択肢を検討します");
  }

  return insights;
}

// 結果比較
function compareResults(results: EvaluationResult[]) {
  // 最高スコアの構成を特定
  const bestTension = results.reduce((best, r) => 
    r.averageTension > best.averageTension ? r : best
  );
  
  const bestEquipment = results.reduce((best, r) => 
    r.averageEquipmentImpact > best.averageEquipmentImpact ? r : best
  );

  console.log(`\n最高緊張感: ${bestTension.config} (${bestTension.averageTension.toFixed(1)}/100)`);
  console.log(`最高装備影響度: ${bestEquipment.config} (${bestEquipment.averageEquipmentImpact.toFixed(1)}/100)`);

  // 総合評価
  console.log("\n総合評価:");
  results.forEach(r => {
    const totalScore = (r.averageTension + r.averageEquipmentImpact) / 2;
    console.log(`${r.config}: ${totalScore.toFixed(1)}/100 (緊張感: ${r.averageTension.toFixed(1)}, 装備: ${r.averageEquipmentImpact.toFixed(1)}, 生存率: ${(r.survivalRate * 100).toFixed(1)}%)`);
  });
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    console.log("🎮 ゲームシステム総合評価");
    console.log("=".repeat(70));
    
    // ステップ1: ユニットテスト実行
    console.log("\n📋 ステップ1: 戦闘システムユニットテスト");
    console.log("-".repeat(70));
    
    try {
      const { stdout } = await execAsync('npm run test:battle');
      console.log(stdout);
      console.log("\n✅ 全てのテストに成功しました！");
    } catch (error: any) {
      console.error("\n❌ テストに失敗しました。バランス評価を中止します。");
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
      process.exit(1);
    }
    
    // ステップ2: バランス評価
    console.log("\n📊 ステップ2: ゲームバランス評価");
    console.log("-".repeat(70));
    
    const config: EvaluationConfig = {
      runs: 20,
      turnsPerRun: 200,
      skillSets: [
        {
          name: "バランス型（ファイアボール＋ヒール＋緊急治療）",
          skills: ["fireball", "heal", "emergency_heal"],
        },
        {
          name: "攻撃特化（ファイアボール＋パワーストライク＋処刑）",
          skills: ["fireball", "power_strike", "execute"],
        },
        {
          name: "生存重視（ヒール＋緊急治療＋ブラッドドレイン）",
          skills: ["heal", "emergency_heal", "blood_drain"],
        },
        {
          name: "コンボ型（クリティカルバースト＋処刑＋瞑想）",
          skills: ["critical_burst", "execute", "meditation"],
        },
      ],
      showDetailedReport: true,
    };
    
    await runEvaluation(config);
    
    console.log("\n✅ 評価完了！");
  }
  
  main().catch(console.error);
}