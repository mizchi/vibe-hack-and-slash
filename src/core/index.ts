// Core exports - IOのない純粋なビジネスロジック

// Domain entities
export type {
  Player,
  Enemy,
  GameLog,
  GameState,
  GameAction,
} from "./domain/entities";

export {
  createPlayer,
  createEnemy,
  createGameLog,
  createInitialGameState,
} from "./domain/entities";

// Domain rules
export {
  calculateDamage,
  calculateSkillDamage,
  calculateDefendedDamage,
  damagePlayer,
  healPlayer,
  levelUpPlayer,
  addExpToPlayer,
  damageEnemy,
  isPlayerDefeated,
  isEnemyDefeated,
  shouldLevelUp,
  isGameClear,
  generateEnemy,
  calculateExpReward,
} from "./domain/rules";

// Use cases
export { executeGameAction } from "./usecases/game-actions";