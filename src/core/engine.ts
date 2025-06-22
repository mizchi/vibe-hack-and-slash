import type { Session, BattleEvent, BaseItem, ItemId, GameAction } from "./types.ts";
import { createSession, processBattleTurn, processAction } from "./session.ts";

// ゲームエンジンの設定
export type EngineConfig = {
  tickInterval: number; // ミリ秒
  maxTurns?: number;
  seed?: number;
  autoEquip?: boolean; // 自動的に良いアイテムを装備
};

// ゲーム状態のスナップショット
export type GameSnapshot = {
  turn: number;
  timestamp: number;
  session: Session;
  events: BattleEvent[];
  metadata?: Record<string, any>;
};

// ログエントリ
export type LogEntry = {
  turn: number;
  timestamp: number;
  events: BattleEvent[];
  sessionState: {
    playerLevel: number;
    playerHealth: number;
    playerMaxHealth: number;
    monsterName?: string;
    monsterHealth?: number;
    defeatedCount: number;
  };
};

// 乱数生成器（シード対応）
export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  reset(seed: number): void {
    this.seed = seed;
  }
}

// ヘッドレスゲームエンジン
export class HeadlessGameEngine {
  private session: Session;
  private config: EngineConfig;
  private logs: LogEntry[] = [];
  private snapshots: GameSnapshot[] = [];
  private random: SeededRandom;
  private turn: number = 0;
  private running: boolean = false;
  
  constructor(
    session: Session,
    private baseItems: Map<ItemId, BaseItem>,
    private monsterTemplates: any[],
    config: Partial<EngineConfig> = {}
  ) {
    this.session = session;
    this.config = {
      tickInterval: 100,
      autoEquip: true,
      ...config,
    };
    this.random = new SeededRandom(config.seed);
  }

  // ゲーム実行
  async run(): Promise<void> {
    this.running = true;
    
    while (this.running && this.session.state === "InProgress") {
      if (this.config.maxTurns && this.turn >= this.config.maxTurns) {
        break;
      }
      
      await this.tick();
      
      if (this.config.tickInterval > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.tickInterval));
      }
    }
  }

  // 同期実行（テスト用）
  runSync(turns?: number): void {
    const maxTurns = turns || this.config.maxTurns || 1000;
    
    for (let i = 0; i < maxTurns && this.session.state === "InProgress"; i++) {
      this.tickSync();
    }
  }

  // 1ターン処理
  private async tick(): Promise<void> {
    const timestamp = Date.now();
    const result = processBattleTurn(
      this.session,
      this.baseItems,
      this.monsterTemplates,
      this.session.player.skills,
      this.turn,
      () => this.random.next()
    );
    
    if (result.ok) {
      this.session = result.value.updatedSession;
      
      // 自動装備
      if (this.config.autoEquip && result.value.droppedItems) {
        this.autoEquipBestItems(result.value.droppedItems);
      }
      
      // ログ記録
      this.logTurn(result.value.events, timestamp);
      
      // スナップショット
      if (this.shouldTakeSnapshot()) {
        this.takeSnapshot(result.value.events, timestamp);
      }
      
      this.turn++;
    }
  }

  // 同期版tick
  private tickSync(): void {
    const timestamp = Date.now();
    const result = processBattleTurn(
      this.session,
      this.baseItems,
      this.monsterTemplates,
      this.session.player.skills,
      this.turn,
      () => this.random.next()
    );
    
    if (result.ok) {
      this.session = result.value.updatedSession;
      
      if (this.config.autoEquip && result.value.droppedItems) {
        this.autoEquipBestItems(result.value.droppedItems);
      }
      
      this.logTurn(result.value.events, timestamp);
      
      if (this.shouldTakeSnapshot()) {
        this.takeSnapshot(result.value.events, timestamp);
      }
      
      this.turn++;
    }
  }

  // 自動装備
  private autoEquipBestItems(items: Item[]): void {
    import("../core/combat.ts").then(({ calculateTotalStats }) => {
      const currentStats = calculateTotalStats(this.session.player);
      
      for (const item of items) {
        const slot = item.baseItem.type.toLowerCase() as keyof typeof this.session.player.equipment;
        const currentItem = this.session.player.equipment[slot];
        
        // 簡易的な評価：ダメージとヘルスの合計値で判断
        const getItemScore = (item: Item | undefined): number => {
          if (!item) return 0;
          
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
            case "IncreaseMana": score += mod.value * 0.8; break;
            case "ManaRegen": score += mod.value * 1.2; break;
            case "SkillPower": score += mod.percentage * 1.5; break;
            }
          });
          
          // レアリティボーナス
          const rarityBonus = { Common: 1, Magic: 1.2, Rare: 1.5, Legendary: 2 };
          score *= rarityBonus[item.rarity];
          
          return score;
        };
        
        if (getItemScore(item) > getItemScore(currentItem)) {
          const result = processAction(this.session, { type: "EquipItem", item });
          if (result.ok) {
            this.session = result.value;
          }
        }
      }
    });
  }

  // ログ記録
  private logTurn(events: BattleEvent[], timestamp: number): void {
    const player = this.session.player;
    const monster = this.session.currentMonster;
    
    this.logs.push({
      turn: this.turn,
      timestamp,
      events,
      sessionState: {
        playerLevel: player.level,
        playerHealth: player.currentHealth,
        playerMaxHealth: player.baseStats.maxHealth,
        monsterName: monster?.name,
        monsterHealth: monster?.currentHealth,
        defeatedCount: this.session.defeatedCount,
      },
    });
  }

  // スナップショット判定
  private shouldTakeSnapshot(): boolean {
    // 重要なイベントが発生した時
    const lastLog = this.logs[this.logs.length - 1];
    if (!lastLog) return false;
    
    return lastLog.events.some(e => 
      e.type === "PlayerLevelUp" || 
      e.type === "PlayerDefeated" ||
      (e.type === "ItemDropped" && e.item.rarity !== "Common")
    );
  }

  // スナップショット記録
  private takeSnapshot(events: BattleEvent[], timestamp: number): void {
    this.snapshots.push({
      turn: this.turn,
      timestamp,
      session: JSON.parse(JSON.stringify(this.session)), // ディープコピー
      events,
    });
  }

  // 停止
  stop(): void {
    this.running = false;
  }

  // ゲッター
  getSession(): Session {
    return this.session;
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getSnapshots(): GameSnapshot[] {
    return this.snapshots;
  }

  getTurn(): number {
    return this.turn;
  }

  // 分析用メソッド
  getStats(): {
    totalTurns: number;
    totalDamageDealt: number;
    totalDamageTaken: number;
    monstersDefeated: number;
    itemsDropped: number;
    levelUps: number;
    criticalHits: number;
    avgDamagePerTurn: number;
    avgHealthPerTurn: number;
  } {
    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    let itemsDropped = 0;
    let levelUps = 0;
    let criticalHits = 0;
    let totalHealth = 0;
    
    this.logs.forEach(log => {
      totalHealth += log.sessionState.playerHealth;
      
      log.events.forEach(event => {
        switch (event.type) {
          case "PlayerAttack":
            totalDamageDealt += event.damage;
            if (event.isCritical) criticalHits++;
            break;
          case "MonsterAttack":
            totalDamageTaken += event.damage;
            break;
          case "ItemDropped":
            itemsDropped++;
            break;
          case "PlayerLevelUp":
            levelUps++;
            break;
        }
      });
    });
    
    return {
      totalTurns: this.turn,
      totalDamageDealt,
      totalDamageTaken,
      monstersDefeated: this.session.defeatedCount,
      itemsDropped,
      levelUps,
      criticalHits,
      avgDamagePerTurn: this.turn > 0 ? totalDamageDealt / this.turn : 0,
      avgHealthPerTurn: this.logs.length > 0 ? totalHealth / this.logs.length : 0,
    };
  }
}