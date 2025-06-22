import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { Session, Item, BattleEvent, GameAction } from "../core/types.ts";
import { createInitialPlayer, createSession, processBattleTurn, processAction } from "../core/session.ts";
import { getItemDisplayName, getItemStats } from "../core/loot.ts";
import { calculateTotalStats } from "../core/combat.ts";

// データ読み込み（実際はinfra層で行うべき）
import itemsData from "../../data/items.json" assert { type: "json" };
import monstersData from "../../data/monsters.json" assert { type: "json" };

// UI components
const HealthBar: React.FC<{ current: number; max: number; label: string; color: string }> = ({
  current,
  max,
  label,
  color,
}) => {
  const percentage = Math.round((current / max) * 100);
  const barLength = 20;
  const filled = Math.round((current / max) * barLength);
  const empty = barLength - filled;

  return (
    <Box>
      <Text color={color}>{label}: </Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {current}/{max} ({percentage}%)</Text>
    </Box>
  );
};

const BattleLog: React.FC<{ events: BattleEvent[] }> = ({ events }) => {
  const formatEvent = (event: BattleEvent): string => {
    switch (event.type) {
      case "PlayerAttack":
        return event.isCritical
          ? `⚔️  クリティカル！ ${event.damage}のダメージ！`
          : `⚔️  ${event.damage}のダメージを与えた`;
      case "MonsterAttack":
        return `🗡️  ${event.damage}のダメージを受けた`;
      case "PlayerHeal":
        return `💚 ${event.amount}回復した`;
      case "MonsterDefeated":
        return `✨ モンスターを倒した！ +${event.experience}EXP`;
      case "ItemDropped":
        return `📦 ${getItemDisplayName(event.item)}を入手！`;
      case "PlayerLevelUp":
        return `🎉 レベルアップ！ Lv.${event.newLevel}`;
      case "PlayerDefeated":
        return `💀 倒れてしまった...`;
      default:
        return "";
    }
  };

  return (
    <Box flexDirection="column" height={5}>
      {events.slice(-5).map((event, i) => (
        <Text key={i} dimColor={i < events.length - 3}>
          {formatEvent(event)}
        </Text>
      ))}
    </Box>
  );
};

const ItemInfo: React.FC<{ item: Item }> = ({ item }) => {
  const rarityColors = {
    Common: "gray",
    Magic: "blue",
    Rare: "yellow",
    Legendary: "magenta",
  };

  return (
    <Box flexDirection="column" borderStyle="single" padding={1}>
      <Text color={rarityColors[item.rarity]}>
        {getItemDisplayName(item)} (Lv.{item.level})
      </Text>
      <Text dimColor>{item.rarity} {item.baseItem.type}</Text>
      {getItemStats(item).map((stat, i) => (
        <Text key={i} color="green">  {stat}</Text>
      ))}
    </Box>
  );
};

export const Game: React.FC = () => {
  const { exit } = useApp();
  
  // ゲームステート
  const [session, setSession] = useState<Session | null>(null);
  const [battleLog, setBattleLog] = useState<BattleEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // データ準備
  const baseItems = new Map(
    [...itemsData.weapons, ...itemsData.armors, ...itemsData.accessories].map(
      (item) => [item.id, item]
    )
  );

  // セッション初期化
  useEffect(() => {
    const player = createInitialPlayer("player1");
    const newSession = createSession("session1", player);
    setSession(newSession);
  }, []);

  // Ctrl-Cハンドリング
  useEffect(() => {
    const handleSignal = () => {
      exit();
    };

    process.on("SIGINT", handleSignal);
    process.on("SIGTERM", handleSignal);

    return () => {
      process.off("SIGINT", handleSignal);
      process.off("SIGTERM", handleSignal);
    };
  }, [exit]);

  // バトル自動進行
  useEffect(() => {
    if (!session || session.state !== "InProgress" || isPaused || showInventory) return;

    const timer = setTimeout(() => {
      const result = processBattleTurn(session, baseItems, monstersData.monsters);
      
      if (result.ok) {
        setSession(result.value.updatedSession);
        setBattleLog((prev) => [...prev, ...result.value.events]);
        
        if (result.value.droppedItems) {
          setInventory((prev) => [...prev, ...result.value.droppedItems!]);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [session, isPaused, showInventory]);

  // キー入力
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      exit();
    }

    if (input === " ") {
      setIsPaused((prev) => !prev);
    }

    if (input === "i") {
      setShowInventory((prev) => !prev);
    }

    if (showInventory) {
      if (key.upArrow) {
        setSelectedItemIndex((prev) => Math.max(0, prev - 1));
      }
      if (key.downArrow) {
        setSelectedItemIndex((prev) => Math.min(inventory.length - 1, prev + 1));
      }
      if (key.return && inventory[selectedItemIndex]) {
        const item = inventory[selectedItemIndex];
        if (session) {
          const result = processAction(session, { type: "EquipItem", item });
          if (result.ok) {
            setSession(result.value);
            setInventory((prev) => prev.filter((_, i) => i !== selectedItemIndex));
            setSelectedItemIndex(0);
          }
        }
      }
    }
  });

  if (!session) return <Text>Loading...</Text>;

  const playerStats = calculateTotalStats(session.player);

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" padding={1} marginBottom={1}>
        <Text bold>⚔️  Hack & Slash - Auto Battle</Text>
      </Box>

      {/* ステータス */}
      <Box marginBottom={1}>
        <Box width="50%">
          <Box flexDirection="column">
            <Text bold>プレイヤー (Lv.{session.player.level})</Text>
            <HealthBar
              current={session.player.currentHealth}
              max={playerStats.maxHealth}
              label="HP"
              color="green"
            />
            <Text dimColor>
              EXP: {session.player.experience}/{session.player.level * 100}
            </Text>
          </Box>
        </Box>
        
        <Box width="50%">
          {session.currentMonster && (
            <Box flexDirection="column">
              <Text bold>{session.currentMonster.name} (Lv.{session.currentMonster.level})</Text>
              <HealthBar
                current={session.currentMonster.currentHealth}
                max={session.currentMonster.stats.maxHealth}
                label="HP"
                color="red"
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* バトルログ */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <BattleLog events={battleLog} />
      </Box>

      {/* インベントリ */}
      {showInventory && (
        <Box flexDirection="column" borderStyle="double" padding={1} marginBottom={1}>
          <Text bold underline>インベントリ ({inventory.length})</Text>
          {inventory.length === 0 ? (
            <Text dimColor>アイテムなし</Text>
          ) : (
            inventory.map((item, i) => (
              <Box key={i}>
                <Text color={i === selectedItemIndex ? "cyan" : undefined}>
                  {i === selectedItemIndex ? "▶ " : "  "}
                </Text>
                <ItemInfo item={item} />
              </Box>
            ))
          )}
        </Box>
      )}

      {/* ステータス詳細 */}
      <Box borderStyle="single" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold>ステータス</Text>
          <Text>攻撃力: {playerStats.damage}</Text>
          <Text>防御力: {playerStats.defense}</Text>
          <Text>クリティカル率: {(playerStats.criticalChance * 100).toFixed(1)}%</Text>
          <Text>クリティカルダメージ: {(playerStats.criticalDamage * 100).toFixed(0)}%</Text>
          <Text>ライフスティール: {(playerStats.lifeSteal * 100).toFixed(1)}%</Text>
        </Box>
      </Box>

      {/* 操作説明 */}
      <Box>
        <Text dimColor>
          スペース: {isPaused ? "再開" : "一時停止"} | I: インベントリ | 
          {showInventory ? " ↑↓: 選択 Enter: 装備" : ""} | 
          Ctrl+C: 終了
        </Text>
      </Box>

      {/* ステータス表示 */}
      {isPaused && (
        <Box marginTop={1}>
          <Text color="yellow">⏸  一時停止中</Text>
        </Box>
      )}
      
      {session.state === "Completed" && (
        <Box marginTop={1}>
          <Text color="red" bold>ゲームオーバー！ 撃破数: {session.defeatedCount}</Text>
        </Box>
      )}
    </Box>
  );
};