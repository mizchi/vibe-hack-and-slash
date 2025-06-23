import React from 'react';
import { Box, Text, useInput } from '../../../packages/ink-browser';
import type { PlayerClass } from '../../core/types';

interface ClassSelectionViewProps {
  onSelectClass: (playerClass: PlayerClass) => void;
}

const classDescriptions: Record<PlayerClass, string> = {
  Warrior: "高い体力と防御力を持つ戦士",
  Mage: "強力な魔法と高いマナを持つ魔法使い",
  Rogue: "高いクリティカル率と攻撃速度を持つ盗賊",
  Paladin: "攻撃と防御のバランスが取れた聖騎士",
};

const classStats: Record<PlayerClass, { hp: number; damage: number; defense: number; mana: number }> = {
  Warrior: { hp: 120, damage: 15, defense: 5, mana: 30 },
  Mage: { hp: 80, damage: 8, defense: 2, mana: 100 },
  Rogue: { hp: 90, damage: 12, defense: 3, mana: 50 },
  Paladin: { hp: 110, damage: 12, defense: 4, mana: 60 },
};

export const ClassSelectionView: React.FC<ClassSelectionViewProps> = ({ onSelectClass }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const classes: PlayerClass[] = ["Warrior", "Mage", "Rogue", "Paladin"];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : classes.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < classes.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelectClass(classes[selectedIndex]);
    }
  });

  const selectedClass = classes[selectedIndex];
  const stats = classStats[selectedClass];

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" padding={1} marginBottom={1}>
        <Text bold color="yellow">⚔️  Hack & Slash - クラス選択</Text>
      </Box>

      <Box flexDirection="row">
        <Box flexDirection="column" marginRight={2}>
          {classes.map((cls, index) => (
            <Box key={cls}>
              <Text color={index === selectedIndex ? "green" : undefined}>
                {index === selectedIndex ? "▶ " : "  "}
                {cls}: {classDescriptions[cls]}
              </Text>
            </Box>
          ))}
        </Box>

        <Box borderStyle="single" padding={1}>
          <Box flexDirection="column">
            <Text bold>{selectedClass} のステータス</Text>
            <Text>HP: {stats.hp}</Text>
            <Text>攻撃力: {stats.damage}</Text>
            <Text>防御力: {stats.defense}</Text>
            <Text>マナ: {stats.mana}</Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓: 選択 | Enter: 決定</Text>
      </Box>
    </Box>
  );
};