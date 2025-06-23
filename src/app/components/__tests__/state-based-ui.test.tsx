import React, { useState } from "react";
import { render } from "ink-testing-library";
import { Text, Box } from "ink";
import { describe, it, expect, beforeAll } from "vitest";

// テスト環境設定
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});

describe("状態ベースのUIテスト", () => {
  it("選択状態によるメニュー表示", () => {
    const MenuWithState: React.FC<{ selectedIndex: number }> = ({ selectedIndex }) => {
      const items = ["新規ゲーム", "続きから", "設定", "終了"];

      return (
        <Box flexDirection="column">
          {items.map((item, index) => (
            <Text key={index} color={index === selectedIndex ? "cyan" : undefined}>
              {index === selectedIndex ? "▶ " : "  "}{item}
            </Text>
          ))}
        </Box>
      );
    };

    // 初期状態
    const { lastFrame, rerender } = render(<MenuWithState selectedIndex={0} />);
    expect(lastFrame()).toContain("▶ 新規ゲーム");
    expect(lastFrame()).toContain("  続きから");
    
    // 選択を変更
    rerender(<MenuWithState selectedIndex={1} />);
    expect(lastFrame()).toContain("  新規ゲーム");
    expect(lastFrame()).toContain("▶ 続きから");
    
    // 最後の項目を選択
    rerender(<MenuWithState selectedIndex={3} />);
    expect(lastFrame()).toContain("▶ 終了");
  });

  it("HP/MPバーの状態変化", () => {
    const StatusBar: React.FC<{ hp: number; maxHp: number; mp: number; maxMp: number }> = ({
      hp, maxHp, mp, maxMp
    }) => {
      const hpPercent = Math.round((hp / maxHp) * 100);
      const mpPercent = Math.round((mp / maxMp) * 100);
      const hpWidth = 10;
      const mpWidth = 10;
      const hpFilled = Math.round((hp / maxHp) * hpWidth);
      const mpFilled = Math.round((mp / maxMp) * mpWidth);
      
      return (
        <Box flexDirection="column">
          <Box>
            <Text color="red">HP: </Text>
            <Text color="red">{"█".repeat(hpFilled)}</Text>
            <Text dimColor>{"░".repeat(hpWidth - hpFilled)}</Text>
            <Text> {hp}/{maxHp} ({hpPercent}%)</Text>
          </Box>
          <Box>
            <Text color="blue">MP: </Text>
            <Text color="blue">{"█".repeat(mpFilled)}</Text>
            <Text dimColor>{"░".repeat(mpWidth - mpFilled)}</Text>
            <Text> {mp}/{maxMp} ({mpPercent}%)</Text>
          </Box>
        </Box>
      );
    };

    const { lastFrame, rerender } = render(
      <StatusBar hp={100} maxHp={100} mp={50} maxMp={50} />
    );
    
    // フルヘルス状態
    expect(lastFrame()).toContain("HP: ██████████ 100/100 (100%)");
    expect(lastFrame()).toContain("MP: ██████████ 50/50 (100%)");
    
    // ダメージを受けた状態
    rerender(<StatusBar hp={30} maxHp={100} mp={10} maxMp={50} />);
    expect(lastFrame()).toContain("HP: ███░░░░░░░ 30/100 (30%)");
    expect(lastFrame()).toContain("MP: ██░░░░░░░░ 10/50 (20%)");
    
    // 瀕死状態
    rerender(<StatusBar hp={5} maxHp={100} mp={0} maxMp={50} />);
    expect(lastFrame()).toContain("HP: █░░░░░░░░░ 5/100 (5%)");
    expect(lastFrame()).toContain("MP: ░░░░░░░░░░ 0/50 (0%)");
  });

  it("タブ切り替えUI", () => {
    const TabView: React.FC<{ currentTab: number }> = ({ currentTab }) => {
      const tabs = ["ステータス", "装備", "スキル"];
      const contents = [
        "HP: 100/100\nMP: 50/50\n攻撃力: 25",
        "武器: 鉄の剣\n防具: 革の鎧\nアクセサリ: なし",
        "ファイアボール Lv.3\nヒール Lv.2\nバフ Lv.1"
      ];

      return (
        <Box flexDirection="column">
          <Box>
            {tabs.map((tab, index) => (
              <Box key={index} marginRight={2}>
                <Text 
                  color={index === currentTab ? "cyan" : undefined}
                  bold={index === currentTab}
                  underline={index === currentTab}
                >
                  {tab}
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1} borderStyle="single" padding={1}>
            <Text>{contents[currentTab]}</Text>
          </Box>
        </Box>
      );
    };

    const { lastFrame, rerender } = render(<TabView currentTab={0} />);
    
    // ステータスタブ
    expect(lastFrame()).toContain("ステータス");
    expect(lastFrame()).toContain("HP: 100/100");
    expect(lastFrame()).toContain("攻撃力: 25");
    
    // 装備タブに切り替え
    rerender(<TabView currentTab={1} />);
    expect(lastFrame()).toContain("武器: 鉄の剣");
    expect(lastFrame()).toContain("革の鎧");
    
    // スキルタブに切り替え
    rerender(<TabView currentTab={2} />);
    expect(lastFrame()).toContain("ファイアボール Lv.3");
    expect(lastFrame()).toContain("ヒール Lv.2");
  });

  it("アイテム選択と詳細表示", () => {
    interface Item {
      name: string;
      description: string;
      stats: string;
    }

    const ItemSelector: React.FC<{ selectedIndex: number; showDetail: boolean }> = ({ 
      selectedIndex, 
      showDetail 
    }) => {
      const items: Item[] = [
        {
          name: "炎の剣",
          description: "炎をまとった魔法の剣",
          stats: "攻撃力: +20, 火属性: +10"
        },
        {
          name: "氷の盾",
          description: "氷で作られた魔法の盾",
          stats: "防御力: +15, 氷耐性: +20%"
        },
        {
          name: "風のブーツ",
          description: "風の加護を受けたブーツ",
          stats: "素早さ: +10, 回避率: +5%"
        }
      ];

      return (
        <Box flexDirection="row" gap={2}>
          <Box flexDirection="column">
            <Text bold underline>アイテム一覧</Text>
            {items.map((item, index) => (
              <Text key={index} color={index === selectedIndex ? "cyan" : undefined}>
                {index === selectedIndex ? "▶ " : "  "}{item.name}
              </Text>
            ))}
          </Box>
          {showDetail && (
            <Box borderStyle="round" padding={1} width={30}>
              <Box flexDirection="column">
                <Text bold color="yellow">{items[selectedIndex].name}</Text>
                <Text dimColor>{items[selectedIndex].description}</Text>
                <Box marginTop={1}>
                  <Text color="green">{items[selectedIndex].stats}</Text>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      );
    };

    const { lastFrame, rerender } = render(
      <ItemSelector selectedIndex={0} showDetail={false} />
    );
    
    // アイテム一覧のみ表示
    expect(lastFrame()).toContain("▶ 炎の剣");
    expect(lastFrame()).not.toContain("炎をまとった魔法の剣");
    
    // 詳細を表示
    rerender(<ItemSelector selectedIndex={0} showDetail={true} />);
    expect(lastFrame()).toContain("炎をまとった魔法の剣");
    expect(lastFrame()).toContain("攻撃力: +20");
    
    // 別のアイテムを選択
    rerender(<ItemSelector selectedIndex={1} showDetail={true} />);
    expect(lastFrame()).toContain("▶ 氷の盾");
    expect(lastFrame()).toContain("氷で作られた魔法の盾");
    expect(lastFrame()).toContain("防御力: +15");
  });

  it("ゲーム状態による画面切り替え", () => {
    type GameState = "title" | "playing" | "gameOver" | "victory";

    const GameScreen: React.FC<{ state: GameState; score: number }> = ({ state, score }) => {
      switch (state) {
        case "title":
          return (
            <Box flexDirection="column" alignItems="center">
              <Text bold color="cyan">⚔️  ADVENTURE GAME ⚔️</Text>
              <Box marginTop={1}>
                <Text>Press ENTER to start</Text>
              </Box>
            </Box>
          );
        
        case "playing":
          return (
            <Box flexDirection="column">
              <Text bold>冒険中...</Text>
              <Text color="yellow">スコア: {score}</Text>
              <Box marginTop={1}>
                <Text dimColor>[←→] 移動 | [Space] ジャンプ | [Q] 終了</Text>
              </Box>
            </Box>
          );
        
        case "gameOver":
          return (
            <Box flexDirection="column" alignItems="center">
              <Text bold color="red">GAME OVER</Text>
              <Text>最終スコア: {score}</Text>
              <Box marginTop={1}>
                <Text dimColor>Press R to retry</Text>
              </Box>
            </Box>
          );
        
        case "victory":
          return (
            <Box flexDirection="column" alignItems="center">
              <Text bold color="yellow">🎉 VICTORY! 🎉</Text>
              <Text color="green">クリアスコア: {score}</Text>
              <Box marginTop={1}>
                <Text>素晴らしいプレイでした！</Text>
              </Box>
            </Box>
          );
      }
    };

    const { lastFrame, rerender } = render(<GameScreen state="title" score={0} />);
    
    // タイトル画面
    expect(lastFrame()).toContain("ADVENTURE GAME");
    expect(lastFrame()).toContain("Press ENTER to start");
    
    // プレイ中
    rerender(<GameScreen state="playing" score={1250} />);
    expect(lastFrame()).toContain("冒険中...");
    expect(lastFrame()).toContain("スコア: 1250");
    
    // ゲームオーバー
    rerender(<GameScreen state="gameOver" score={1250} />);
    expect(lastFrame()).toContain("GAME OVER");
    expect(lastFrame()).toContain("最終スコア: 1250");
    
    // 勝利
    rerender(<GameScreen state="victory" score={5000} />);
    expect(lastFrame()).toContain("VICTORY!");
    expect(lastFrame()).toContain("クリアスコア: 5000");
  });

  it("スナップショットテスト - 複雑なレイアウト", () => {
    const ComplexLayout: React.FC = () => (
      <Box flexDirection="column" gap={1}>
        <Box borderStyle="double" padding={1}>
          <Text bold color="cyan">⚔️  GAME STATUS ⚔️</Text>
        </Box>
        
        <Box flexDirection="row" gap={2}>
          <Box borderStyle="single" padding={1} width="50%">
            <Box flexDirection="column">
              <Text bold underline>プレイヤー</Text>
              <Text color="green">Lv.15 勇者</Text>
              <Text color="red">HP: ████████░░ 80/100</Text>
              <Text color="blue">MP: ██████░░░░ 30/50</Text>
              <Text color="yellow">Gold: 1,234</Text>
            </Box>
          </Box>
          
          <Box borderStyle="single" padding={1} width="50%">
            <Box flexDirection="column">
              <Text bold underline>装備</Text>
              <Text color="magenta">武器: 伝説の剣</Text>
              <Text color="cyan">防具: ミスリルアーマー</Text>
              <Text color="green">アクセ: 力のリング</Text>
            </Box>
          </Box>
        </Box>
        
        <Box borderStyle="round" padding={1}>
          <Text dimColor>
            [A] 攻撃 | [S] スキル | [I] アイテム | [R] 逃げる | [Q] 終了
          </Text>
        </Box>
      </Box>
    );

    const { lastFrame } = render(<ComplexLayout />);
    expect(lastFrame()).toMatchSnapshot();
  });
});