import { describe, it, expect } from "vitest";
import { playerAttack, monsterAttack, applyExperience } from "../combat.ts";
import { 
  calculateElementalDamage, 
  calculatePhysicalDamage,
  calculateTotalElementModifiers,
  calculateBaseDamageFromStats
} from "../damage.ts";
import type { 
  Player, 
  Monster, 
  Health, 
  Damage, 
  Level, 
  Experience,
  ElementType,
  ElementResistance,
  CharacterStats,
  BaseStats
} from "../types.ts";

// テスト用のプレイヤー作成
const createTestPlayer = (overrides?: Partial<Player>): Player => ({
  id: "player1" as any,
  name: "TestPlayer",
  class: "Warrior",
  level: 1 as Level,
  currentHealth: 100 as Health,
  currentMana: 50 as any,
  baseStats: {
    maxHealth: 100 as Health,
    baseDamage: 20 as Damage,
    criticalChance: 0.1,
    criticalDamage: 1.5,
    lifeSteal: 0,
    maxMana: 50 as any,
    manaRegen: 5,
    skillPower: 0,
  },
  baseAttributes: {
    strength: 10 as any,
    intelligence: 5 as any,
    dexterity: 5 as any,
    vitality: 10 as any,
  },
  elementResistance: {
    Physical: 0,
    Arcane: 0,
    Fire: 0,
    Lightning: 0,
    Holy: 0,
  },
  experience: 0 as Experience,
  skills: [],
  skillCooldowns: new Map(),
  skillTimers: new Map(),
  activeBuffs: [],
  equipment: new Map(),
  inventory: [],
  gold: 0 as any,
  ...overrides,
});

// テスト用のモンスター作成
const createTestMonster = (overrides?: Partial<Monster>): Monster => ({
  id: "monster1" as any,
  name: "TestMonster",
  level: 1 as Level,
  currentHealth: 50 as Health,
  stats: {
    maxHealth: 50 as Health,
    baseDamage: 10 as Damage,
    criticalChance: 0.05,
    criticalDamage: 1.5,
    lifeSteal: 0,
    maxMana: 0 as any,
    manaRegen: 0,
    skillPower: 0,
  },
  elementResistance: {
    Physical: 0,
    Arcane: 0,
    Fire: 0,
    Lightning: 0,
    Holy: 0,
  },
  lootTable: [],
  tier: "Common",
  ...overrides,
});

describe("Combat System", () => {
  describe("playerAttack", () => {
    it("基本的な攻撃ダメージを与える", () => {
      const player = createTestPlayer();
      const monster = createTestMonster();
      const mockRandom = () => 0.5;

      const result = playerAttack(player, monster, mockRandom);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.events).toHaveLength(1);
        expect(result.value.events[0].type).toBe("PlayerAttack");
        expect(result.value.updatedMonster.currentHealth).toBeLessThan(monster.currentHealth);
      }
    });

    it("クリティカル攻撃が発生する", () => {
      const player = createTestPlayer({
        baseStats: {
          ...createTestPlayer().baseStats,
          criticalChance: 1.0, // 100%クリティカル
          criticalDamage: 2.0,
        },
      });
      const monster = createTestMonster();
      const mockRandom = () => 0;

      const result = playerAttack(player, monster, mockRandom);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        const attackEvent = result.value.events[0];
        expect(attackEvent.type).toBe("PlayerAttack");
        if (attackEvent.type === "PlayerAttack") {
          expect(attackEvent.isCritical).toBe(true);
        }
      }
    });

    it("ライフスティールで回復する", () => {
      const player = createTestPlayer({
        baseStats: {
          ...createTestPlayer().baseStats,
          lifeSteal: 0.5, // 50%ライフスティール
        },
      });
      const monster = createTestMonster();
      const mockRandom = () => 0.5;

      const result = playerAttack(player, monster, mockRandom);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.events).toHaveLength(2);
        expect(result.value.events[1].type).toBe("PlayerHeal");
      }
    });

    it("モンスターを倒すと経験値を獲得する", () => {
      const player = createTestPlayer({
        baseStats: {
          ...createTestPlayer().baseStats,
          baseDamage: 100 as Damage, // 一撃で倒せるダメージ
        },
      });
      const monster = createTestMonster();
      const mockRandom = () => 0.5;

      const result = playerAttack(player, monster, mockRandom);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.updatedMonster.currentHealth).toBe(0);
        const defeatEvent = result.value.events.find(e => e.type === "MonsterDefeated");
        expect(defeatEvent).toBeDefined();
        if (defeatEvent && defeatEvent.type === "MonsterDefeated") {
          expect(defeatEvent.experience).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("monsterAttack", () => {
    it("プレイヤーにダメージを与える", () => {
      const player = createTestPlayer();
      const monster = createTestMonster();
      const mockRandom = () => 0.5;

      const result = monsterAttack(monster, player, mockRandom);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.events).toHaveLength(1);
        expect(result.value.events[0].type).toBe("MonsterAttack");
        expect(result.value.updatedPlayer.currentHealth).toBeLessThan(player.currentHealth);
      }
    });

    it("プレイヤーを倒すとPlayerDefeatedイベントが発生する", () => {
      const player = createTestPlayer({
        currentHealth: 1 as Health,
      });
      const monster = createTestMonster({
        stats: {
          ...createTestMonster().stats,
          baseDamage: 100 as Damage,
        },
      });
      const mockRandom = () => 0.5;

      const result = monsterAttack(monster, player, mockRandom);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.updatedPlayer.currentHealth).toBe(0);
        expect(result.value.events).toHaveLength(2);
        expect(result.value.events[1].type).toBe("PlayerDefeated");
      }
    });
  });

  describe("applyExperience", () => {
    it("経験値を獲得する", () => {
      const player = createTestPlayer();
      const experience = 50 as Experience;

      const result = applyExperience(player, experience);
      
      expect(result.player.experience).toBe(50);
      expect(result.leveledUp).toBe(false);
    });

    it("レベルアップする", () => {
      const player = createTestPlayer({
        experience: 90 as Experience,
      });
      const experience = 20 as Experience;

      const result = applyExperience(player, experience);
      
      expect(result.player.level).toBe(2);
      expect(result.player.experience).toBe(10); // 110 - 100 = 10
      expect(result.leveledUp).toBe(true);
    });
  });
});

describe("Elemental Damage System", () => {
  describe("calculateElementalDamage", () => {
    it("基本的な属性ダメージを計算する", () => {
      const baseDamage = 100;
      const element: ElementType = "Fire";
      const resistance: ElementResistance = {
        Physical: 0,
        Arcane: 0,
        Fire: 0,
        Lightning: 0,
        Holy: 0,
      };

      const damage = calculateElementalDamage(baseDamage, element, resistance);
      expect(damage).toBe(100);
    });

    it("属性耐性でダメージが軽減される", () => {
      const baseDamage = 100;
      const element: ElementType = "Fire";
      const resistance: ElementResistance = {
        Physical: 0,
        Arcane: 0,
        Fire: 50, // 50%耐性
        Lightning: 0,
        Holy: 0,
      };

      const damage = calculateElementalDamage(baseDamage, element, resistance);
      expect(damage).toBe(50);
    });

    it("弱点属性でダメージが増加する", () => {
      const baseDamage = 100;
      const element: ElementType = "Holy";
      const resistance: ElementResistance = {
        Physical: 0,
        Arcane: 0,
        Fire: 0,
        Lightning: 0,
        Holy: -50, // -50% = 弱点
      };

      const damage = calculateElementalDamage(baseDamage, element, resistance);
      expect(damage).toBe(150);
    });

    it("攻撃側の属性修正が適用される", () => {
      const baseDamage = 100;
      const element: ElementType = "Physical";
      const resistance: ElementResistance = {
        Physical: 0,
        Arcane: 0,
        Fire: 0,
        Lightning: 0,
        Holy: 0,
      };
      const attackerModifier = 1.5; // 150%

      const damage = calculateElementalDamage(baseDamage, element, resistance, attackerModifier);
      expect(damage).toBe(150);
    });

    it("最低ダメージは1", () => {
      const baseDamage = 10;
      const element: ElementType = "Fire";
      const resistance: ElementResistance = {
        Physical: 0,
        Arcane: 0,
        Fire: 99, // 99%耐性
        Lightning: 0,
        Holy: 0,
      };

      const damage = calculateElementalDamage(baseDamage, element, resistance);
      expect(damage).toBe(1);
    });
  });

  describe("calculateBaseDamageFromStats", () => {
    it("STRベースの武器ダメージを計算する", () => {
      const stats: CharacterStats = {
        maxHealth: 100 as Health,
        baseDamage: 20 as Damage,
        criticalChance: 0.1,
        criticalDamage: 1.5,
        lifeSteal: 0,
        maxMana: 50 as any,
        manaRegen: 5,
        skillPower: 0,
      };
      const attributes: BaseStats = {
        strength: 20 as any,
        intelligence: 10 as any,
        dexterity: 10 as any,
        vitality: 10 as any,
      };
      const weaponScaling = { strength: 0.8 };

      const damage = calculateBaseDamageFromStats(stats, attributes, weaponScaling);
      expect(damage).toBe(36); // 20 + 20 * 0.8
    });

    it("INTベースの武器ダメージを計算する", () => {
      const stats: CharacterStats = {
        maxHealth: 100 as Health,
        baseDamage: 15 as Damage,
        criticalChance: 0.1,
        criticalDamage: 1.5,
        lifeSteal: 0,
        maxMana: 50 as any,
        manaRegen: 5,
        skillPower: 0,
      };
      const attributes: BaseStats = {
        strength: 10 as any,
        intelligence: 25 as any,
        dexterity: 10 as any,
        vitality: 10 as any,
      };
      const weaponScaling = { intelligence: 1.0 };

      const damage = calculateBaseDamageFromStats(stats, attributes, weaponScaling);
      expect(damage).toBe(40); // 15 + 25 * 1.0
    });

    it("複数ステータススケーリングの武器ダメージを計算する", () => {
      const stats: CharacterStats = {
        maxHealth: 100 as Health,
        baseDamage: 10 as Damage,
        criticalChance: 0.1,
        criticalDamage: 1.5,
        lifeSteal: 0,
        maxMana: 50 as any,
        manaRegen: 5,
        skillPower: 0,
      };
      const attributes: BaseStats = {
        strength: 20 as any,
        intelligence: 10 as any,
        dexterity: 15 as any,
        vitality: 10 as any,
      };
      const weaponScaling = { 
        strength: 0.5,
        dexterity: 0.3 
      };

      const damage = calculateBaseDamageFromStats(stats, attributes, weaponScaling);
      expect(damage).toBe(24); // 10 + 20*0.5 + 15*0.3 = 10 + 10 + 4.5
    });
  });
});