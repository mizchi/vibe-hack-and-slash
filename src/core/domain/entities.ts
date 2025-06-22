// エンティティの定義（純粋なデータ構造）

export type Player = {
  readonly health: number;
  readonly maxHealth: number;
  readonly attack: number;
  readonly level: number;
  readonly exp: number;
};

export type Enemy = {
  readonly name: string;
  readonly health: number;
  readonly maxHealth: number;
  readonly attack: number;
  readonly level: number;
};

export type GameLog = {
  readonly message: string;
  readonly timestamp: number;
};

export type GameState = {
  readonly player: Player;
  readonly enemy: Enemy | null;
  readonly logs: readonly GameLog[];
  readonly floor: number;
  readonly isGameOver: boolean;
  readonly isVictory: boolean;
};

export type GameAction = "attack" | "defend" | "skill" | "restart";

// エンティティのファクトリー関数
export const createPlayer = (
  health: number,
  maxHealth: number,
  attack: number,
  level: number,
  exp: number,
): Player => ({
  health,
  maxHealth,
  attack,
  level,
  exp,
});
export const createEnemy = (
  name: string,
  health: number,
  maxHealth: number,
  attack: number,
  level: number,
): Enemy => ({
  name,
  health,
  maxHealth,
  attack,
  level,
});
export const createGameLog = (message: string): GameLog => ({
  message,
  timestamp: Date.now(),
});
export const createInitialGameState = (): GameState => ({
  player: createPlayer(100, 100, 10, 1, 0),
  enemy: createEnemy("スライム", 50, 50, 5, 1),
  logs: [createGameLog("ゲーム開始！")],
  floor: 1,
  isGameOver: false,
  isVictory: false,
});
