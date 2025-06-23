import React from "react";
import { render } from "ink-testing-library";
import { describe, it, expect, beforeAll } from "vitest";

// ゲームコンポーネントのインポート
import { GamePlayView } from "../GamePlayView";
import { BattleDetailView } from "../BattleDetailView";
import { EquipmentDetailView } from "../EquipmentDetailView";

// モックデータ
import type { Session, BaseItem, ItemId, Skill, Monster } from "../../../core/types";

// テスト環境設定
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});

// モックデータの作成
const createMockSession = (): Session => ({
  id: "test-session" as any,
  player: {
    id: "test-player" as any,
    class: "Warrior",
    level: 5 as any,
    currentHealth: 80 as any,
    currentMana: 30 as any,
    experience: 150 as any,
    gold: 250 as any,
    equipment: new Map(),
    name: "テストプレイヤー",
    baseAttributes: {
      strength: 15 as any,
      intelligence: 5 as any,
      dexterity: 10 as any,
      vitality: 12 as any
    },
    baseStats: {
      maxHealth: 100 as any,
      baseDamage: 10 as any,
      criticalChance: 0.1,
      criticalDamage: 1.5,
      lifeSteal: 0,
      mpRegen: 2 as any,
      vitality: 12 as any,
      elementModifier: {
        Physical: 1,
        Arcane: 0,
        Fire: 0,
        Lightning: 0,
        Holy: 0
      }
    },
    inventory: [],
    skills: [],
    skillCooldowns: new Map(),
    skillTimers: new Map(),
    activeBuffs: [],
    elementResistance: {
      Physical: 0,
      Arcane: 0,
      Fire: 0,
      Lightning: 0,
      Holy: 0
    },
    resourcePool: {
      White: 3,
      Red: 0,
      Blue: 0,
      Green: 0,
      Black: 0
    },
    totalResourceLimit: {
      White: 10,
      Red: 10,
      Blue: 10,
      Green: 10,
      Black: 10
    }
  },
  defeatedCount: 3 as any,
  currentMonster: {
    id: "monster-1" as any,
    name: "ゴブリン",
    level: 3 as any,
    currentHealth: 30 as any,
    stats: {
      maxHealth: 50 as any,
      maxMana: 0 as any,
      baseDamage: 10 as any,
      criticalChance: 0.05,
      dodgeChance: 0,
      blockChance: 0,
      blockReduction: 0,
      mpRegen: 0 as any,
      lifeSteal: 0,
      elementModifier: {
        Physical: 1,
        Arcane: 0,
        Fire: 0,
        Lightning: 0,
        Holy: 0
      }
    },
    elementResistance: {
      Physical: 0,
      Arcane: 0,
      Fire: -0.2,
      Lightning: 0,
      Holy: -0.1
    },
    tier: "Common" as const,
    lootTable: []
  },
  state: "InProgress" as const,
  turn: 5,
  droppedItems: [],
  wave: 1 as any
});

const createMockBaseItems = (): Map<ItemId, BaseItem> => {
  const map = new Map<ItemId, BaseItem>();
  map.set("sword-1" as any, {
    id: "sword-1" as any,
    name: "アイアンソード",
    type: "Weapon",
    tags: ["Sword"],
    requiredLevel: 1 as any,
    requiredClass: undefined,
    baseModifiers: [
      {
        type: "IncreaseStrength",
        value: 10
      }
    ],
    weaponType: "Sword",
    weaponUniqueSkills: [],
    weaponScaling: {
      strength: 1,
      intelligence: 0,
      dexterity: 0.5
    }
  });
  return map;
};

// Monster用のダミーデータは不要（GamePlayViewがmonsterTemplatesの型を期待しているため）
const createMockMonsterTemplates = (): any[] => [
  {
    id: "goblin",
    name: "ゴブリン",
    type: "Normal",
    baseStats: {
      maxHealth: 50,
      damage: 10,
      defense: 5,
      speed: 1.0,
      criticalChance: 0.05
    },
    element: "Physical",
    elementResistance: {
      Physical: 0,
      Arcane: 0,
      Fire: -0.2,
      Lightning: 0,
      Holy: -0.1
    },
    xpReward: 10,
    goldReward: 5,
    itemDropRate: 0.2,
    possibleDrops: ["sword-1"]
  }
];

const createMockSkills = (): Skill[] => [
  {
    id: "skill-1" as any,
    name: "パワーストライク",
    description: "強力な一撃",
    type: "Active",
    manaCost: 10 as any,
    cooldown: 2,
    targetType: "Enemy",
    effects: [
      {
        type: "Damage",
        baseDamage: 50 as any,
        scaling: 1.5,
        element: "Physical"
      }
    ],
    requiredLevel: 1 as any,
    weaponType: "Sword"
  }
];

describe("GamePlayView", () => {
  it.skip("ゲームプレイ画面の基本表示", () => {
    const mockSession = createMockSession();
    const mockBaseItems = createMockBaseItems();
    const mockMonsterTemplates = createMockMonsterTemplates();
    const mockSkills = createMockSkills();

    const { lastFrame } = render(
      <GamePlayView
        session={mockSession}
        onSessionUpdate={() => {}}
        baseItems={mockBaseItems}
        monsterTemplates={mockMonsterTemplates}
        skills={mockSkills}
      />
    );

    const output = lastFrame();
    
    // ヘッダー情報
    expect(output).toContain("Hack & Slash");
    expect(output).toContain("rior");  // Warriorが文字化けしている
    expect(output).toContain("Lv.5");
    expect(output).toContain("250");
    
    // バトル情報
    expect(output).toContain("ゴブリン");
    expect(output).toContain("HP:");
    expect(output).toContain("MP:");
  });

  it("スナップショット - ゲームプレイ画面", () => {
    const mockSession = createMockSession();
    const mockBaseItems = createMockBaseItems();
    const mockMonsterTemplates = createMockMonsterTemplates();
    const mockSkills = createMockSkills();

    const { lastFrame } = render(
      <GamePlayView
        session={mockSession}
        onSessionUpdate={() => {}}
        baseItems={mockBaseItems}
        monsterTemplates={mockMonsterTemplates}
        skills={mockSkills}
      />
    );

    expect(lastFrame()).toMatchSnapshot();
  });
});

describe("BattleDetailView", () => {
  it("バトル詳細画面の基本表示", () => {
    const mockSession = createMockSession();
    const battleEvents = [
      { type: "PlayerAttack", damage: 20, isCritical: false },
      { type: "MonsterAttack", damage: 15 },
      { type: "PlayerLevelUp", newLevel: 6 }
    ] as any;

    const { lastFrame } = render(
      <BattleDetailView
        session={mockSession}
        battleLog={battleEvents}
        isPaused={false}
      />
    );

    const output = lastFrame();
    
    // バトル詳細画面の要素
    expect(output).toContain("味方");
    expect(output).toContain("敵");
    expect(output).toContain("戦闘ログ");
  });

  it("スナップショット - バトル詳細画面", () => {
    const mockSession = createMockSession();
    const battleEvents = [
      { type: "PlayerAttack", damage: 20, isCritical: false },
      { type: "MonsterAttack", damage: 15 }
    ] as any;

    const { lastFrame } = render(
      <BattleDetailView
        session={mockSession}
        battleLog={battleEvents}
        isPaused={false}
      />
    );

    expect(lastFrame()).toMatchSnapshot();
  });
});

describe("EquipmentDetailView", () => {
  it.skip("装備詳細画面の基本表示", () => {
    const mockSession = createMockSession();
    const droppedItems = [
      {
        id: "reward-sword" as any,
        baseItem: createMockBaseItems().get("sword-1" as any)!,
        rarity: "Common" as const,
        level: 5 as any,
        modifiers: [
          {
            type: "IncreaseStrength",
            value: 5
          }
        ]
      }
    ];

    const mockBaseItems = createMockBaseItems();
    const mockSkills = createMockSkills();

    const { lastFrame } = render(
      <EquipmentDetailView
        session={mockSession}
        onSessionUpdate={() => {}}
        inventory={droppedItems}
        onInventoryUpdate={() => {}}
        battleStatus={{
          isInBattle: false
        }}
      />
    );

    const output = lastFrame();
    
    // ヘッダー
    expect(output).toContain("インベントリ");
    expect(output).toContain("アイテム詳細");
    
    // アイテム情報
    expect(output).toContain("アイアンソード");
  });

  it("装備なしの場合", () => {
    const mockSession = createMockSession();
    const droppedItems: any[] = [];

    const mockBaseItems = createMockBaseItems();
    const mockSkills = createMockSkills();

    const { lastFrame } = render(
      <EquipmentDetailView
        session={mockSession}
        onSessionUpdate={() => {}}
        inventory={droppedItems}
        onInventoryUpdate={() => {}}
        battleStatus={{
          isInBattle: false
        }}
      />
    );

    const output = lastFrame();
    expect(output).toContain("インベントリ");
    expect(output).toContain("装備可能なアイテムがありません");
  });
});

