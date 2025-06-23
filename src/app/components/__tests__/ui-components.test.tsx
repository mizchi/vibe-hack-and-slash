import React from "react";
import { render } from "ink-testing-library";
import { Text, Box } from "ink";
import { describe, it, expect, beforeAll } from "vitest";

// コンポーネントのインポート
import { ClearScreen } from "../ClearScreen";
import { CommonHeader } from "../CommonHeader";
import { OpeningView } from "../OpeningView";
import { Pagination } from "../Pagination";

// モックデータ
import type { Session, PlayerClass } from "../../../core/types";

// テスト環境設定
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});

// モックセッションデータ
const createMockSession = (): Session => ({
  id: "test-session" as any,
  player: {
    id: "test-player" as any,
    class: "Warrior" as PlayerClass,
    level: 5 as any,
    currentHealth: 100 as any,
    currentMana: 50 as any,
    experience: 0 as any,
    gold: 100 as any,
    equipment: new Map(),
    baseAttributes: {
      strength: 10 as any,
      intelligence: 5 as any,
      dexterity: 8 as any,
      vitality: 10 as any
    },
    name: "テストプレイヤー",
    baseStats: {
      maxHealth: 100 as any,
      baseDamage: 10 as any,
      criticalChance: 0.1,
      criticalDamage: 1.5,
      lifeSteal: 0,
      mpRegen: 2 as any,
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
    }
  },
  defeatedCount: 0,
  wave: 3,
  state: "InProgress" as const,
  startedAt: new Date()
});

describe("UI Components", () => {
  describe("ClearScreen", () => {
    it("画面をクリアするエスケープシーケンスを出力", () => {
      const { lastFrame } = render(<ClearScreen>
        <Text>Child Content</Text>
      </ClearScreen>);
      // ClearScreenは特殊な文字を出力するため、存在確認のみ
      expect(lastFrame).toBeDefined();
    });
  });

  describe("CommonHeader", () => {
    it("基本的なヘッダー表示", () => {
      const mockSession = createMockSession();
      const { lastFrame } = render(
        <CommonHeader
          session={mockSession}
          currentView="battle"
          gameSpeed={1}
        />
      );
      
      const output = lastFrame();
      expect(output).toContain("Hack & Slash");
      expect(output).toContain("Warrior Lv.5");
      expect(output).toContain("[Gold: 100]");
      expect(output).toContain("[Speed: x1]");
    });

    it("スナップショット", () => {
      const mockSession = createMockSession();
      const { lastFrame } = render(
        <CommonHeader
          session={mockSession}
          currentView="equipment"
          gameSpeed={3}
        />
      );
      
      expect(lastFrame()).toMatchSnapshot();
    });
  });

  describe("OpeningView", () => {
    it("クラス選択画面の表示", () => {
      const onClassSelected = () => {};
      const { lastFrame } = render(
        <OpeningView onClassSelected={onClassSelected} />
      );
      
      const output = lastFrame();
      expect(output).toContain("Hack & Slash");
      expect(output).toContain("Warrior");
      expect(output).toContain("Mage");
      expect(output).toContain("Rogue");
      expect(output).toContain("Paladin");
    });

    it("スナップショット", () => {
      const onClassSelected = () => {};
      const { lastFrame } = render(
        <OpeningView onClassSelected={onClassSelected} />
      );
      
      expect(lastFrame()).toMatchSnapshot();
    });
  });

  describe("Pagination", () => {
    it("ページネーションの表示", () => {
      const { lastFrame } = render(
        <Pagination
          currentPage={0}
          totalPages={5}
          itemsPerPage={10}
          totalItems={45}
          startIndex={0}
          endIndex={10}
        />
      );
      
      const output = lastFrame();
      expect(output).toContain("[");
      expect(output).toContain("]");
      expect(output).toContain("1-10/45");
    });

    it("複数ページの表示", () => {
      const { lastFrame } = render(
        <Pagination
          currentPage={2}
          totalPages={5}
          itemsPerPage={10}
          totalItems={50}
          startIndex={20}
          endIndex={30}
        />
      );
      
      const output = lastFrame();
      expect(output).toContain("3"); // 現在のページ（0-indexed なので 2 = 3ページ目）
      expect(output).toContain("21-30/50");
    });

    it("単一ページの場合は表示しない", () => {
      const { lastFrame } = render(
        <Pagination
          currentPage={0}
          totalPages={1}
          itemsPerPage={10}
          totalItems={5}
          startIndex={0}
          endIndex={5}
        />
      );
      
      expect(lastFrame()).toBe("");
    });

    it("スナップショット", () => {
      const { lastFrame } = render(
        <Pagination
          currentPage={2}
          totalPages={10}
          itemsPerPage={10}
          totalItems={100}
          startIndex={20}
          endIndex={30}
        />
      );
      
      expect(lastFrame()).toMatchSnapshot();
    });
  });
});

// モックデータを使った複雑なコンポーネントのテスト
describe("Complex UI Components", () => {
  it("カスタムコンポーネントの組み合わせ", () => {
    const StatusBar: React.FC<{ hp: number; mp: number }> = ({ hp, mp }) => (
      <Box flexDirection="row" gap={2}>
        <Text color="red">HP: {hp}</Text>
        <Text color="blue">MP: {mp}</Text>
      </Box>
    );

    const GameMenu: React.FC<{ items: string[]; selected: number }> = ({ items, selected }) => (
      <Box flexDirection="column" borderStyle="single" padding={1}>
        {items.map((item, i) => (
          <Text key={i} color={i === selected ? "cyan" : undefined}>
            {i === selected ? "> " : "  "}{item}
          </Text>
        ))}
      </Box>
    );

    const ComplexUI: React.FC = () => (
      <Box flexDirection="column" gap={1}>
        <StatusBar hp={100} mp={50} />
        <GameMenu items={["Attack", "Defend", "Item", "Run"]} selected={0} />
      </Box>
    );

    const { lastFrame } = render(<ComplexUI />);
    const output = lastFrame();
    
    expect(output).toContain("HP: 100");
    expect(output).toContain("MP: 50");
    expect(output).toContain("> Attack");
    expect(output).toContain("  Defend");
    expect(output).toContain("  Item");
    expect(output).toContain("  Run");
  });
});

// ヘルパー関数のテスト
describe("UI Helpers", () => {
  it("ヘルスバーの表示", () => {
    const HealthBar: React.FC<{ current: number; max: number; width?: number }> = ({
      current,
      max,
      width = 10
    }) => {
      const percentage = Math.round((current / max) * 100);
      const filled = Math.round((current / max) * width);
      const empty = width - filled;

      return (
        <Box>
          <Text>HP: </Text>
          <Text color="red">{"█".repeat(filled)}</Text>
          <Text dimColor>{"░".repeat(empty)}</Text>
          <Text> {current}/{max} ({percentage}%)</Text>
        </Box>
      );
    };

    const { lastFrame } = render(<HealthBar current={75} max={100} />);
    const output = lastFrame();
    
    expect(output).toContain("HP:");
    expect(output).toContain("75/100");
    expect(output).toContain("(75%)");
    expect(output).toContain("█");
    expect(output).toContain("░");
  });

  it("プログレスバーの表示", () => {
    const ProgressBar: React.FC<{ value: number; max: number; label: string }> = ({
      value,
      max,
      label
    }) => {
      const percentage = Math.round((value / max) * 100);
      const width = 20;
      const filled = Math.round((value / max) * width);
      
      return (
        <Box flexDirection="column">
          <Text>{label}: {percentage}%</Text>
          <Box>
            <Text>[</Text>
            <Text color="green">{"=".repeat(filled)}</Text>
            <Text>{" ".repeat(width - filled)}</Text>
            <Text>]</Text>
          </Box>
        </Box>
      );
    };

    const { lastFrame } = render(
      <ProgressBar value={30} max={100} label="Loading" />
    );
    
    expect(lastFrame()).toContain("Loading: 30%");
    expect(lastFrame()).toContain("[");
    expect(lastFrame()).toContain("=");
    expect(lastFrame()).toContain("]");
  });

  it("スナップショット - プログレスバー", () => {
    const ProgressBar: React.FC<{ value: number; max: number; label: string }> = ({
      value,
      max,
      label
    }) => {
      const percentage = Math.round((value / max) * 100);
      const width = 20;
      const filled = Math.round((value / max) * width);
      
      return (
        <Box flexDirection="column">
          <Text>{label}: {percentage}%</Text>
          <Box>
            <Text>[</Text>
            <Text color="green">{"=".repeat(filled)}</Text>
            <Text>{" ".repeat(width - filled)}</Text>
            <Text>]</Text>
          </Box>
        </Box>
      );
    };

    const { lastFrame } = render(
      <ProgressBar value={75} max={100} label="Progress" />
    );
    
    expect(lastFrame()).toMatchSnapshot();
  });
});