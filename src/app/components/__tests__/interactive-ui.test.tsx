import React, { useState } from "react";
import { render } from "ink-testing-library";
import { Text, Box, useInput } from "ink";
import { describe, it, expect, beforeAll } from "vitest";

// テスト環境設定
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});

describe("インタラクティブUIテスト", () => {
  it("キー入力によるメニュー選択", () => {
    const InteractiveMenu: React.FC = () => {
      const [selectedIndex, setSelectedIndex] = useState(0);
      const items = ["新規ゲーム", "続きから", "設定", "終了"];

      useInput((input, key) => {
        if (key.upArrow) {
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
        if (key.downArrow) {
          setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
        }
      });

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

    const { lastFrame, stdin } = render(<InteractiveMenu />);
    
    // 初期状態
    expect(lastFrame()).toContain("▶ 新規ゲーム");
    expect(lastFrame()).toContain("  続きから");
    
    // 下矢印キーを押す
    stdin.write("\x1B[B"); // Down arrow
    expect(lastFrame()).toContain("  新規ゲーム");
    expect(lastFrame()).toContain("▶ 続きから");
    
    // もう一度下矢印
    stdin.write("\x1B[B");
    expect(lastFrame()).toContain("▶ 設定");
    
    // 上矢印キーを押す
    stdin.write("\x1B[A"); // Up arrow
    expect(lastFrame()).toContain("▶ 続きから");
  });

  it("Enterキーでアクションを実行", () => {
    let selectedAction = "";
    
    const ActionMenu: React.FC = () => {
      const [selectedIndex, setSelectedIndex] = useState(0);
      const [message, setMessage] = useState("");
      const items = ["攻撃", "防御", "逃げる"];

      useInput((input, key) => {
        if (key.upArrow) {
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
        if (key.downArrow) {
          setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
        }
        if (key.return) {
          selectedAction = items[selectedIndex];
          setMessage(`${items[selectedIndex]}を選択しました！`);
        }
      });

      return (
        <Box flexDirection="column">
          <Box flexDirection="column">
            {items.map((item, index) => (
              <Text key={index} color={index === selectedIndex ? "cyan" : undefined}>
                {index === selectedIndex ? "▶ " : "  "}{item}
              </Text>
            ))}
          </Box>
          {message && (
            <Box marginTop={1}>
              <Text color="green">{message}</Text>
            </Box>
          )}
        </Box>
      );
    };

    const { lastFrame, stdin } = render(<ActionMenu />);
    
    // 初期状態
    expect(lastFrame()).toContain("▶ 攻撃");
    
    // 下矢印で「防御」を選択
    stdin.write("\x1B[B");
    expect(lastFrame()).toContain("▶ 防御");
    
    // Enterキーを押す
    stdin.write("\r");
    expect(lastFrame()).toContain("防御を選択しました！");
    expect(selectedAction).toBe("防御");
  });

  it("左右キーでタブ切り替え", () => {
    const TabView: React.FC = () => {
      const [currentTab, setCurrentTab] = useState(0);
      const tabs = ["ステータス", "装備", "スキル"];

      useInput((input, key) => {
        if (key.leftArrow) {
          setCurrentTab((prev) => Math.max(0, prev - 1));
        }
        if (key.rightArrow) {
          setCurrentTab((prev) => Math.min(tabs.length - 1, prev + 1));
        }
      });

      return (
        <Box flexDirection="column">
          <Box>
            {tabs.map((tab, index) => (
              <Box key={index} marginRight={2}>
                <Text 
                  color={index === currentTab ? "cyan" : undefined}
                  bold={index === currentTab}
                >
                  [{index === currentTab ? "●" : " "}] {tab}
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1} borderStyle="single" padding={1}>
            <Text>{tabs[currentTab]}の内容</Text>
          </Box>
        </Box>
      );
    };

    const { lastFrame, stdin } = render(<TabView />);
    
    // 初期状態
    expect(lastFrame()).toContain("[●] ステータス");
    expect(lastFrame()).toContain("[ ] 装備");
    expect(lastFrame()).toContain("ステータスの内容");
    
    // 右矢印キー
    stdin.write("\x1B[C");
    expect(lastFrame()).toContain("[ ] ステータス");
    expect(lastFrame()).toContain("[●] 装備");
    expect(lastFrame()).toContain("装備の内容");
    
    // もう一度右矢印
    stdin.write("\x1B[C");
    expect(lastFrame()).toContain("[●] スキル");
    expect(lastFrame()).toContain("スキルの内容");
    
    // 左矢印で戻る
    stdin.write("\x1B[D");
    expect(lastFrame()).toContain("[●] 装備");
  });

  it("数値入力", () => {
    const NumberInput: React.FC = () => {
      const [value, setValue] = useState(0);
      const [message, setMessage] = useState("");

      useInput((input, key) => {
        // 数字キー入力
        if (input >= "0" && input <= "9") {
          const newValue = value * 10 + parseInt(input);
          if (newValue <= 999) {
            setValue(newValue);
          }
        }
        // Backspaceで削除
        if (key.backspace || key.delete) {
          setValue(Math.floor(value / 10));
        }
        // Enterで確定
        if (key.return && value > 0) {
          setMessage(`${value}を入力しました！`);
        }
      });

      return (
        <Box flexDirection="column">
          <Text>数値を入力: </Text>
          <Box borderStyle="single" padding={1}>
            <Text color="cyan">{value || "---"}</Text>
          </Box>
          {message && (
            <Box marginTop={1}>
              <Text color="green">{message}</Text>
            </Box>
          )}
        </Box>
      );
    };

    const { lastFrame, stdin } = render(<NumberInput />);
    
    // 初期状態
    expect(lastFrame()).toContain("---");
    
    // 数字を入力
    stdin.write("1");
    expect(lastFrame()).toContain("1");
    
    stdin.write("2");
    stdin.write("3");
    expect(lastFrame()).toContain("123");
    
    // Backspaceで削除
    stdin.write("\x7F");
    expect(lastFrame()).toContain("12");
    
    // Enterで確定
    stdin.write("\r");
    expect(lastFrame()).toContain("12を入力しました！");
  });

  it("複合的な操作 - RPGインベントリ", () => {
    const RPGInventory: React.FC = () => {
      const [selectedItem, setSelectedItem] = useState(0);
      const [selectedAction, setSelectedAction] = useState(0);
      const [showActions, setShowActions] = useState(false);
      const [message, setMessage] = useState("");
      
      const items = ["ポーション", "エリクサー", "不死鳥の尾"];
      const actions = ["使う", "捨てる", "キャンセル"];

      useInput((input, key) => {
        if (!showActions) {
          // アイテム選択モード
          if (key.upArrow) {
            setSelectedItem((prev) => Math.max(0, prev - 1));
          }
          if (key.downArrow) {
            setSelectedItem((prev) => Math.min(items.length - 1, prev + 1));
          }
          if (key.return) {
            setShowActions(true);
            setSelectedAction(0);
          }
        } else {
          // アクション選択モード
          if (key.upArrow) {
            setSelectedAction((prev) => Math.max(0, prev - 1));
          }
          if (key.downArrow) {
            setSelectedAction((prev) => Math.min(actions.length - 1, prev + 1));
          }
          if (key.return) {
            const item = items[selectedItem];
            const action = actions[selectedAction];
            
            if (action === "使う") {
              setMessage(`${item}を使用しました！`);
            } else if (action === "捨てる") {
              setMessage(`${item}を捨てました`);
            }
            
            setShowActions(false);
          }
          if (key.escape) {
            setShowActions(false);
          }
        }
      });

      return (
        <Box flexDirection="column">
          <Text bold>インベントリ</Text>
          <Box marginTop={1}>
            {!showActions ? (
              <Box flexDirection="column">
                {items.map((item, index) => (
                  <Text key={index} color={index === selectedItem ? "cyan" : undefined}>
                    {index === selectedItem ? "▶ " : "  "}{item}
                  </Text>
                ))}
              </Box>
            ) : (
              <Box flexDirection="row" gap={2}>
                <Box flexDirection="column">
                  {items.map((item, index) => (
                    <Text key={index} dimColor={index !== selectedItem}>
                      {index === selectedItem ? "● " : "  "}{item}
                    </Text>
                  ))}
                </Box>
                <Box flexDirection="column">
                  <Text underline>アクション</Text>
                  {actions.map((action, index) => (
                    <Text key={index} color={index === selectedAction ? "cyan" : undefined}>
                      {index === selectedAction ? "▶ " : "  "}{action}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          {message && (
            <Box marginTop={1}>
              <Text color="green">{message}</Text>
            </Box>
          )}
        </Box>
      );
    };

    const { lastFrame, stdin } = render(<RPGInventory />);
    
    // エリクサーを選択
    stdin.write("\x1B[B"); // 下矢印
    expect(lastFrame()).toContain("▶ エリクサー");
    
    // Enterでアクションメニューを開く
    stdin.write("\r");
    expect(lastFrame()).toContain("● エリクサー");
    expect(lastFrame()).toContain("▶ 使う");
    
    // 「捨てる」を選択
    stdin.write("\x1B[B");
    expect(lastFrame()).toContain("▶ 捨てる");
    
    // 実行
    stdin.write("\r");
    expect(lastFrame()).toContain("エリクサーを捨てました");
  });
});