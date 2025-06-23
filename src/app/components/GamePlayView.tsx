import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Session, Item, BattleEvent, BaseItem, ItemId, Skill, EquipmentSlot } from "../../core/types.ts";
import { processBattleTurn, processAction } from "../../core/session.ts";
import { getItemDisplayName, getItemStats } from "../../core/loot.ts";
import { calculateTotalStats } from "../../core/damage.ts";
import { canEquipItem, getValidSlotsForItem } from "../../core/equipment.ts";
import { calculateStatChanges } from "../utils/stat-preview.ts";
import { calculateItemValue, formatGold } from "../../core/item-value.ts";
import type { Gold } from "../../core/types.ts";

type Props = {
  session: Session;
  onSessionUpdate: (session: Session) => void;
  baseItems: Map<ItemId, BaseItem>;
  monsterTemplates: any[];
  skills: Skill[];
};

// UI components
const HealthBar: React.FC<{ current: number; max: number; label: string; color: string; width?: number }> = ({
  current,
  max,
  label,
  color,
  width = 20,
}) => {
  // NaNチェック
  const safeMax = isNaN(max) || max <= 0 ? 1 : max;
  const safeCurrent = isNaN(current) ? 0 : Math.max(0, Math.min(current, safeMax));
  
  const percentage = Math.round((safeCurrent / safeMax) * 100);
  const filled = Math.round((safeCurrent / safeMax) * width);
  const empty = width - filled;

  return (
    <Box>
      <Text color={color}>{label}: </Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {safeCurrent}/{safeMax} ({percentage}%)</Text>
    </Box>
  );
};

const CompactHealthBar: React.FC<{ current: number; max: number; color: string }> = ({
  current,
  max,
  color,
}) => {
  // NaNチェック
  const safeMax = isNaN(max) || max <= 0 ? 1 : max;
  const safeCurrent = isNaN(current) ? 0 : Math.max(0, Math.min(current, safeMax));
  
  const percentage = Math.round((safeCurrent / safeMax) * 100);
  const width = 10;
  const filled = Math.round((safeCurrent / safeMax) * width);
  const empty = width - filled;

  return (
    <Box>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {safeCurrent}/{safeMax}</Text>
    </Box>
  );
};

const BattleLog: React.FC<{ events: BattleEvent[] }> = ({ events }) => {
  const formatEvent = (event: BattleEvent): string => {
    switch (event.type) {
      case "PlayerAttack":
        return event.isCritical
          ? `⚔️  クリティカル！ ${event.damage}ダメージ！`
          : `⚔️  ${event.damage}ダメージ`;
      case "MonsterAttack":
        return `🗡️  ${event.damage}ダメージを受けた`;
      case "PlayerHeal":
        return `💚 ${event.amount}回復`;
      case "MonsterDefeated":
        return `✨ 撃破！ +${event.experience}EXP`;
      case "ItemDropped":
        return `📦 ${getItemDisplayName(event.item)}！`;
      case "PlayerLevelUp":
        return `🎉 レベルアップ！ Lv.${event.newLevel}`;
      case "PlayerDefeated":
        return `💀 倒れてしまった...`;
      case "SkillUsed":
        return `🔮 ${event.skillName}！`;
      case "SkillDamage":
        return `💥 ${event.damage}ダメージ！`;
      case "SkillHeal":
        return `✨ ${event.amount}回復！`;
      case "ManaRegenerated":
        return `💙 MP+${event.amount}`;
      case "NotEnoughMana":
        return `❌ MP不足`;
      default:
        return "";
    }
  };

  return (
    <Box flexDirection="column">
      {events.slice(-4).map((event, i) => (
        <Text key={i} dimColor={i < events.length - 2}>
          {formatEvent(event)}
        </Text>
      ))}
    </Box>
  );
};

export const GamePlayView: React.FC<Props> = ({
  session: initialSession,
  onSessionUpdate,
  baseItems,
  monsterTemplates,
  skills,
}) => {
  const [session, setSession] = useState(initialSession);
  const [battleLog, setBattleLog] = useState<BattleEvent[]>([]);
  const [isInBattle, setIsInBattle] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [autoSelectSlot, setAutoSelectSlot] = useState(true);
  const [focusArea, setFocusArea] = useState<"menu" | "inventory">("menu");
  const [inventoryPage, setInventoryPage] = useState(0);
  
  const ITEMS_PER_PAGE = 10;

  const playerStats = calculateTotalStats(session.player);

  // メニュー項目
  const menuItems = [
    { 
      label: session.player.currentHealth === 0 ? "戦闘開始（要回復）" : "戦闘開始", 
      action: () => {
        if (session.player.currentHealth > 0) {
          setIsInBattle(true);
        }
      }, 
      enabled: !isInBattle,
      disabled: session.player.currentHealth === 0
    },
    { 
      label: "休憩（全回復）", 
      action: () => {
        const healedSession = {
          ...session,
          player: {
            ...session.player,
            currentHealth: playerStats.maxHealth,
            currentMana: playerStats.maxMana,
          },
          state: "InProgress" as const,
        };
        setSession(healedSession);
        onSessionUpdate(healedSession);
      }, 
      enabled: !isInBattle 
    },
    { 
      label: isPaused ? "戦闘再開" : "戦闘一時停止", 
      action: () => setIsPaused(!isPaused), 
      enabled: isInBattle 
    },
    { 
      label: "戦闘終了", 
      action: () => {
        setIsInBattle(false);
        setIsPaused(false);
      }, 
      enabled: isInBattle 
    },
  ];

  const enabledMenuItems = menuItems.filter(item => item.enabled);
  
  // 初期選択位置を有効なアイテムに設定
  useEffect(() => {
    if (enabledMenuItems.length > 0 && enabledMenuItems[0]?.disabled) {
      const firstEnabledIndex = enabledMenuItems.findIndex(item => !item.disabled);
      if (firstEnabledIndex >= 0) {
        setSelectedMenuIndex(firstEnabledIndex);
      }
    }
  }, [session.player.currentHealth]);

  // バトル自動進行
  useEffect(() => {
    if (!session || !isInBattle || isPaused || session.state === "Completed") return;

    const timer = setTimeout(async () => {
      const result = await processBattleTurn(
        session, 
        baseItems, 
        monsterTemplates,
        skills,
        turn
      );
      
      if (result.ok) {
        setSession(result.value.updatedSession);
        onSessionUpdate(result.value.updatedSession);
        setBattleLog((prev) => [...prev, ...result.value.events]);
        setTurn((prev) => prev + 1);
        
        if (result.value.droppedItems) {
          setInventory((prev) => [...prev, ...result.value.droppedItems!]);
        }

        // プレイヤーが倒れたら戦闘終了
        if (result.value.updatedSession.state === "Completed") {
          setIsInBattle(false);
          setIsPaused(false);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [session, isInBattle, isPaused, turn]);

  // ページ計算
  const totalPages = Math.ceil(inventory.length / ITEMS_PER_PAGE);
  const currentPageItems = inventory.slice(
    inventoryPage * ITEMS_PER_PAGE,
    (inventoryPage + 1) * ITEMS_PER_PAGE
  );

  // キー入力
  useInput((input, key) => {
    // Tab でフォーカスエリア切り替え（拠点時のみ）
    if (!isInBattle && key.tab) {
      setFocusArea(focusArea === "menu" ? "inventory" : "menu");
    }

    // 戦闘中の操作
    if (isInBattle) {
      // インベントリ操作
      if (inventory.length > 0) {
        if (key.upArrow) {
          const newIndex = selectedItemIndex - 1;
          if (newIndex < 0) {
            // 前のページへ
            if (inventoryPage > 0) {
              setInventoryPage(inventoryPage - 1);
              setSelectedItemIndex(ITEMS_PER_PAGE - 1);
            }
          } else {
            setSelectedItemIndex(newIndex);
          }
          setAutoSelectSlot(true);
        }
        if (key.downArrow) {
          const newIndex = selectedItemIndex + 1;
          if (newIndex >= currentPageItems.length) {
            // 次のページへ
            if (inventoryPage < totalPages - 1) {
              setInventoryPage(inventoryPage + 1);
              setSelectedItemIndex(0);
            }
          } else {
            setSelectedItemIndex(newIndex);
          }
          setAutoSelectSlot(true);
        }
        if (key.leftArrow || key.rightArrow) {
          setAutoSelectSlot(false);
          setSelectedSlotIndex((prev) => prev + (key.leftArrow ? -1 : 1));
        }
        // Space で装備
        if (input === " " && currentPageItems[selectedItemIndex]) {
          const item = currentPageItems[selectedItemIndex];
          const globalIndex = inventoryPage * ITEMS_PER_PAGE + selectedItemIndex;
          const validSlots = getValidSlotsForItem(item, session.player.class, session.player.level);
          if (validSlots.length > 0) {
            // 自動スロット選択モードの場合、最適なスロットを選択
            let targetSlot = validSlots[Math.abs(selectedSlotIndex) % validSlots.length];
            if (autoSelectSlot) {
              // すでに装備がある場合は、そのスロットを優先
              const itemType = item.baseItem.type;
              if (itemType === "Weapon") {
                targetSlot = "MainHand";
              } else if (itemType === "Armor") {
                // 防具の場合、タグに応じて適切なスロットを選択
                if (item.baseItem.tags.includes("Helm")) targetSlot = "Helm";
                else if (item.baseItem.tags.includes("Gloves")) targetSlot = "Gloves";
                else if (item.baseItem.tags.includes("Boots")) targetSlot = "Boots";
                else if (item.baseItem.tags.includes("Belt")) targetSlot = "Belt";
                else targetSlot = "Armor";
              } else if (itemType === "Accessory") {
                if (item.baseItem.tags.includes("Ring")) {
                  targetSlot = session.player.equipment.has("Ring1") ? "Ring2" : "Ring1";
                } else if (item.baseItem.tags.includes("Amulet")) {
                  targetSlot = "Amulet";
                }
              }
            }
            
            const result = processAction(session, { type: "EquipItem", item, slot: targetSlot });
            if (result.ok) {
              setSession(result.value);
              onSessionUpdate(result.value);
              setInventory((prev) => prev.filter((_, i) => i !== globalIndex));
              if (currentPageItems.length === 1 && inventoryPage > 0) {
                setInventoryPage(inventoryPage - 1);
                setSelectedItemIndex(0);
              } else {
                setSelectedItemIndex(Math.min(selectedItemIndex, currentPageItems.length - 2));
              }
              setSelectedSlotIndex(0);
              setAutoSelectSlot(true);
            }
          }
        }
        // Delete キーでアイテム売却
        if (key.delete && currentPageItems[selectedItemIndex]) {
          const item = currentPageItems[selectedItemIndex];
          const sellValue = calculateItemValue(item);
          const globalIndex = inventoryPage * ITEMS_PER_PAGE + selectedItemIndex;
          
          // ゴールドを増やす
          const updatedSession = {
            ...session,
            player: {
              ...session.player,
              gold: (session.player.gold + sellValue) as Gold,
            }
          };
          setSession(updatedSession);
          onSessionUpdate(updatedSession);
          
          // インベントリから削除
          setInventory((prev) => prev.filter((_, i) => i !== globalIndex));
          if (currentPageItems.length === 1 && inventoryPage > 0) {
            setInventoryPage(inventoryPage - 1);
            setSelectedItemIndex(0);
          } else {
            setSelectedItemIndex(Math.min(selectedItemIndex, currentPageItems.length - 2));
          }
        }
      }
      
      // P で一時停止
      if (input === "p") {
        setIsPaused(!isPaused);
      }
    } else {
      // 拠点での操作
      if (focusArea === "menu") {
        if (key.upArrow) {
          let newIndex = selectedMenuIndex - 1;
          while (newIndex >= 0 && enabledMenuItems[newIndex]?.disabled) {
            newIndex--;
          }
          if (newIndex >= 0) {
            setSelectedMenuIndex(newIndex);
          }
        }
        if (key.downArrow) {
          let newIndex = selectedMenuIndex + 1;
          while (newIndex < enabledMenuItems.length && enabledMenuItems[newIndex]?.disabled) {
            newIndex++;
          }
          if (newIndex < enabledMenuItems.length) {
            setSelectedMenuIndex(newIndex);
          }
        }
        if (key.return && enabledMenuItems[selectedMenuIndex] && !enabledMenuItems[selectedMenuIndex].disabled) {
          enabledMenuItems[selectedMenuIndex].action();
        }
      } else {
        // インベントリ操作（拠点）
        if (inventory.length > 0) {
          if (key.upArrow) {
            const newIndex = selectedItemIndex - 1;
            if (newIndex < 0 && inventoryPage > 0) {
              setInventoryPage(inventoryPage - 1);
              setSelectedItemIndex(ITEMS_PER_PAGE - 1);
            } else if (newIndex >= 0) {
              setSelectedItemIndex(newIndex);
            }
            setAutoSelectSlot(true);
          }
          if (key.downArrow) {
            const newIndex = selectedItemIndex + 1;
            if (newIndex >= currentPageItems.length && inventoryPage < totalPages - 1) {
              setInventoryPage(inventoryPage + 1);
              setSelectedItemIndex(0);
            } else if (newIndex < currentPageItems.length) {
              setSelectedItemIndex(newIndex);
            }
            setAutoSelectSlot(true);
          }
          if (key.leftArrow || key.rightArrow) {
            setAutoSelectSlot(false);
            setSelectedSlotIndex((prev) => prev + (key.leftArrow ? -1 : 1));
          }
          // Enter で装備（拠点）
          if (key.return && currentPageItems[selectedItemIndex]) {
            const item = currentPageItems[selectedItemIndex];
            const globalIndex = inventoryPage * ITEMS_PER_PAGE + selectedItemIndex;
            const validSlots = getValidSlotsForItem(item, session.player.class, session.player.level);
            if (validSlots.length > 0) {
              let targetSlot = validSlots[Math.abs(selectedSlotIndex) % validSlots.length];
              if (autoSelectSlot) {
                const itemType = item.baseItem.type;
                if (itemType === "Weapon") {
                  targetSlot = "MainHand";
                } else if (itemType === "Armor") {
                  if (item.baseItem.tags.includes("Helm")) targetSlot = "Helm";
                  else if (item.baseItem.tags.includes("Gloves")) targetSlot = "Gloves";
                  else if (item.baseItem.tags.includes("Boots")) targetSlot = "Boots";
                  else if (item.baseItem.tags.includes("Belt")) targetSlot = "Belt";
                  else targetSlot = "Armor";
                } else if (itemType === "Accessory") {
                  if (item.baseItem.tags.includes("Ring")) {
                    targetSlot = session.player.equipment.has("Ring1") ? "Ring2" : "Ring1";
                  } else if (item.baseItem.tags.includes("Amulet")) {
                    targetSlot = "Amulet";
                  }
                }
              }
              
              const result = processAction(session, { type: "EquipItem", item, slot: targetSlot });
              if (result.ok) {
                setSession(result.value);
                onSessionUpdate(result.value);
                setInventory((prev) => prev.filter((_, i) => i !== globalIndex));
                if (currentPageItems.length === 1 && inventoryPage > 0) {
                  setInventoryPage(inventoryPage - 1);
                  setSelectedItemIndex(0);
                } else {
                  setSelectedItemIndex(Math.min(selectedItemIndex, currentPageItems.length - 2));
                }
                setSelectedSlotIndex(0);
                setAutoSelectSlot(true);
              }
            }
          }
        }
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {/* ヘッダー */}
      <Box borderStyle="double" padding={1} marginBottom={1}>
        <Text bold>⚔️  Hack & Slash - {isInBattle ? "戦闘中" : "拠点"}</Text>
        {isPaused && <Text color="yellow"> ⏸ 一時停止中</Text>}
      </Box>

      {/* 1列目：プレイヤー + 敵一覧 */}
      <Box flexDirection="row" height={8} marginBottom={1}>
        {/* 左：プレイヤー情報 */}
        <Box width="40%" borderStyle="single" padding={1} marginRight={1}>
          <Text bold color="green">◆ {session.player.class} Lv.{session.player.level} ◆</Text>
          <HealthBar
            current={session.player.currentHealth}
            max={playerStats.maxHealth}
            label="HP"
            color="green"
            width={20}
          />
          <HealthBar
            current={session.player.currentMana}
            max={playerStats.maxMana}
            label="MP"
            color="blue"
            width={20}
          />
          <Text dimColor>EXP: {session.player.experience}/{session.player.level * 100}</Text>
          <Text dimColor>撃破: {session.defeatedCount}体</Text>
          <Text color="yellow">💰 {formatGold(session.player.gold)} G</Text>
        </Box>

        {/* 右：敵一覧/メニュー */}
        <Box width="60%" borderStyle="single" padding={1}>
          {isInBattle ? (
            <Box flexDirection="column">
              <Text bold color="red">◆ 敵 ◆</Text>
              {session.currentMonster ? (
                <Box marginTop={1}>
                  <Box>
                    <Text>1. {session.currentMonster.name} Lv.{session.currentMonster.level}</Text>
                    <Box marginLeft={3}>
                      <CompactHealthBar
                        current={session.currentMonster.currentHealth}
                        max={session.currentMonster.stats.maxHealth}
                        color="red"
                      />
                    </Box>
                  </Box>
                  {/* 将来的に複数の敵を表示できる領域 */}
                </Box>
              ) : (
                <Text dimColor>敵がいません</Text>
              )}
            </Box>
          ) : (
            <Box flexDirection="column">
              <Text bold color="green">◆ メニュー ◆</Text>
              {enabledMenuItems.map((item, index) => (
                <Box key={index} marginTop={index === 0 ? 1 : 0}>
                  <Text 
                    color={
                      item.disabled 
                        ? "gray" 
                        : (focusArea === "menu" && index === selectedMenuIndex ? "cyan" : undefined)
                    }
                    dimColor={item.disabled}
                  >
                    {focusArea === "menu" && index === selectedMenuIndex && !item.disabled ? "▶ " : "  "}
                    {item.label}
                  </Text>
                </Box>
              ))}
              {session.player.currentHealth === 0 && (
                <Box marginTop={1}>
                  <Text color="red">⚠️ HPが0です。休憩してください</Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* 2列目：ログ（全幅） */}
      <Box borderStyle="single" padding={1} marginBottom={1} height={6}>
        <Text bold underline>バトルログ</Text>
        <Box marginTop={1}>
          <BattleLog events={battleLog} />
        </Box>
      </Box>

      {/* 3列目：インベントリ + ステータス詳細 */}
      <Box flexDirection="row" flexGrow={1}>
        {/* 左：インベントリ */}
        <Box 
          width="50%" 
          borderStyle={isInBattle || focusArea === "inventory" ? "double" : "single"} 
          padding={1}
          marginRight={1}
        >
          <Box>
            <Text bold underline>インベントリ</Text>
            <Text> ({inventory.length}/50) </Text>
            {totalPages > 1 && <Text dimColor>[{inventoryPage + 1}/{totalPages}]</Text>}
          </Box>
          {inventory.length === 0 ? (
            <Box marginTop={1}>
              <Text dimColor>アイテムなし</Text>
            </Box>
          ) : (
            <Box flexDirection="column" marginTop={1}>
              {currentPageItems.map((item, index) => {
                const isSelected = (isInBattle || focusArea === "inventory") && index === selectedItemIndex;
                const validSlots = getValidSlotsForItem(item, session.player.class, session.player.level);
                
                const rarityColors = {
                  Common: "gray",
                  Magic: "blue", 
                  Rare: "yellow",
                  Legendary: "magenta",
                };

                const shortName = getItemDisplayName(item).substring(0, 25);
                const mainStat = getItemStats(item)[0] || "";

                return (
                  <Box key={index} flexDirection="column">
                    <Box>
                      <Text color={isSelected ? "cyan" : undefined}>
                        {isSelected ? "▶ " : "  "}
                      </Text>
                      <Text color={rarityColors[item.rarity]}>
                        {shortName}
                      </Text>
                    </Box>
                    {isSelected && (
                      <Box marginLeft={3}>
                        <Text dimColor>{mainStat}</Text>
                        {validSlots.length > 0 && (
                          <Text dimColor>
                            → {autoSelectSlot ? "自動" : validSlots[Math.abs(selectedSlotIndex) % validSlots.length]}
                          </Text>
                        )}
                        <Text color="yellow">売却: {formatGold(calculateItemValue(item))} G</Text>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* 右：ステータス詳細 */}
        <Box width="50%" borderStyle="single" padding={1}>
          <Text bold underline>ステータス</Text>
          
          {/* 現在のステータス */}
          <Box marginTop={1}>
            <Text color="green">⚔ 基礎ダメージ: {playerStats.baseDamage}</Text>
            <Text color="cyan">🛡 VIT: {session.player.baseStats.vitality || 12}</Text>
            <Text color="red">❤️  体力: {playerStats.maxHealth}</Text>
            <Text color="blue">🔮 魔力: {playerStats.maxMana}</Text>
          </Box>
          
          {/* アイテム選択時のプレビュー */}
          {((isInBattle || focusArea === "inventory") && 
            currentPageItems[selectedItemIndex] && 
            getValidSlotsForItem(currentPageItems[selectedItemIndex], session.player.class, session.player.level).length > 0) && (
            <Box marginTop={1} borderStyle="round" padding={1}>
              <Text bold>装備変更プレビュー</Text>
              {(() => {
                const item = currentPageItems[selectedItemIndex];
                const validSlots = getValidSlotsForItem(item, session.player.class, session.player.level);
                const targetSlot = autoSelectSlot 
                  ? validSlots[0]
                  : validSlots[Math.abs(selectedSlotIndex) % validSlots.length];
                const changes = calculateStatChanges(session.player, item, targetSlot);
                
                const formatChange = (stat: { current: number; new: number; diff: number }) => {
                  if (stat.diff === 0) return null;
                  const color = stat.diff > 0 ? "green" : "red";
                  const sign = stat.diff > 0 ? "+" : "";
                  return <Text color={color}> → {stat.new} ({sign}{stat.diff})</Text>;
                };
                
                return (
                  <Box flexDirection="column">
                    <Text dimColor>スロット: {targetSlot}</Text>
                    {changes.attack.diff !== 0 && (
                      <Text>⚔ 攻撃: {changes.attack.current}{formatChange(changes.attack)}</Text>
                    )}
                    {/* 防御力は属性耐性として表示される */}
                    {changes.health.diff !== 0 && (
                      <Text>❤️  HP: {changes.health.current}{formatChange(changes.health)}</Text>
                    )}
                    {changes.mana.diff !== 0 && (
                      <Text>🔮 MP: {changes.mana.current}{formatChange(changes.mana)}</Text>
                    )}
                  </Box>
                );
              })()}
            </Box>
          )}
          
          {/* 装備中 */}
          <Box marginTop={1}>
            <Text bold dimColor>━━ 装備中 ━━</Text>
            {session.player.equipment.size === 0 ? (
              <Text dimColor>なし</Text>
            ) : (
              <Box flexDirection="column">
                {Array.from(session.player.equipment.entries()).slice(0, 5).map(([slot, item]) => {
                  const rarityColors = {
                    Common: "gray",
                    Magic: "blue", 
                    Rare: "yellow",
                    Legendary: "magenta",
                  };
                  return (
                    <Text key={slot} color={rarityColors[item.rarity]}>
                      {getItemDisplayName(item).substring(0, 25)}
                    </Text>
                  );
                })}
                {session.player.equipment.size > 5 && (
                  <Text dimColor>...他{session.player.equipment.size - 5}個</Text>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* フッター：操作説明 */}
      <Box marginTop={1}>
        <Text dimColor>
          {isInBattle ? (
            "↑↓: アイテム | Space: 装備 | ←→: スロット | Del: 売却 | P: 一時停止"
          ) : (
            focusArea === "menu" 
              ? "Tab: インベントリ | ↑↓: 選択 | Enter: 決定"
              : "Tab: メニュー | ↑↓: アイテム | Enter: 装備 | ←→: スロット | Del: 売却"
          )}
          {" | Ctrl+C: 終了"}
        </Text>
      </Box>
    </Box>
  );
};