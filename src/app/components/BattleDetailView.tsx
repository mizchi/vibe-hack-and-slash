import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Session, BattleEvent } from "../../core/types.ts";
import { getItemDisplayName, getItemStats } from "../../core/loot.ts";
import { formatGold, calculateItemValue } from "../../core/item-value.ts";
import { calculateTotalAttributes, calculateTotalStats } from "../../core/damage.ts";
import { useSelection } from "../hooks/useSelection.ts";
import { Pagination } from "./Pagination.tsx";

type Props = {
  session: Session;
  battleLog: BattleEvent[];
  isPaused: boolean;
};

const HealthBar: React.FC<{ current: number; max: number; label: string; color: string; width?: number }> = ({
  current,
  max,
  label,
  color,
  width = 30,
}) => {
  // NaN、undefined、nullを安全に処理
  const safeCurrentHealth = Number.isFinite(current) ? current : 0;
  const safeMaxHealth = Number.isFinite(max) && max > 0 ? max : 1; // 0で除算を防ぐ
  
  const percentage = Math.max(0, Math.min(100, Math.round((safeCurrentHealth / safeMaxHealth) * 100)));
  const filled = Math.max(0, Math.min(width, Math.round((safeCurrentHealth / safeMaxHealth) * width)));
  const empty = Math.max(0, width - filled);

  return (
    <Box>
      <Text color={color}>{label}: </Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {safeCurrentHealth}/{safeMaxHealth} ({percentage}%)</Text>
    </Box>
  );
};

type LogFilter = "all" | "combat" | "loot" | "event";

const BattleLogWithSelection: React.FC<{ 
  eventsWithId: Array<{ event: BattleEvent; id: string }>; 
  selectedId: string | null;
  showSelection: boolean;
}> = ({ eventsWithId, selectedId, showSelection }) => {
  
  const formatEvent = (event: BattleEvent): { text: string; color?: string } => {
    switch (event.type) {
      case "PlayerAttack":
        if (event.damage === 0) return { text: "" }; // 空行用
        const attackText = event.isCritical
          ? `[攻撃] クリティカルヒット！ ${event.damage}ダメージを与えた！`
          : `[攻撃] ${event.damage}ダメージを与えた`;
        return {
          text: attackText,
          color: event.isCritical ? "yellow" : "cyan",
        };
      case "MonsterAttack":
        return { 
          text: `[被弾] ${event.damage}ダメージを受けた`, 
          color: "red",
        };
      case "PlayerHeal":
        return { text: `[回復] ${event.amount}HP回復した`, color: "green" };
      case "MonsterDefeated":
        return { text: `[撃破] モンスターを撃破！ +${event.experience}EXP獲得`, color: "yellow" };
      case "ItemDropped":
        const itemName = getItemDisplayName(event.item);
        return { 
          text: `[入手] ${itemName}を入手！`, 
          color: "cyan",
        };
      case "PlayerLevelUp":
        return { text: `[LvUP] レベルアップ！ Lv.${event.newLevel}になった！`, color: "magenta" };
      case "PlayerDefeated":
        return { text: `[死亡] 倒れてしまった...`, color: "red" };
      case "SkillUsed":
        return { text: `[スキル] ${event.skillName}を発動！ (-${event.manaCost}MP)`, color: "blue" };
      case "SkillDamage":
        return { 
          text: `[スキル] ${event.skillName}で${event.damage}ダメージ！`, 
          color: "magenta",
        };
      case "SkillHeal":
        return { text: `[スキル] ${event.skillName}で${event.amount}回復！`, color: "green" };
      case "ManaRegenerated":
        return { text: `[MP回復] マナが${event.amount}回復`, color: "blue" };
      case "NotEnoughMana":
        return { text: `[MP不足] マナ不足！ ${event.skillName}には${event.required}MP必要`, color: "gray" };
      case "GoldDropped":
        return { text: `[Gold] ${formatGold(event.amount)}ゴールド獲得！`, color: "yellow" };
      case "WaveStart":
        return { text: `[Wave ${event.wave}] ${event.monsterCount}体の敵が出現！`, color: "magenta" };
      case "WaveCleared":
        return { text: `[Wave ${event.wave}] クリア！`, color: "yellow" };
      default:
        return { text: "" };
    }
  };

  return (
    <Box flexDirection="column">
      {eventsWithId.map(({ event, id }, i) => {
        const { text, color } = formatEvent(event);
        // 空のイベントはスキップ
        if (!text) return null;
        
        const isSelected = showSelection && id === selectedId;
        
        return (
          <Box key={id} height={1}>
            <Text color={isSelected ? "yellow" : undefined} bold={isSelected}>
              {isSelected ? "▶ " : "  "}
            </Text>
            <Text color={color} dimColor={!isSelected && i > 9}>
              {text}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

// ログ詳細表示コンポーネント
const LogDetailView: React.FC<{
  event: BattleEvent;
  session: Session;
  battleLog: BattleEvent[];
}> = ({ event, session, battleLog }) => {
  const playerStats = calculateTotalStats(session.player);
  const totalAttributes = calculateTotalAttributes(session.player);
  
  switch (event.type) {
    case "PlayerAttack":
      return (
        <Box flexDirection="column">
          <Text bold underline>攻撃詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="cyan">基礎ダメージ: {event.damage}</Text>
            {event.isCritical && <Text color="yellow">クリティカルヒット！</Text>}
            
            <Box marginTop={1}>
              <Text bold>ダメージ計算:</Text>
              <Text dimColor>基礎ダメージ: {playerStats.baseDamage}</Text>
              {event.isCritical && (
                <Text dimColor>クリティカル倍率: x{playerStats.criticalDamage.toFixed(1)}</Text>
              )}
              <Text dimColor>対象: {event.targetName}</Text>
            </Box>
            
            <Box marginTop={1}>
              <Text bold>プレイヤーステータス:</Text>
              <Text dimColor>STR: {totalAttributes.strength} | DEX: {totalAttributes.dexterity}</Text>
              <Text dimColor>クリティカル率: {(playerStats.criticalChance * 100).toFixed(0)}%</Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "MonsterAttack":
      return (
        <Box flexDirection="column">
          <Text bold underline>被ダメージ詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="red">受けたダメージ: {event.damage}</Text>
            
            <Box marginTop={1}>
              <Text bold>ダメージ計算:</Text>
              <Text dimColor>攻撃者: {event.attackerName}</Text>
              <Text dimColor>プレイヤーVIT: {totalAttributes.vitality}</Text>
              <Text dimColor>物理耐性: {session.player.elementResistance.Physical}%</Text>
            </Box>
            
            <Box marginTop={1}>
              <Text bold>現在のHP:</Text>
              <Text color={session.player.currentHealth < playerStats.maxHealth * 0.3 ? "red" : "green"}>
                {session.player.currentHealth}/{playerStats.maxHealth}
              </Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "ItemDropped":
      return (
        <Box flexDirection="column">
          <Text bold underline>アイテム詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="cyan" bold>{getItemDisplayName(event.item)}</Text>
            <Text>{event.item.rarity} {event.item.baseItem.type}</Text>
            
            <Box marginTop={1}>
              <Text bold>効果:</Text>
              {getItemStats(event.item).map((stat, i) => (
                <Text key={i} dimColor>{stat}</Text>
              ))}
            </Box>
            
            <Box marginTop={1}>
              <Text bold>売却価値:</Text>
              <Text color="yellow">{formatGold(calculateItemValue(event.item))} G</Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "SkillUsed":
      return (
        <Box flexDirection="column">
          <Text bold underline>スキル使用詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="blue">{event.skillName}</Text>
            <Text>消費MP: {event.manaCost}</Text>
            
            <Box marginTop={1}>
              <Text bold>現在のMP:</Text>
              <Text color="blue">{session.player.currentMana}/{playerStats.maxMana}</Text>
              <Text dimColor>MP回復: {playerStats.manaRegen}/ターン</Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "SkillDamage":
      return (
        <Box flexDirection="column">
          <Text bold underline>スキルダメージ詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="magenta">{event.skillName}: {event.damage}ダメージ</Text>
            
            <Box marginTop={1}>
              <Text bold>ダメージ計算:</Text>
              <Text dimColor>武器スケーリング適用</Text>
              <Text dimColor>INT: {totalAttributes.intelligence}</Text>
              <Text dimColor>スキルパワー: +{playerStats.skillPower}%</Text>
            </Box>
            
            <Box marginTop={1}>
              <Text bold>対象: {event.targetName}</Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "MonsterDefeated":
      return (
        <Box flexDirection="column">
          <Text bold underline>撃破詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="yellow">獲得経験値: {event.experience}EXP</Text>
            
            <Box marginTop={1}>
              <Text bold>レベル進捗:</Text>
              <Text dimColor>現在レベル: {session.player.level}</Text>
              <Text dimColor>現在経験値: {session.player.experience}EXP</Text>
              <Text dimColor>次のレベルまで: 計算中...</Text>
            </Box>
            
            <Box marginTop={1}>
              <Text bold>撃破数:</Text>
              <Text>{session.defeatedCount}体</Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "PlayerLevelUp":
      return (
        <Box flexDirection="column">
          <Text bold underline>レベルアップ詳細</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="magenta">レベル {event.newLevel} 到達！</Text>
            
            <Box marginTop={1}>
              <Text bold>ステータス上昇:</Text>
              <Text dimColor>各属性値: +2</Text>
              <Text dimColor>STR: {totalAttributes.strength}</Text>
              <Text dimColor>INT: {totalAttributes.intelligence}</Text>
              <Text dimColor>DEX: {totalAttributes.dexterity}</Text>
              <Text dimColor>VIT: {totalAttributes.vitality}</Text>
            </Box>
          </Box>
        </Box>
      );
      
    case "WaveStart":
      return (
        <Box flexDirection="column">
          <Text bold underline>Wave開始</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="magenta">Wave {event.wave}</Text>
            <Text>出現モンスター数: {event.monsterCount}体</Text>
            
            <Box marginTop={1}>
              <Text bold>現在の敵:</Text>
              {session.currentMonster ? (
                <Text dimColor>
                  {session.currentMonster.name} Lv.{session.currentMonster.level}
                </Text>
              ) : (
                <Text dimColor>敵がいません</Text>
              )}
            </Box>
          </Box>
        </Box>
      );
      
    case "WaveCleared":
      return (
        <Box flexDirection="column">
          <Text bold underline>Wave完了</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="yellow">Wave {event.wave} クリア！</Text>
            
            <Box marginTop={1}>
              <Text bold>戦績:</Text>
              <Text dimColor>撃破数: {session.defeatedCount}体</Text>
            </Box>
          </Box>
        </Box>
      );
      
    default:
      return (
        <Box flexDirection="column">
          <Text bold underline>イベント詳細</Text>
          <Box marginTop={1}>
            <Text dimColor>詳細情報なし</Text>
          </Box>
        </Box>
      );
  }
};

// イベントにIDを付与する関数
const getEventId = (event: BattleEvent, index: number): string => {
  // イベントタイプとインデックスを組み合わせてユニークなIDを生成
  return `${event.type}-${index}`;
};

export const BattleDetailView: React.FC<Props> = ({ session, battleLog, isPaused }) => {
  const playerStats = calculateTotalStats(session.player);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [showDetail, setShowDetail] = useState<boolean>(false);
  
  // フィルタリングされたイベント（IDを付与）
  const filteredEventsWithId = battleLog
    .map((event, index) => ({ event, id: getEventId(event, index) }))
    .filter(({ event }) => {
      switch (logFilter) {
        case "all":
          return true;
        case "combat":
          return event.type === "PlayerAttack" || event.type === "MonsterAttack" || 
                 event.type === "SkillDamage" || event.type === "PlayerHeal" || 
                 event.type === "SkillHeal" || event.type === "ManaRegenerated" ||
                 event.type === "SkillUsed" || event.type === "NotEnoughMana";
        case "loot":
          return event.type === "ItemDropped" || event.type === "GoldDropped";
        case "event":
          return event.type === "MonsterDefeated" || event.type === "PlayerLevelUp" || 
                 event.type === "PlayerDefeated" || event.type === "WaveStart" || 
                 event.type === "WaveCleared";
        default:
          return true;
      }
    });
  
  // 最新15件を逆順で表示
  const displayEventsWithId = [...filteredEventsWithId.slice(-15)].reverse();
  
  // useSelection フックを使用
  const {
    selectedId,
    selectedIndex,
    moveUp,
    moveDown,
    getSelectedItem,
  } = useSelection({
    items: displayEventsWithId,
    itemsPerPage: 15, // 全て1ページに表示
    getId: (item) => item.id,
  });
  
  useInput((input, key) => {
    // Tab キーは親コンポーネントで処理するのでスキップ
    if (key.tab) {
      return;
    }
    
    // 左右キーでログフィルター切り替え（詳細表示中は無効）
    if (!showDetail && (key.leftArrow || key.rightArrow)) {
      const filters: LogFilter[] = ["all", "combat", "loot", "event"];
      const currentIndex = filters.indexOf(logFilter);
      if (key.leftArrow) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : filters.length - 1;
        setLogFilter(filters[newIndex]);
      } else if (key.rightArrow) {
        const newIndex = currentIndex < filters.length - 1 ? currentIndex + 1 : 0;
        setLogFilter(filters[newIndex]);
      }
    }
    
    // 上下キーでログ選択
    if (displayEventsWithId.length > 0) {
      if (key.upArrow) {
        moveUp();
      } else if (key.downArrow) {
        moveDown();
      }
    }
    
    // Enterで詳細表示切り替え
    if (key.return && displayEventsWithId.length > 0) {
      setShowDetail(!showDetail);
    }
    
    // Escapeで詳細表示を閉じる
    if (key.escape && showDetail) {
      setShowDetail(false);
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      {/* 一時停止表示 */}
      {isPaused && (
        <Box marginBottom={1}>
          <Text color="yellow" bold>[一時停止中]</Text>
        </Box>
      )}

      {/* 戦闘状況 */}
      <Box flexDirection="row" marginBottom={1}>
        {/* プレイヤー情報 */}
        <Box width="50%" borderStyle="single" padding={1} marginRight={1}>
          <Box flexDirection="column">
            <Text bold color="green">{session.player.class} Lv.{session.player.level}</Text>
            <HealthBar
              current={session.player.currentHealth}
              max={playerStats.maxHealth}
              label="HP"
              color="green"
            />
            <HealthBar
              current={session.player.currentMana}
              max={playerStats.maxMana}
              label="MP"
              color="blue"
            />
            <Box marginTop={1} flexDirection="column">
              <Text>基礎ダメージ: {playerStats.baseDamage}</Text>
              <Text dimColor>STR: {session.player.baseAttributes.strength} INT: {session.player.baseAttributes.intelligence}</Text>
            </Box>
          </Box>
        </Box>

        {/* 敵情報 */}
        <Box width="50%" borderStyle="single" padding={1}>
          <Text bold color="red">敵情報 (Wave {session.wave})</Text>
          {session.currentMonster ? (
            <Box flexDirection="column" marginTop={1}>
              <Text color={session.currentMonster.currentHealth > 0 ? "red" : "gray"}>
                {session.currentMonster.name} Lv.{session.currentMonster.level}
              </Text>
              <HealthBar
                current={session.currentMonster.currentHealth}
                max={session.currentMonster.stats.maxHealth}
                label="HP"
                color={session.currentMonster.currentHealth > 0 ? "red" : "gray"}
                width={20}
              />
              <Box marginTop={1}>
                <Text dimColor>撃破数: {session.defeatedCount}体</Text>
              </Box>
            </Box>
          ) : (
            <Text dimColor>敵がいません</Text>
          )}
        </Box>
      </Box>

      {/* スキルクールダウンタイマー */}
      {session.player.skills && session.player.skills.filter(s => s.type === "Active").length > 0 && (
        <Box borderStyle="single" padding={1} marginBottom={1}>
          <Text bold underline>アクティブスキル</Text>
          <Box flexDirection="row" marginTop={1} flexWrap="wrap">
            {(session.player.skills || [])
              .filter(skill => skill.type === "Active")
              .slice(0, 6)
              .map((skill) => {
              const cooldown = session.player.skillCooldowns?.get(skill.id) || 0;
              const timer = session.player.skillTimers?.get(skill.id) || 0;
              const isReady = cooldown === 0 && timer === 0;
              
              return (
                <Box key={skill.id} marginRight={2} marginBottom={1}>
                  <Text color={isReady ? "green" : "gray"}>
                    {skill.name.substring(0, 8)}:
                  </Text>
                  <Text color={isReady ? "green" : "red"}>
                    {isReady ? " Ready" : ` CD:${cooldown > 0 ? cooldown : timer}`}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* 戦闘ログとログ詳細表示 */}
      <Box flexDirection="row" flexGrow={1}>
        {/* 左側：戦闘ログ */}
        <Box 
          borderStyle="single" 
          padding={1} 
          width={showDetail ? "50%" : "100%"}
          marginRight={showDetail ? 1 : 0}
          height={18}
        >
          <Box flexDirection="column" height="100%">
            <Box>
              <Text bold underline>戦闘ログ (最新15件)</Text>
              {showDetail && <Text dimColor> [Esc: 閉じる]</Text>}
            </Box>
            
            {/* フィルタータブ */}
            <Box marginTop={1}>
              {(() => {
                const tabs = [
                  { key: "all", label: "全て" },
                  { key: "combat", label: "戦闘" },
                  { key: "loot", label: "アイテム" },
                  { key: "event", label: "イベント" },
                ];
                
                return tabs.map((tab, index) => (
                  <React.Fragment key={tab.key}>
                    <Text
                      color={logFilter === tab.key ? "cyan" : "gray"}
                      bold={logFilter === tab.key}
                      dimColor={showDetail}
                    >
                      {tab.label}
                    </Text>
                    {index < tabs.length - 1 && <Text dimColor={showDetail}> | </Text>}
                  </React.Fragment>
                ));
              })()}
            </Box>
            
            <Box marginTop={1} flexGrow={1} overflow="hidden" height={13}>
              <BattleLogWithSelection 
                eventsWithId={displayEventsWithId} 
                selectedId={selectedId}
                showSelection={true}
              />
            </Box>
          </Box>
        </Box>
        
        {/* 右側：ログ詳細 */}
        {showDetail && getSelectedItem() && (
          <Box borderStyle="round" padding={1} width="50%">
            <LogDetailView 
              event={getSelectedItem()!.event} 
              session={session}
              battleLog={battleLog}
            />
          </Box>
        )}
      </Box>

      {/* 操作説明 */}
      <Box marginTop={1} height={1}>
        <Text dimColor>
          {showDetail 
            ? "↑↓: ログ選択 | Esc: 詳細を閉じる | P: 一時停止 | R: 休憩"
            : "↑↓: ログ選択 | ←→: フィルター | Enter: 詳細 | P: 一時停止 | R: 休憩"
          }
        </Text>
      </Box>
    </Box>
  );
};