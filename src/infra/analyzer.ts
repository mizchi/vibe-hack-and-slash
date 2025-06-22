import type { LogEntry, GameSnapshot } from "../core/engine.ts";
import type { BattleEvent, Item } from "../core/types.ts";

// 分析結果の型定義
export type AnalysisResult = {
  summary: GameSummary;
  combatAnalysis: CombatAnalysis;
  itemAnalysis: ItemAnalysis;
  progressionAnalysis: ProgressionAnalysis;
  criticalMoments: CriticalMoment[];
  recommendations: string[];
};

export type GameSummary = {
  duration: number; // ミリ秒
  totalTurns: number;
  finalLevel: number;
  monstersDefeated: number;
  survived: boolean;
};

export type CombatAnalysis = {
  totalDamageDealt: number;
  totalDamageTaken: number;
  averageDamagePerTurn: number;
  averageDamageTaken: number;
  criticalHitRate: number;
  totalHealing: number;
  damageEfficiency: number; // ダメージ出力/受けたダメージ
  turnsSurvived: number;
  dps: number; // damage per second
};

export type ItemAnalysis = {
  totalItemsDropped: number;
  itemsByRarity: Record<string, number>;
  bestItems: Array<{
    item: Item;
    score: number;
    droppedAtTurn: number;
  }>;
  equipmentChanges: number;
  averageItemLevel: number;
};

export type ProgressionAnalysis = {
  levelingCurve: Array<{ turn: number; level: number; experience: number }>;
  healthCurve: Array<{ turn: number; health: number; maxHealth: number }>;
  powerSpikes: Array<{ turn: number; reason: string; impact: number }>;
  difficultyProgression: Array<{ turn: number; difficulty: number }>; // 難易度指標
};

export type CriticalMoment = {
  turn: number;
  type: "near_death" | "power_spike" | "epic_loot" | "level_up" | "defeat";
  description: string;
  healthPercentage?: number;
  impact: "low" | "medium" | "high" | "critical";
};

// ログ分析クラス
export class GameLogAnalyzer {
  constructor(
    private logs: LogEntry[],
    private snapshots: GameSnapshot[]
  ) {}

  analyze(): AnalysisResult {
    return {
      summary: this.analyzeSummary(),
      combatAnalysis: this.analyzeCombat(),
      itemAnalysis: this.analyzeItems(),
      progressionAnalysis: this.analyzeProgression(),
      criticalMoments: this.identifyCriticalMoments(),
      recommendations: this.generateRecommendations(),
    };
  }

  private analyzeSummary(): GameSummary {
    const firstLog = this.logs[0];
    const lastLog = this.logs[this.logs.length - 1];
    
    return {
      duration: lastLog.timestamp - firstLog.timestamp,
      totalTurns: this.logs.length,
      finalLevel: lastLog.sessionState.playerLevel,
      monstersDefeated: lastLog.sessionState.defeatedCount,
      survived: lastLog.sessionState.playerHealth > 0,
    };
  }

  private analyzeCombat(): CombatAnalysis {
    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    let criticalHits = 0;
    let totalAttacks = 0;
    let totalHealing = 0;
    
    this.logs.forEach(log => {
      log.events.forEach(event => {
        switch (event.type) {
          case "PlayerAttack":
            totalDamageDealt += event.damage;
            totalAttacks++;
            if (event.isCritical) criticalHits++;
            break;
          case "MonsterAttack":
            totalDamageTaken += event.damage;
            break;
          case "PlayerHeal":
            totalHealing += event.amount;
            break;
        }
      });
    });
    
    const duration = this.analyzeSummary().duration / 1000; // 秒
    
    return {
      totalDamageDealt,
      totalDamageTaken,
      averageDamagePerTurn: totalDamageDealt / this.logs.length,
      averageDamageTaken: totalDamageTaken / this.logs.length,
      criticalHitRate: totalAttacks > 0 ? criticalHits / totalAttacks : 0,
      totalHealing,
      damageEfficiency: totalDamageTaken > 0 ? totalDamageDealt / totalDamageTaken : 0,
      turnsSurvived: this.logs.length,
      dps: duration > 0 ? totalDamageDealt / duration : 0,
    };
  }

  private analyzeItems(): ItemAnalysis {
    const droppedItems: Array<{ item: Item; turn: number }> = [];
    const itemsByRarity: Record<string, number> = {
      Common: 0,
      Magic: 0,
      Rare: 0,
      Legendary: 0,
    };
    
    this.logs.forEach((log, turn) => {
      log.events.forEach(event => {
        if (event.type === "ItemDropped") {
          droppedItems.push({ item: event.item, turn });
          itemsByRarity[event.item.rarity]++;
        }
      });
    });
    
    // アイテムスコア計算
    const calculateItemScore = (item: Item): number => {
      let score = 0;
      const allMods = [
        ...item.baseItem.baseModifiers,
        ...(item.prefix?.modifiers || []),
        ...(item.suffix?.modifiers || []),
      ];
      
      allMods.forEach(mod => {
        switch (mod.type) {
          case "IncreaseDamage": score += mod.value * 2; break;
          case "IncreaseHealth": score += mod.value; break;
          case "IncreaseDefense": score += mod.value * 1.5; break;
          case "CriticalChance": score += mod.percentage * 100; break;
          case "CriticalDamage": score += mod.multiplier * 50; break;
          case "LifeSteal": score += mod.percentage * 80; break;
        }
      });
      
      const rarityMultiplier = { Common: 1, Magic: 1.5, Rare: 2.5, Legendary: 4 };
      return score * rarityMultiplier[item.rarity];
    };
    
    const bestItems = droppedItems
      .map(({ item, turn }) => ({
        item,
        score: calculateItemScore(item),
        droppedAtTurn: turn,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    const averageItemLevel = droppedItems.length > 0
      ? droppedItems.reduce((sum, { item }) => sum + item.level, 0) / droppedItems.length
      : 0;
    
    return {
      totalItemsDropped: droppedItems.length,
      itemsByRarity,
      bestItems,
      equipmentChanges: this.countEquipmentChanges(),
      averageItemLevel,
    };
  }

  private analyzeProgression(): ProgressionAnalysis {
    const levelingCurve: Array<{ turn: number; level: number; experience: number }> = [];
    const healthCurve: Array<{ turn: number; health: number; maxHealth: number }> = [];
    const powerSpikes: Array<{ turn: number; reason: string; impact: number }> = [];
    const difficultyProgression: Array<{ turn: number; difficulty: number }> = [];
    
    let lastLevel = 1;
    let lastMaxDamage = 0;
    
    this.logs.forEach((log, turn) => {
      const state = log.sessionState;
      
      // レベリングカーブ
      if (turn % 10 === 0 || state.playerLevel > lastLevel) {
        levelingCurve.push({
          turn,
          level: state.playerLevel,
          experience: 0, // 実際の経験値は別途計算が必要
        });
        
        if (state.playerLevel > lastLevel) {
          powerSpikes.push({
            turn,
            reason: `Level up to ${state.playerLevel}`,
            impact: 0.3,
          });
          lastLevel = state.playerLevel;
        }
      }
      
      // ヘルスカーブ
      if (turn % 5 === 0) {
        healthCurve.push({
          turn,
          health: state.playerHealth,
          maxHealth: state.playerMaxHealth,
        });
      }
      
      // パワースパイク検出
      log.events.forEach(event => {
        if (event.type === "ItemDropped" && event.item.rarity !== "Common") {
          powerSpikes.push({
            turn,
            reason: `${event.item.rarity} item dropped`,
            impact: event.item.rarity === "Legendary" ? 1 : 0.5,
          });
        }
      });
      
      // 難易度進行（簡易計算）
      if (turn % 20 === 0) {
        const healthRatio = state.playerHealth / state.playerMaxHealth;
        const monsterThreat = state.monsterHealth || 0;
        const difficulty = (1 - healthRatio) + (monsterThreat / 100) * 0.5;
        
        difficultyProgression.push({ turn, difficulty });
      }
    });
    
    return {
      levelingCurve,
      healthCurve,
      powerSpikes,
      difficultyProgression,
    };
  }

  private identifyCriticalMoments(): CriticalMoment[] {
    const moments: CriticalMoment[] = [];
    
    this.logs.forEach((log, turn) => {
      const healthPercentage = log.sessionState.playerHealth / log.sessionState.playerMaxHealth;
      
      // 瀕死状態
      if (healthPercentage < 0.2 && healthPercentage > 0) {
        moments.push({
          turn,
          type: "near_death",
          description: `Health dropped to ${Math.round(healthPercentage * 100)}%`,
          healthPercentage,
          impact: "critical",
        });
      }
      
      // イベント解析
      log.events.forEach(event => {
        switch (event.type) {
          case "PlayerLevelUp":
            moments.push({
              turn,
              type: "level_up",
              description: `Reached level ${event.newLevel}`,
              impact: "medium",
            });
            break;
            
          case "ItemDropped":
            if (event.item.rarity === "Legendary") {
              moments.push({
                turn,
                type: "epic_loot",
                description: `Legendary item dropped: ${event.item.baseItem.name}`,
                impact: "high",
              });
            } else if (event.item.rarity === "Rare") {
              moments.push({
                turn,
                type: "epic_loot",
                description: `Rare item dropped: ${event.item.baseItem.name}`,
                impact: "medium",
              });
            }
            break;
            
          case "PlayerDefeated":
            moments.push({
              turn,
              type: "defeat",
              description: "Player was defeated",
              impact: "critical",
            });
            break;
        }
      });
    });
    
    return moments;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const combat = this.analyzeCombat();
    const items = this.analyzeItems();
    const progression = this.analyzeProgression();
    
    // 戦闘効率
    if (combat.damageEfficiency < 1.5) {
      recommendations.push("ダメージ出力が低い。より攻撃的なビルドを検討してください。");
    }
    
    if (combat.criticalHitRate < 0.15) {
      recommendations.push("クリティカル率が低い。クリティカル強化アイテムを優先してください。");
    }
    
    // アイテム
    if (items.itemsByRarity.Legendary === 0 && this.logs.length > 100) {
      recommendations.push("レジェンダリーアイテムが未入手。より高難度のモンスターに挑戦してください。");
    }
    
    if (items.equipmentChanges < items.totalItemsDropped * 0.1) {
      recommendations.push("装備更新頻度が低い。新しいアイテムの性能を確認してください。");
    }
    
    // 進行
    const avgHealthRatio = progression.healthCurve.reduce(
      (sum, point) => sum + point.health / point.maxHealth, 0
    ) / progression.healthCurve.length;
    
    if (avgHealthRatio < 0.5) {
      recommendations.push("平均体力が低い。防御力やライフスティールの強化を検討してください。");
    }
    
    return recommendations;
  }

  private countEquipmentChanges(): number {
    // スナップショットから装備変更を検出
    let changes = 0;
    
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1].session.player.equipment;
      const curr = this.snapshots[i].session.player.equipment;
      
      if (prev.weapon?.id !== curr.weapon?.id) changes++;
      if (prev.armor?.id !== curr.armor?.id) changes++;
      if (prev.accessory?.id !== curr.accessory?.id) changes++;
    }
    
    return changes;
  }

  // 詳細レポート生成
  generateReport(): string {
    const analysis = this.analyze();
    
    return `
# ゲーム分析レポート

## サマリー
- 総ターン数: ${analysis.summary.totalTurns}
- 生存時間: ${(analysis.summary.duration / 1000).toFixed(1)}秒
- 最終レベル: ${analysis.summary.finalLevel}
- 撃破数: ${analysis.summary.monstersDefeated}
- 結果: ${analysis.summary.survived ? "生存" : "敗北"}

## 戦闘分析
- 総ダメージ: ${analysis.combatAnalysis.totalDamageDealt}
- 被ダメージ: ${analysis.combatAnalysis.totalDamageTaken}
- DPS: ${analysis.combatAnalysis.dps.toFixed(1)}
- クリティカル率: ${(analysis.combatAnalysis.criticalHitRate * 100).toFixed(1)}%
- ダメージ効率: ${analysis.combatAnalysis.damageEfficiency.toFixed(2)}

## アイテム分析
- 総ドロップ数: ${analysis.itemAnalysis.totalItemsDropped}
- レア度分布:
  - Common: ${analysis.itemAnalysis.itemsByRarity.Common}
  - Magic: ${analysis.itemAnalysis.itemsByRarity.Magic}
  - Rare: ${analysis.itemAnalysis.itemsByRarity.Rare}
  - Legendary: ${analysis.itemAnalysis.itemsByRarity.Legendary}

## 重要な瞬間
${analysis.criticalMoments.slice(0, 5).map(m => 
  `- Turn ${m.turn}: ${m.description} (${m.impact})`
).join("\n")}

## 推奨事項
${analysis.recommendations.map(r => `- ${r}`).join("\n")}
`;
  }
}