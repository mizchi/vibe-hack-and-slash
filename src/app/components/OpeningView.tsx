import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { PlayerClass } from "../../core/types.ts";

type Props = {
  onClassSelected: (playerClass: PlayerClass) => void;
};

export const OpeningView: React.FC<Props> = ({ onClassSelected }) => {
  const classes: PlayerClass[] = ["Warrior", "Mage", "Rogue", "Paladin"];
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const classDescriptions = {
    Warrior: "高い体力と防御力を持つ戦士",
    Mage: "強力な魔法と高いマナを持つ魔法使い",
    Rogue: "高いクリティカル率と攻撃速度を持つ盗賊",
    Paladin: "攻撃と防御のバランスが取れた聖騎士"
  };

  const classStats = {
    Warrior: { hp: "120", atk: "15", def: "5", mana: "30" },
    Mage: { hp: "80", atk: "8", def: "0", mana: "100" },
    Rogue: { hp: "90", atk: "12", def: "2", mana: "50" },
    Paladin: { hp: "110", atk: "12", def: "8", mana: "60" }
  };

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(Math.min(classes.length - 1, selectedIndex + 1));
    }
    if (key.return) {
      onClassSelected(classes[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" padding={1} marginBottom={1}>
        <Text bold>⚔️  Hack & Slash - クラス選択</Text>
      </Box>
      
      <Box flexDirection="row">
        <Box flexDirection="column" width="60%">
          {classes.map((cls, index) => (
            <Box key={cls} marginBottom={1}>
              <Text color={index === selectedIndex ? "cyan" : undefined}>
                {index === selectedIndex ? "▶ " : "  "}
                {cls}: {classDescriptions[cls]}
              </Text>
            </Box>
          ))}
        </Box>
        
        <Box flexDirection="column" width="40%" borderStyle="single" padding={1}>
          <Text bold underline>
            {classes[selectedIndex]} のステータス
          </Text>
          <Text>HP: {classStats[classes[selectedIndex]].hp}</Text>
          <Text>攻撃力: {classStats[classes[selectedIndex]].atk}</Text>
          <Text>防御力: {classStats[classes[selectedIndex]].def}</Text>
          <Text>マナ: {classStats[classes[selectedIndex]].mana}</Text>
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>↑↓: 選択 | Enter: 決定</Text>
      </Box>
    </Box>
  );
};