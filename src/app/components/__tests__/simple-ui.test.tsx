import React from "react";
import { render } from "ink-testing-library";
import { Text, Box } from "ink";
import { describe, it, expect, beforeAll } from "vitest";

// テスト環境設定
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});

describe("シンプルなUIコンポーネントテスト", () => {
  describe("基本的なレイアウト", () => {
    it("ヘッダーコンポーネント", () => {
      const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
        <Box borderStyle="single" padding={1}>
          <Box flexDirection="column">
            <Text bold color="cyan">{title}</Text>
            {subtitle && <Text dimColor>{subtitle}</Text>}
          </Box>
        </Box>
      );

      const { lastFrame } = render(<Header title="ゲームタイトル" subtitle="サブタイトル" />);
      const output = lastFrame();
      
      expect(output).toContain("ゲームタイトル");
      expect(output).toContain("サブタイトル");
    });

    it("ステータスバー", () => {
      const StatusBar: React.FC<{ hp: number; maxHp: number; mp: number; maxMp: number }> = ({
        hp, maxHp, mp, maxMp
      }) => {
        const hpPercent = Math.round((hp / maxHp) * 100);
        const mpPercent = Math.round((mp / maxMp) * 100);
        
        return (
          <Box flexDirection="column" gap={1}>
            <Box>
              <Text color="red">HP: </Text>
              <Text>{hp}/{maxHp} ({hpPercent}%)</Text>
            </Box>
            <Box>
              <Text color="blue">MP: </Text>
              <Text>{mp}/{maxMp} ({mpPercent}%)</Text>
            </Box>
          </Box>
        );
      };

      const { lastFrame } = render(<StatusBar hp={80} maxHp={100} mp={30} maxMp={50} />);
      const output = lastFrame();
      
      expect(output).toContain("HP:");
      expect(output).toContain("80/100 (80%)");
      expect(output).toContain("MP:");
      expect(output).toContain("30/50 (60%)");
    });

    it("メニューリスト", () => {
      const MenuList: React.FC<{ items: string[]; selected: number }> = ({ items, selected }) => (
        <Box flexDirection="column">
          {items.map((item, i) => (
            <Box key={i}>
              <Text color={i === selected ? "cyan" : undefined}>
                {i === selected ? "▶ " : "  "}
              </Text>
              <Text color={i === selected ? "cyan" : undefined}>
                {item}
              </Text>
            </Box>
          ))}
        </Box>
      );

      const { lastFrame } = render(
        <MenuList items={["新規ゲーム", "続きから", "設定", "終了"]} selected={1} />
      );
      const output = lastFrame();
      
      expect(output).toContain("  新規ゲーム");
      expect(output).toContain("▶  続きから");
      expect(output).toContain("  設定");
      expect(output).toContain("  終了");
    });
  });

  describe("ゲームUI要素", () => {
    it("バトルログ", () => {
      const BattleLog: React.FC<{ logs: string[] }> = ({ logs }) => (
        <Box borderStyle="single" padding={1} height={6}>
          <Box flexDirection="column">
            {logs.slice(-5).map((log, i) => (
              <Text key={i} dimColor={i < logs.length - 1}>
                {log}
              </Text>
            ))}
          </Box>
        </Box>
      );

      const logs = [
        "バトル開始！",
        "プレイヤーの攻撃！",
        "モンスターに20ダメージ！",
        "モンスターの攻撃！",
        "プレイヤーに15ダメージ！"
      ];

      const { lastFrame } = render(<BattleLog logs={logs} />);
      const output = lastFrame();
      
      // 最後の5個のログのみ表示されるため、古いログは表示されない場合がある
      expect(output).toContain("モンスターに20ダメージ！");
      expect(output).toContain("プレイヤーに15ダメージ！");
    });

    it("アイテム表示", () => {
      const ItemDisplay: React.FC<{ name: string; rarity: string; level: number }> = ({
        name, rarity, level
      }) => {
        const rarityColors = {
          common: "white",
          uncommon: "green",
          rare: "blue",
          epic: "magenta",
          legendary: "yellow"
        };
        
        return (
          <Box borderStyle="round" padding={1}>
            <Box flexDirection="column">
              <Box>
                <Text color={rarityColors[rarity as keyof typeof rarityColors] || "white"}>
                  {name}
                </Text>
                <Text dimColor> Lv.{level}</Text>
              </Box>
              <Text dimColor>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)} Item
              </Text>
            </Box>
          </Box>
        );
      };

      const { lastFrame } = render(
        <ItemDisplay name="炎の剣" rarity="epic" level={10} />
      );
      const output = lastFrame();
      
      expect(output).toContain("炎の剣");
      expect(output).toContain("Lv.10");
      expect(output).toContain("Epic Item");
    });

    it("プログレスバー", () => {
      const ProgressBar: React.FC<{ 
        current: number; 
        max: number; 
        label: string;
        color?: string;
        width?: number;
      }> = ({ current, max, label, color = "green", width = 20 }) => {
        const percentage = Math.round((current / max) * 100);
        const filled = Math.round((current / max) * width);
        const empty = width - filled;
        
        return (
          <Box flexDirection="column">
            <Box>
              <Text>{label}: </Text>
              <Text color={color}>{current}/{max}</Text>
              <Text dimColor> ({percentage}%)</Text>
            </Box>
            <Box>
              <Text>[</Text>
              <Text color={color}>{"█".repeat(filled)}</Text>
              <Text dimColor>{"░".repeat(empty)}</Text>
              <Text>]</Text>
            </Box>
          </Box>
        );
      };

      const { lastFrame } = render(
        <ProgressBar current={750} max={1000} label="経験値" color="yellow" />
      );
      const output = lastFrame();
      
      expect(output).toContain("経験値: 750/1000 (75%)");
      expect(output).toContain("[");
      expect(output).toContain("█");
      expect(output).toContain("░");
      expect(output).toContain("]");
    });
  });

  describe("スナップショットテスト", () => {
    it("複雑なUIレイアウト", () => {
      const ComplexUI: React.FC = () => (
        <Box flexDirection="column" gap={1}>
          <Box borderStyle="double" padding={1}>
            <Text bold color="cyan">⚔️  Hack & Slash RPG</Text>
          </Box>
          
          <Box gap={2}>
            <Box flexDirection="column" width="50%">
              <Text bold underline>プレイヤー情報</Text>
              <Text color="green">Lv.10 戦士</Text>
              <Text color="red">HP: 80/100</Text>
              <Text color="blue">MP: 30/50</Text>
              <Text color="yellow">Gold: 500</Text>
            </Box>
            
            <Box flexDirection="column" width="50%">
              <Text bold underline>現在の敵</Text>
              <Text color="magenta">ドラゴン Lv.15</Text>
              <Text color="red">HP: 200/300</Text>
              <Text dimColor>火属性・飛行タイプ</Text>
            </Box>
          </Box>
          
          <Box borderStyle="single" padding={1}>
            <Text dimColor>
              [A] 攻撃 | [S] スキル | [I] アイテム | [R] 逃げる
            </Text>
          </Box>
        </Box>
      );

      const { lastFrame } = render(<ComplexUI />);
      expect(lastFrame()).toMatchSnapshot();
    });

    it("アイテムリスト", () => {
      const ItemList: React.FC = () => {
        const items = [
          { name: "ポーション", count: 5, key: "1" },
          { name: "エリクサー", count: 2, key: "2" },
          { name: "不死鳥の尾", count: 1, key: "3" }
        ];
        
        return (
          <Box borderStyle="round" padding={1}>
            <Box flexDirection="column">
              <Text bold underline>アイテム一覧</Text>
              <Box marginTop={1} flexDirection="column">
                {items.map((item, i) => (
                  <Box key={item.key}>
                    <Text color={i === 0 ? "cyan" : undefined}>
                      {i === 0 ? "▶ " : "  "}
                    </Text>
                    <Text>{item.name}</Text>
                    <Text dimColor> x{item.count}</Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        );
      };

      const { lastFrame } = render(<ItemList />);
      expect(lastFrame()).toMatchSnapshot();
    });

    it("バトル結果画面", () => {
      const BattleResult: React.FC = () => (
        <Box flexDirection="column" alignItems="center" padding={2}>
          <Text bold color="yellow">VICTORY!</Text>
          <Box marginTop={1} flexDirection="column" alignItems="center">
            <Text>獲得経験値: 150 EXP</Text>
            <Text color="yellow">獲得ゴールド: 50 G</Text>
            <Box marginTop={1}>
              <Text dimColor>獲得アイテム: </Text>
              <Text color="green">鉄の剣</Text>
            </Box>
          </Box>
          <Box marginTop={2}>
            <Text dimColor>[ENTER] 続ける</Text>
          </Box>
        </Box>
      );

      const { lastFrame } = render(<BattleResult />);
      expect(lastFrame()).toMatchSnapshot();
    });
  });
});