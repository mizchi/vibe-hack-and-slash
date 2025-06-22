import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Session, Item, EquipmentSlot, Gold, Skill, ItemId } from "../../core/types.ts";
import { processAction } from "../../core/session.ts";
import { getItemDisplayName, getItemStats } from "../../core/loot.ts";
import { calculateTotalStats } from "../../core/combat.ts";
import { getValidSlotsForItem } from "../../core/equipment.ts";
import { calculateStatChanges } from "../utils/stat-preview.ts";
import { calculateItemValue, formatGold } from "../../core/item-value.ts";
import { calculateSkillDamage, calculateTotalAttributes } from "../../core/damage.ts";

type Props = {
  session: Session;
  onSessionUpdate: (session: Session) => void;
  inventory: Item[];
  onInventoryUpdate: (inventory: Item[]) => void;
  battleStatus: {
    isInBattle: boolean;
    currentMonster?: {
      name: string;
      level: number;
      healthPercent: number;
    };
  };
};

const CompactBattleStatus: React.FC<{ battleStatus: Props["battleStatus"] }> = ({ battleStatus }) => {
  if (!battleStatus.isInBattle) {
    return (
      <Box borderStyle="single" padding={1}>
        <Text color="green">◆ 拠点 - 安全 ◆</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" padding={1}>
      <Text color="red">◆ 戦闘中 ◆ </Text>
      {battleStatus.currentMonster && (
        <Text>
          {battleStatus.currentMonster.name} Lv.{battleStatus.currentMonster.level} 
          (HP: {battleStatus.currentMonster.healthPercent}%)
        </Text>
      )}
    </Box>
  );
};

type InventoryTab = "recent" | "weapon" | "armor" | "accessory" | "all";

export const EquipmentDetailView: React.FC<Props> = ({
  session,
  onSessionUpdate,
  inventory,
  onInventoryUpdate,
  battleStatus,
}) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [inventoryPage, setInventoryPage] = useState(0);
  const [autoSelectSlot, setAutoSelectSlot] = useState(true);
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>("recent");
  const [recentItems, setRecentItems] = useState<Set<ItemId>>(new Set());

  const ITEMS_PER_PAGE = 15;
  const playerStats = calculateTotalStats(session.player);

  // タブごとのアイテムフィルタリング
  const getFilteredItems = (): Item[] => {
    switch (inventoryTab) {
      case "recent":
        return inventory.filter(item => recentItems.has(item.id));
      case "weapon":
        return inventory.filter(item => item.baseItem.type === "Weapon");
      case "armor":
        return inventory.filter(item => item.baseItem.type === "Armor");
      case "accessory":
        return inventory.filter(item => item.baseItem.type === "Accessory");
      case "all":
      default:
        return inventory;
    }
  };

  const filteredItems = getFilteredItems();
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const currentPageItems = filteredItems.slice(
    inventoryPage * ITEMS_PER_PAGE,
    (inventoryPage + 1) * ITEMS_PER_PAGE
  );

  // インベントリに新しいアイテムが追加されたとき
  useEffect(() => {
    const newItems = new Set(recentItems);
    inventory.forEach(item => {
      if (!Array.from(recentItems).some(id => id === item.id)) {
        newItems.add(item.id);
      }
    });
    // 最新20個のみ保持
    const itemsArray = Array.from(newItems);
    if (itemsArray.length > 20) {
      itemsArray.slice(-20).forEach(id => newItems.delete(id));
    }
    setRecentItems(newItems);
  }, [inventory.length]);

  // タブ切り替え時にページをリセット
  useEffect(() => {
    setInventoryPage(0);
    setSelectedItemIndex(0);
  }, [inventoryTab]);

  useInput((input, key) => {
    // Tab キーは親コンポーネントで処理するのでスキップ
    if (key.tab) {
      return;
    }
    
    // 左右キーでタブ切り替え（アイテム未選択時）
    if (filteredItems.length === 0 || (key.leftArrow && autoSelectSlot)) {
      const tabs: InventoryTab[] = ["recent", "weapon", "armor", "accessory", "all"];
      const currentIndex = tabs.indexOf(inventoryTab);
      if (key.leftArrow) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        setInventoryTab(tabs[newIndex]);
      } else if (key.rightArrow) {
        const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        setInventoryTab(tabs[newIndex]);
      }
      return;
    }
    
    if (filteredItems.length > 0) {
      if (key.upArrow) {
        const newIndex = selectedItemIndex - 1;
        if (newIndex < 0) {
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
      
      // Space または Enter で装備
      if ((input === " " || key.return) && currentPageItems[selectedItemIndex]) {
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
            onSessionUpdate(result.value);
            onInventoryUpdate(inventory.filter((_, i) => i !== globalIndex));
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
      
      // Delete で売却
      if (key.delete && currentPageItems[selectedItemIndex]) {
        const item = currentPageItems[selectedItemIndex];
        const sellValue = calculateItemValue(item);
        const globalIndex = inventoryPage * ITEMS_PER_PAGE + selectedItemIndex;
        
        const updatedSession = {
          ...session,
          player: {
            ...session.player,
            gold: (session.player.gold + sellValue) as Gold,
          }
        };
        onSessionUpdate(updatedSession);
        onInventoryUpdate(inventory.filter((_, i) => i !== globalIndex));
        
        if (currentPageItems.length === 1 && inventoryPage > 0) {
          setInventoryPage(inventoryPage - 1);
          setSelectedItemIndex(0);
        } else {
          setSelectedItemIndex(Math.min(selectedItemIndex, currentPageItems.length - 2));
        }
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {/* ヘッダー */}
      <Box borderStyle="double" padding={1} marginBottom={1}>
        <Text bold>🎒 装備管理</Text>
        <Text> - </Text>
        <Text color="yellow">{formatGold(session.player.gold)} G</Text>
      </Box>

      {/* 簡易戦闘状況 */}
      <Box marginBottom={1}>
        <CompactBattleStatus battleStatus={battleStatus} />
      </Box>

      <Box flexDirection="row" flexGrow={1}>
        {/* 左側：インベントリ */}
        <Box width="60%" borderStyle="double" padding={1} marginRight={1}>
          {/* インベントリヘッダーとタブ */}
          <Box flexDirection="column">
            <Box>
              <Text bold underline>インベントリ</Text>
              <Text> ({inventory.length}/50) </Text>
              {totalPages > 1 && <Text dimColor>[{inventoryPage + 1}/{totalPages}]</Text>}
            </Box>
            
            {/* タブ表示 */}
            <Box marginTop={1}>
              {(() => {
                const tabs = [
                  { key: "recent", label: "新着", emoji: "🆕" },
                  { key: "weapon", label: "武器", emoji: "⚔️" },
                  { key: "armor", label: "防具", emoji: "🛡️" },
                  { key: "accessory", label: "装飾", emoji: "💍" },
                  { key: "all", label: "全て", emoji: "📦" },
                ];
                
                return tabs.map((tab, index) => (
                  <React.Fragment key={tab.key}>
                    <Text
                      color={inventoryTab === tab.key ? "cyan" : "gray"}
                      bold={inventoryTab === tab.key}
                    >
                      {tab.emoji} {tab.label}
                    </Text>
                    {index < tabs.length - 1 && <Text> | </Text>}
                  </React.Fragment>
                ));
              })()}
            </Box>
          </Box>
          
          {filteredItems.length === 0 ? (
            <Text dimColor marginTop={1}>
              {inventoryTab === "recent" ? "新着アイテムなし" : "アイテムなし"}
            </Text>
          ) : (
            <Box flexDirection="column" marginTop={1}>
              {currentPageItems.map((item, index) => {
                const isSelected = index === selectedItemIndex;
                const validSlots = getValidSlotsForItem(item, session.player.class, session.player.level);
                
                const rarityColors = {
                  Common: "gray",
                  Magic: "blue", 
                  Rare: "yellow",
                  Legendary: "magenta",
                };

                return (
                  <Box key={index} flexDirection="column">
                    <Box>
                      <Text color={isSelected ? "cyan" : undefined}>
                        {isSelected ? "▶ " : "  "}
                      </Text>
                      <Text color={rarityColors[item.rarity]}>
                        {getItemDisplayName(item)}
                      </Text>
                      {recentItems.has(item.id) && inventoryTab !== "recent" && (
                        <Text color="green"> 🆕</Text>
                      )}
                    </Box>
                    {isSelected && (
                      <Box marginLeft={3} flexDirection="column">
                        {getItemStats(item).map((stat, i) => (
                          <Text key={i} dimColor>{stat}</Text>
                        ))}
                        {validSlots.length > 0 && (
                          <Text color="green">
                            装備可能: {autoSelectSlot ? "自動選択" : validSlots[Math.abs(selectedSlotIndex) % validSlots.length]}
                          </Text>
                        )}
                        <Text color="yellow">売却価値: {formatGold(calculateItemValue(item))} G</Text>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* 右側：ステータスと装備 */}
        <Box width="40%" flexDirection="column">
          {/* 現在のステータス */}
          <Box borderStyle="single" padding={1} marginBottom={1}>
            <Text bold underline>ステータス</Text>
            <Box marginTop={1} flexDirection="column">
              {/* 基本ステータス */}
              <Box marginBottom={1}>
                {(() => {
                  const attrs = calculateTotalAttributes(session.player);
                  return (
                    <>
                      <Text>STR: {attrs.strength} | INT: {attrs.intelligence}</Text>
                      <Text>DEX: {attrs.dexterity} | VIT: {attrs.vitality}</Text>
                    </>
                  );
                })()}
              </Box>
              {/* 戦闘ステータス */}
              <Text color="green">⚔ 攻撃力: {playerStats.damage}</Text>
              <Text color="cyan">🛡 防御力: {playerStats.defense}</Text>
              <Text color="red">❤️  体力: {playerStats.maxHealth}</Text>
              <Text color="blue">🔮 魔力: {playerStats.maxMana}</Text>
            </Box>
          </Box>

          {/* 装備変更プレビュー */}
          {(currentPageItems[selectedItemIndex] && 
            getValidSlotsForItem(currentPageItems[selectedItemIndex], session.player.class, session.player.level).length > 0) && (
            <Box borderStyle="round" padding={1} marginBottom={1}>
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
                  <Box flexDirection="column" marginTop={1}>
                    <Text dimColor>スロット: {targetSlot}</Text>
                    {changes.attack.diff !== 0 && (
                      <Text>⚔ 攻撃: {changes.attack.current}{formatChange(changes.attack)}</Text>
                    )}
                    {changes.defense.diff !== 0 && (
                      <Text>🛡 防御: {changes.defense.current}{formatChange(changes.defense)}</Text>
                    )}
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

          {/* スキルダメージプレビュー */}
          {session.player.skills.length > 0 && (
            <Box borderStyle="single" padding={1} marginBottom={1}>
              <Text bold underline>スキル予測ダメージ</Text>
              <Box flexDirection="column" marginTop={1}>
                {session.player.skills.slice(0, 3).map(skill => {
                  const damageEffect = skill.effects.find(e => e.type === "Damage");
                  if (!damageEffect || damageEffect.type !== "Damage") return null;
                  
                  const predictedDamage = calculateSkillDamage(
                    session.player,
                    damageEffect.baseDamage,
                    damageEffect.scaling,
                    damageEffect.element
                  );
                  
                  const elementColors = {
                    Physical: "white",
                    Fire: "red",
                    Ice: "cyan",
                    Lightning: "yellow",
                    Holy: "white",
                    Dark: "magenta",
                  };
                  
                  return (
                    <Text key={skill.id}>
                      <Text color={elementColors[damageEffect.element]}>
                        {skill.name}: ~{predictedDamage}
                      </Text>
                      <Text dimColor> (MP: {skill.manaCost})</Text>
                    </Text>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* 装備中アイテム */}
          <Box borderStyle="single" padding={1} flexGrow={1}>
            <Text bold underline>装備中</Text>
            {session.player.equipment.size === 0 ? (
              <Text dimColor marginTop={1}>装備なし</Text>
            ) : (
              <Box flexDirection="column" marginTop={1}>
                {Array.from(session.player.equipment.entries()).map(([slot, item]) => {
                  const rarityColors = {
                    Common: "gray",
                    Magic: "blue", 
                    Rare: "yellow",
                    Legendary: "magenta",
                  };
                  const shortSlotNames: Record<string, string> = {
                    MainHand: "主手",
                    OffHand: "副手",
                    Armor: "鎧",
                    Helm: "兜",
                    Gloves: "手袋",
                    Boots: "靴",
                    Ring1: "指輪1",
                    Ring2: "指輪2",
                    Amulet: "首飾",
                    Belt: "腰帯"
                  };
                  return (
                    <Text key={slot}>
                      <Text dimColor>{shortSlotNames[slot]}: </Text>
                      <Text color={rarityColors[item.rarity]}>
                        {getItemDisplayName(item).substring(0, 25)}
                      </Text>
                    </Text>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 操作説明 */}
      <Box marginTop={1}>
        <Text dimColor>
          ↑↓: アイテム | ←→: {filteredItems.length > 0 ? "スロット選択" : "タブ切替"} | Space: 装備 | Del: 売却 | Tab: 戦闘詳細へ
        </Text>
      </Box>
    </Box>
  );
};