import type { LogEntry, GameSnapshot } from "../core/engine.ts";
import type { BattleEvent, Item, CharacterStats } from "../core/types.ts";
import { calculateTotalStats } from "../core/combat.ts";

// 戦闘緊張感の評価指標
export type TensionMetrics = {
  averageHealthRatio: number; // 平均HP割合
  nearDeathMoments: number; // 瀕死回数
  healthVolatility: number; // HP変動の激しさ
  criticalTurns: number; // 危機的な瞬間の数
  comebackMoments: number; // 逆転の瞬間
  tensionScore: number; // 総合緊張感スコア (0-100)
};

// 装備影響度の評価指標
export type EquipmentImpactMetrics = {
  powerGrowthRate: number; // 戦闘力の成長率
  equipmentChanges: number; // 装備変更回数
  statImprovements: Array<{
    turn: number;
    statChange: Partial<CharacterStats>;
    impact: number;
  }>;
  buildDiversity: number; // ビルドの多様性スコア
  adaptability: number; // 状況適応性スコア
  impactScore: number; // 総合影響度スコア (0-100)
};

// 戦闘詳細分析
export type CombatDetails = {
  tension: TensionMetrics;
  equipmentImpact: EquipmentImpactMetrics;
  combatFlow: CombatFlowAnalysis;
  recommendations: string[];
};

export type CombatFlowAnalysis = {
  phasesIdentified: Array<{
    startTurn: number;
    endTurn: number;
    type: "early" | "mid" | "late";
    characteristics: string[];
  }>;
  difficultyProgression: Array<{
    turn: number;
    difficulty: number;
    reason: string;
  }>;
  powerSpikes: Array<{
    turn: number;
    type: "equipment" | "level" | "skill";
    magnitude: number;
  }>;
};

export class CombatAnalyzer {
  constructor(
    private logs: LogEntry[],
    private snapshots: GameSnapshot[]
  ) {}

  // 戦闘緊張感の分析
  analyzeTension(): TensionMetrics {
    let nearDeathMoments = 0;
    let criticalTurns = 0;
    let comebackMoments = 0;
    const healthRatios: number[] = [];
    
    let previousHealthRatio = 1;
    let wasInDanger = false;
    
    this.logs.forEach((log, i) => {
      const currentHealthRatio = log.sessionState.playerHealth / log.sessionState.playerMaxHealth;
      healthRatios.push(currentHealthRatio);
      
      // 瀕死判定（HP 20%以下）
      if (currentHealthRatio <= 0.2 && currentHealthRatio > 0) {
        if (!wasInDanger) {
          nearDeathMoments++;
          wasInDanger = true;
        }
      } else if (currentHealthRatio > 0.4 && wasInDanger) {
        // 危機からの回復
        comebackMoments++;
        wasInDanger = false;
      }
      
      // 危機的な瞬間（大ダメージを受けた）
      const healthDrop = previousHealthRatio - currentHealthRatio;
      if (healthDrop > 0.3) {
        criticalTurns++;
      }
      
      previousHealthRatio = currentHealthRatio;
    });
    
    // HP変動の激しさ（標準偏差）
    const avgHealthRatio = healthRatios.reduce((a, b) => a + b, 0) / healthRatios.length;
    const healthVolatility = Math.sqrt(
      healthRatios.reduce((sum, ratio) => sum + Math.pow(ratio - avgHealthRatio, 2), 0) / healthRatios.length
    );
    
    // 緊張感スコアの計算
    const tensionScore = this.calculateTensionScore({
      avgHealthRatio,
      nearDeathMoments,
      healthVolatility,
      criticalTurns,
      comebackMoments,
    });
    
    return {
      averageHealthRatio: avgHealthRatio,
      nearDeathMoments,
      healthVolatility,
      criticalTurns,
      comebackMoments,
      tensionScore,
    };
  }

  // 装備影響度の分析
  analyzeEquipmentImpact(): EquipmentImpactMetrics {
    const statImprovements: EquipmentImpactMetrics["statImprovements"] = [];
    let equipmentChanges = 0;
    
    // スナップショット間の装備変更を追跡
    for (let i = 1; i < this.snapshots.length; i++) {
      const prevSnapshot = this.snapshots[i - 1];
      const currSnapshot = this.snapshots[i];
      
      const prevEquip = prevSnapshot.session.player.equipment;
      const currEquip = currSnapshot.session.player.equipment;
      
      // 装備変更の検出
      let changed = false;
      if (prevEquip.weapon?.id !== currEquip.weapon?.id) changed = true;
      if (prevEquip.armor?.id !== currEquip.armor?.id) changed = true;
      if (prevEquip.accessory?.id !== currEquip.accessory?.id) changed = true;
      
      if (changed) {
        equipmentChanges++;
        
        // ステータス変化の計算
        const prevStats = calculateTotalStats(prevSnapshot.session.player);
        const currStats = calculateTotalStats(currSnapshot.session.player);
        
        const statChange: Partial<CharacterStats> = {
          damage: currStats.damage - prevStats.damage,
          maxHealth: currStats.maxHealth - prevStats.maxHealth,
          defense: currStats.defense - prevStats.defense,
          criticalChance: currStats.criticalChance - prevStats.criticalChance,
          skillPower: currStats.skillPower - prevStats.skillPower,
        };
        
        // 影響度の計算
        const impact = this.calculateStatChangeImpact(statChange, prevStats);
        
        statImprovements.push({
          turn: currSnapshot.turn,
          statChange,
          impact,
        });
      }
    }
    
    // 戦闘力の成長率
    const firstStats = calculateTotalStats(this.snapshots[0].session.player);
    const lastStats = calculateTotalStats(this.snapshots[this.snapshots.length - 1].session.player);
    
    const powerGrowthRate = this.calculatePowerGrowth(firstStats, lastStats);
    
    // ビルドの多様性（異なるステータスへの投資）
    const buildDiversity = this.calculateBuildDiversity(statImprovements);
    
    // 状況適応性（適切なタイミングでの装備変更）
    const adaptability = this.calculateAdaptability(statImprovements, this.logs);
    
    // 総合影響度スコア
    const impactScore = this.calculateEquipmentImpactScore({
      powerGrowthRate,
      equipmentChanges,
      buildDiversity,
      adaptability,
    });
    
    return {
      powerGrowthRate,
      equipmentChanges,
      statImprovements,
      buildDiversity,
      adaptability,
      impactScore,
    };
  }

  // 戦闘フロー分析
  analyzeCombatFlow(): CombatFlowAnalysis {
    const totalTurns = this.logs.length;
    const phases = [];
    const difficultyProgression = [];
    const powerSpikes = [];
    
    // フェーズ分割
    const earlyPhaseEnd = Math.floor(totalTurns * 0.3);
    const midPhaseEnd = Math.floor(totalTurns * 0.7);
    
    phases.push({
      startTurn: 0,
      endTurn: earlyPhaseEnd,
      type: "early" as const,
      characteristics: this.identifyPhaseCharacteristics(0, earlyPhaseEnd),
    });
    
    phases.push({
      startTurn: earlyPhaseEnd,
      endTurn: midPhaseEnd,
      type: "mid" as const,
      characteristics: this.identifyPhaseCharacteristics(earlyPhaseEnd, midPhaseEnd),
    });
    
    phases.push({
      startTurn: midPhaseEnd,
      endTurn: totalTurns,
      type: "late" as const,
      characteristics: this.identifyPhaseCharacteristics(midPhaseEnd, totalTurns),
    });
    
    // 難易度進行の分析
    for (let i = 0; i < this.logs.length; i += 10) {
      const difficulty = this.calculateDifficulty(i);
      difficultyProgression.push(difficulty);
    }
    
    // パワースパイクの検出
    this.logs.forEach((log, turn) => {
      log.events.forEach(event => {
        if (event.type === "PlayerLevelUp") {
          powerSpikes.push({
            turn,
            type: "level" as const,
            magnitude: 0.3,
          });
        }
        
        if (event.type === "ItemDropped" && event.item.rarity !== "Common") {
          const magnitude = event.item.rarity === "Legendary" ? 0.8 : 
                          event.item.rarity === "Rare" ? 0.5 : 0.3;
          powerSpikes.push({
            turn,
            type: "equipment" as const,
            magnitude,
          });
        }
        
        if (event.type === "SkillUsed") {
          // 初めてのスキル使用
          const isFirstSkillUse = !this.logs.slice(0, turn).some(prevLog => 
            prevLog.events.some(e => e.type === "SkillUsed" && e.skillId === event.skillId)
          );
          
          if (isFirstSkillUse) {
            powerSpikes.push({
              turn,
              type: "skill" as const,
              magnitude: 0.4,
            });
          }
        }
      });
    });
    
    return {
      phasesIdentified: phases,
      difficultyProgression,
      powerSpikes,
    };
  }

  // 総合分析
  analyze(): CombatDetails {
    const tension = this.analyzeTension();
    const equipmentImpact = this.analyzeEquipmentImpact();
    const combatFlow = this.analyzeCombatFlow();
    const recommendations = this.generateRecommendations(tension, equipmentImpact, combatFlow);
    
    return {
      tension,
      equipmentImpact,
      combatFlow,
      recommendations,
    };
  }

  // 緊張感スコア計算
  private calculateTensionScore(metrics: {
    avgHealthRatio: number;
    nearDeathMoments: number;
    healthVolatility: number;
    criticalTurns: number;
    comebackMoments: number;
  }): number {
    let score = 0;
    
    // 平均HP割合（理想: 40-60%）
    if (metrics.avgHealthRatio >= 0.4 && metrics.avgHealthRatio <= 0.6) {
      score += 30;
    } else {
      score += 30 * (1 - Math.abs(metrics.avgHealthRatio - 0.5) * 2);
    }
    
    // 瀕死回数（適度にあると良い）
    const idealNearDeath = Math.max(1, this.logs.length / 100);
    score += 20 * Math.min(1, metrics.nearDeathMoments / idealNearDeath);
    
    // HP変動性（適度な変動が良い）
    const idealVolatility = 0.2;
    score += 20 * (1 - Math.abs(metrics.healthVolatility - idealVolatility) * 2);
    
    // 危機的瞬間（適度にあると良い）
    const idealCritical = this.logs.length / 50;
    score += 15 * Math.min(1, metrics.criticalTurns / idealCritical);
    
    // 逆転の瞬間（あると盛り上がる）
    score += 15 * Math.min(1, metrics.comebackMoments / 3);
    
    return Math.max(0, Math.min(100, score));
  }

  // ステータス変化の影響度計算
  private calculateStatChangeImpact(
    change: Partial<CharacterStats>,
    baseStats: CharacterStats
  ): number {
    let impact = 0;
    
    if (change.damage) {
      impact += Math.abs(change.damage / baseStats.damage) * 30;
    }
    if (change.maxHealth) {
      impact += Math.abs(change.maxHealth / baseStats.maxHealth) * 25;
    }
    if (change.defense) {
      impact += Math.abs(change.defense / (baseStats.defense + 1)) * 20;
    }
    if (change.criticalChance) {
      impact += Math.abs(change.criticalChance / (baseStats.criticalChance + 0.1)) * 15;
    }
    if (change.skillPower) {
      impact += Math.abs(change.skillPower / (baseStats.skillPower + 1)) * 10;
    }
    
    return Math.min(100, impact);
  }

  // 戦闘力成長率
  private calculatePowerGrowth(firstStats: CharacterStats, lastStats: CharacterStats): number {
    const damagePower = lastStats.damage / firstStats.damage;
    const healthPower = lastStats.maxHealth / firstStats.maxHealth;
    const defensePower = (lastStats.defense + 1) / (firstStats.defense + 1);
    
    return (damagePower + healthPower + defensePower) / 3 - 1;
  }

  // ビルド多様性
  private calculateBuildDiversity(improvements: EquipmentImpactMetrics["statImprovements"]): number {
    if (improvements.length === 0) return 0;
    
    const statTypes = new Set<string>();
    improvements.forEach(imp => {
      Object.entries(imp.statChange).forEach(([stat, value]) => {
        if (value && Math.abs(value) > 0) {
          statTypes.add(stat);
        }
      });
    });
    
    return (statTypes.size / 5) * 100; // 5種類のステータスに対する割合
  }

  // 状況適応性
  private calculateAdaptability(
    improvements: EquipmentImpactMetrics["statImprovements"],
    logs: LogEntry[]
  ): number {
    let adaptiveChanges = 0;
    
    improvements.forEach(imp => {
      const turn = imp.turn;
      // 変更前後のログを見て、適切な変更だったか判定
      const beforeLogs = logs.slice(Math.max(0, turn - 10), turn);
      const afterLogs = logs.slice(turn, turn + 10);
      
      const beforeAvgHealth = beforeLogs.reduce((sum, log) => 
        sum + log.sessionState.playerHealth / log.sessionState.playerMaxHealth, 0
      ) / beforeLogs.length;
      
      const afterAvgHealth = afterLogs.reduce((sum, log) => 
        sum + log.sessionState.playerHealth / log.sessionState.playerMaxHealth, 0
      ) / afterLogs.length;
      
      // HP状況が改善していれば適応的
      if (afterAvgHealth > beforeAvgHealth) {
        adaptiveChanges++;
      }
    });
    
    return improvements.length > 0 
      ? (adaptiveChanges / improvements.length) * 100 
      : 50; // デフォルト
  }

  // 装備影響度スコア
  private calculateEquipmentImpactScore(metrics: {
    powerGrowthRate: number;
    equipmentChanges: number;
    buildDiversity: number;
    adaptability: number;
  }): number {
    let score = 0;
    
    // 成長率（理想: 50-200%）
    const idealGrowth = 1.0; // 100%成長
    score += 30 * Math.min(1, metrics.powerGrowthRate / idealGrowth);
    
    // 装備変更頻度（適度が良い）
    const idealChanges = this.logs.length / 50;
    score += 20 * Math.min(1, metrics.equipmentChanges / idealChanges);
    
    // ビルド多様性
    score += metrics.buildDiversity * 0.25;
    
    // 適応性
    score += metrics.adaptability * 0.25;
    
    return Math.max(0, Math.min(100, score));
  }

  // フェーズ特性の識別
  private identifyPhaseCharacteristics(startTurn: number, endTurn: number): string[] {
    const characteristics: string[] = [];
    const phaseLogs = this.logs.slice(startTurn, endTurn);
    
    // スキル使用頻度
    const skillUses = phaseLogs.filter(log => 
      log.events.some(e => e.type === "SkillUsed")
    ).length;
    
    if (skillUses / phaseLogs.length > 0.3) {
      characteristics.push("スキル中心の戦闘");
    }
    
    // 平均HP
    const avgHealth = phaseLogs.reduce((sum, log) => 
      sum + log.sessionState.playerHealth / log.sessionState.playerMaxHealth, 0
    ) / phaseLogs.length;
    
    if (avgHealth < 0.4) {
      characteristics.push("高難度");
    } else if (avgHealth > 0.7) {
      characteristics.push("安定期");
    }
    
    // アイテムドロップ
    const itemDrops = phaseLogs.filter(log => 
      log.events.some(e => e.type === "ItemDropped")
    ).length;
    
    if (itemDrops > phaseLogs.length * 0.2) {
      characteristics.push("報酬豊富");
    }
    
    return characteristics;
  }

  // 難易度計算
  private calculateDifficulty(turn: number): {
    turn: number;
    difficulty: number;
    reason: string;
  } {
    const window = this.logs.slice(Math.max(0, turn - 5), turn + 5);
    
    const avgHealthRatio = window.reduce((sum, log) => 
      sum + log.sessionState.playerHealth / log.sessionState.playerMaxHealth, 0
    ) / window.length;
    
    const deaths = window.filter(log => 
      log.events.some(e => e.type === "PlayerDefeated")
    ).length;
    
    const difficulty = (1 - avgHealthRatio) + deaths * 0.5;
    
    let reason = "";
    if (deaths > 0) {
      reason = "プレイヤー死亡";
    } else if (avgHealthRatio < 0.3) {
      reason = "低HP継続";
    } else if (avgHealthRatio < 0.5) {
      reason = "中程度の脅威";
    } else {
      reason = "安定";
    }
    
    return { turn, difficulty, reason };
  }

  // 推奨事項の生成
  private generateRecommendations(
    tension: TensionMetrics,
    equipment: EquipmentImpactMetrics,
    flow: CombatFlowAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    // 緊張感に関する推奨
    if (tension.tensionScore < 40) {
      if (tension.averageHealthRatio > 0.7) {
        recommendations.push("戦闘が簡単すぎます。モンスターの強化を検討してください。");
      }
      if (tension.nearDeathMoments === 0) {
        recommendations.push("瀕死状態がありません。より挑戦的なバランスが必要です。");
      }
    } else if (tension.tensionScore > 80) {
      recommendations.push("戦闘が難しすぎる可能性があります。回復手段の追加を検討してください。");
    }
    
    // 装備に関する推奨
    if (equipment.impactScore < 40) {
      if (equipment.equipmentChanges < 2) {
        recommendations.push("装備更新が少なすぎます。ドロップ率の向上を検討してください。");
      }
      if (equipment.powerGrowthRate < 0.3) {
        recommendations.push("キャラクター成長が遅すぎます。装備の性能差を大きくしてください。");
      }
    }
    
    // スキルに関する推奨
    const skillUsage = this.logs.filter(log => 
      log.events.some(e => e.type === "SkillUsed")
    ).length / this.logs.length;
    
    if (skillUsage < 0.1) {
      recommendations.push("スキル使用率が低すぎます。マナコストの調整やスキルの強化を検討してください。");
    }
    
    return recommendations;
  }
}