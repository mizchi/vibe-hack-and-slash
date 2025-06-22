#!/usr/bin/env tsx
import React, { useState } from "react";
import { render, Text, Box, useInput, useApp } from "ink";

// ボタンコンポーネント
interface ButtonProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
}

const Button: React.FC<ButtonProps> = ({ label, isSelected = false, onPress }) => {
  const borderColor = isSelected ? "cyan" : "gray";
  const textColor = isSelected ? "cyan" : "white";

  return (
    <Box
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      marginRight={1}
    >
      <Text color={textColor} bold={isSelected}>
        {label}
      </Text>
    </Box>
  );
};

// フォーカス可能なボタングループ
interface ButtonGroupProps {
  buttons: { label: string; onPress: () => void }[];
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ buttons }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : buttons.length - 1));
    }
    if (key.rightArrow) {
      setSelectedIndex((prev) => (prev < buttons.length - 1 ? prev + 1 : 0));
    }
    if (key.return || input === " ") {
      buttons[selectedIndex].onPress();
    }
  });

  return (
    <Box>
      {buttons.map((button, index) => (
        <Button
          key={index}
          label={button.label}
          isSelected={index === selectedIndex}
          onPress={button.onPress}
        />
      ))}
    </Box>
  );
};

// 縦並びのメニュー
interface MenuProps {
  items: { label: string; onSelect: () => void }[];
}

const Menu: React.FC<MenuProps> = ({ items }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    }
    if (key.return || input === " ") {
      items[selectedIndex].onSelect();
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index} marginY={0}>
          <Text color={index === selectedIndex ? "cyan" : "white"}>
            {index === selectedIndex ? "▶ " : "  "}
            {item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

// メインアプリ
const App: React.FC = () => {
  const { exit } = useApp();
  const [message, setMessage] = useState("ボタンを選択してください");
  const [count, setCount] = useState(0);

  const horizontalButtons = [
    {
      label: "Attack",
      onPress: () => setMessage("攻撃しました！💥"),
    },
    {
      label: "Defend",
      onPress: () => setMessage("防御態勢を取りました！🛡️"),
    },
    {
      label: "Item",
      onPress: () => setMessage("アイテムを使用しました！🧪"),
    },
    {
      label: "Run",
      onPress: () => setMessage("逃げ出しました！🏃"),
    },
  ];

  const menuItems = [
    {
      label: "カウンターを増やす",
      onSelect: () => {
        setCount((c) => c + 1);
        setMessage(`カウント: ${count + 1}`);
      },
    },
    {
      label: "カウンターをリセット",
      onSelect: () => {
        setCount(0);
        setMessage("カウンターをリセットしました");
      },
    },
    {
      label: "ステータス表示",
      onSelect: () => setMessage(`現在のカウント: ${count}`),
    },
    {
      label: "終了",
      onSelect: () => exit(),
    },
  ];

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold>React Ink ボタン操作 POC</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>操作: 矢印キーで選択 | Enter/Spaceで決定 | Qで終了</Text>
      </Box>

      <Box marginBottom={2}>
        <Box borderStyle="single" padding={1}>
          <Text>{message}</Text>
        </Box>
      </Box>

      <Box marginBottom={2}>
        <Text underline>横並びボタン（左右キーで選択）:</Text>
        <Box marginTop={1}>
          <ButtonGroup buttons={horizontalButtons} />
        </Box>
      </Box>

      <Box>
        <Text underline>縦並びメニュー（上下キーで選択）:</Text>
        <Box marginTop={1} borderStyle="single" padding={1}>
          <Menu items={menuItems} />
        </Box>
      </Box>
    </Box>
  );
};

// レンダリング
render(<App />);