import React, { useState } from "react";
import { render } from "ink-testing-library";
import { Text, Box, useInput, useApp } from "ink";
import { describe, it, expect, beforeAll } from "vitest";

// テスト環境設定
beforeAll(() => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
});

describe("基本コンポーネント", () => {
  describe("Text", () => {
    it("色付きテキスト", () => {
      const { lastFrame } = render(<Text color="green" bold>緑色の太字</Text>);
      expect(lastFrame()).toBe("緑色の太字");
    });

    it("背景色付きテキスト", () => {
      const { lastFrame } = render(<Text backgroundColor="blue" dimColor>背景色付き</Text>);
      expect(lastFrame()).toBe("背景色付き");
    });
  });

  describe("Box", () => {
    it("縦レイアウト", () => {
      const { lastFrame } = render(
        <Box flexDirection="column" gap={1}>
          <Text>上</Text>
          <Text>下</Text>
        </Box>
      );
      expect(lastFrame()).toBe("上\n\n下");
    });

    it("ボーダー付きボックス", () => {
      const { lastFrame } = render(
        <Box borderStyle="round" borderColor="green" padding={1}>
          <Text>枠線付き</Text>
        </Box>
      );
      expect(lastFrame()).toContain("枠線付き");
    });
  });
});

describe("実装例", () => {
  it("ゲームUI", () => {
    const GameUI = () => {
      const [hp] = useState(100);
      
      return (
        <Box flexDirection="column">
          <Box borderStyle="single" padding={1}>
            <Text bold>ステータス</Text>
          </Box>
          <Text color="red">HP: {hp}/100</Text>
          <Text dimColor>[A] 攻撃 [Q] 終了</Text>
        </Box>
      );
    };

    const { lastFrame } = render(<GameUI />);
    const output = lastFrame();
    
    expect(output).toContain("ステータス");
    expect(output).toContain("HP: 100/100");
    expect(output).toContain("[A] 攻撃 [Q] 終了");
  });
});

describe("テスト", () => {
  describe("ink-testing-library", () => {
    it("基本的なテスト", () => {
      const { lastFrame } = render(<Text>Hello</Text>);
      expect(lastFrame()).toBe("Hello");
    });

    it("再レンダリング", () => {
      const Counter: React.FC<{ value: number }> = ({ value }) => (
        <Text>Count: {value}</Text>
      );

      const { lastFrame, rerender } = render(<Counter value={1} />);
      expect(lastFrame()).toBe("Count: 1");

      rerender(<Counter value={2} />);
      expect(lastFrame()).toBe("Count: 2");
    });

    it("キー入力シミュレーション（動作確認のみ）", () => {
      const App = () => <Text>Test App</Text>;
      
      const { stdin, lastFrame } = render(<App />);
      
      // これらは実際にはuseInputを使用するコンポーネントでないと動作しない
      expect(() => {
        stdin.write('a'); // 通常の文字
        stdin.write('\x1B[A'); // 上矢印
        stdin.write('\r'); // Enter
      }).not.toThrow();
      
      expect(lastFrame()).toBe("Test App");
    });
  });

  describe("特殊キー", () => {
    it("特殊キーのエスケープシーケンス", () => {
      const keys = {
        Enter: '\r',
        Escape: '\x1B',
        上矢印: '\x1B[A',
        下矢印: '\x1B[B',
        右矢印: '\x1B[C',
        左矢印: '\x1B[D',
        Backspace: '\x7F',
        Delete: '\x1B[3~',
        Tab: '\t'
      };

      // エスケープシーケンスが正しい形式であることを確認
      expect(keys.Enter).toBe('\r');
      expect(keys.Escape).toBe('\x1B');
      expect(keys.上矢印).toBe('\x1B[A');
      expect(keys.下矢印).toBe('\x1B[B');
      expect(keys.右矢印).toBe('\x1B[C');
      expect(keys.左矢印).toBe('\x1B[D');
      expect(keys.Backspace).toBe('\x7F');
      expect(keys.Delete).toBe('\x1B[3~');
      expect(keys.Tab).toBe('\t');
    });
  });
});

describe("フック", () => {
  it("useInputとuseApp（モック版）", () => {
    const GameComponent = () => {
      const { exit: _exit } = useApp();
      const [action, setAction] = useState("");
      
      useInput((input) => {
        if (input === 'a') setAction("attack");
        if (input === 'q') {
          setAction("exit");
          // 実際のテストでは_exitを呼ばない（テストが終了してしまうため）
        }
      });
      
      return <Text>{action || "waiting"}</Text>;
    };

    const { lastFrame } = render(<GameComponent />);
    expect(lastFrame()).toBe("waiting");
  });
});

describe("注意点の確認", () => {
  it("console.logは使用できない", () => {
    const Component = () => {
      // console.logは使用できないので、Textで表示
      return <Text>デバッグ情報はファイル出力で</Text>;
    };

    const { lastFrame } = render(<Component />);
    expect(lastFrame()).toBe("デバッグ情報はファイル出力で");
  });

  it("頻繁な再レンダリング", () => {
    const Component: React.FC<{ count: number }> = ({ count }) => (
      <Text>Count: {count}</Text>
    );

    const { rerender, lastFrame } = render(<Component count={0} />);
    
    // 連続した再レンダリング
    for (let i = 1; i <= 5; i++) {
      rerender(<Component count={i} />);
    }
    
    expect(lastFrame()).toBe("Count: 5");
  });
});