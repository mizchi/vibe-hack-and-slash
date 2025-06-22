import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Session, BattleEvent } from "../../core/types.ts";
import { getItemDisplayName } from "../../core/loot.ts";
import { calculateTotalStats } from "../../core/combat.ts";
import { formatGold } from "../../core/item-value.ts";

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
  const percentage = Math.max(0, Math.min(100, Math.round((current / max) * 100))) || 0;
  const filled = Math.max(0, Math.min(width, Math.round((current / max) * width))) || 0;
  const empty = Math.max(0, width - filled);

  return (
    <Box>
      <Text color={color}>{label}: </Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {current}/{max} ({percentage}%)</Text>
    </Box>
  );
};

type LogFilter = "all" | "damage" | "heal" | "loot" | "skill" | "system";

const BattleLogFull: React.FC<{ events: BattleEvent[]; filter: LogFilter }> = ({ events, filter }) => {
  // フィルタリング
  const filteredEvents = events.filter(event => {
    switch (filter) {
      case "all":
        return true;
      case "damage":
        return event.type === "PlayerAttack" || event.type === "MonsterAttack" || event.type === "SkillDamage";
      case "heal":
        return event.type === "PlayerHeal" || event.type === "SkillHeal" || event.type === "ManaRegenerated";
      case "loot":
        return event.type === "ItemDropped" || event.type === "GoldDropped";
      case "skill":
        return event.type === "SkillUsed" || event.type === "SkillDamage" || event.type === "SkillHeal" || event.type === "NotEnoughMana";
      case "system":
        return event.type === "MonsterDefeated" || event.type === "PlayerLevelUp" || event.type === "PlayerDefeated";
      default:
        return true;
    }
  });
  
  // 最新を上に表示
  const displayEvents = [...filteredEvents.slice(-15)].reverse();
  
  const formatEvent = (event: BattleEvent, showDetails: boolean = false): { text: string; color?: string; detail?: string } => {
    switch (event.type) {
      case "PlayerAttack":
        if (event.damage === 0) return { text: "" }; // 空行用
        const attackText = event.isCritical
          ? `[攻撃] クリティカルヒット！ ${event.damage}ダメージを与えた！`
          : `[攻撃] ${event.damage}ダメージを与えた`;
        const attackDetail = showDetails && event.damage > 0
          ? `   (基礎攻撃力 × ${event.isCritical ? 'クリティカル倍率' : '1.0'} - 敵防御力)`
          : undefined;
        return {
          text: attackText,
          color: event.isCritical ? "yellow" : undefined,
          detail: attackDetail,
        };
      case "MonsterAttack":
        return { 
          text: `[被弾] ${event.damage}ダメージを受けた`, 
          color: "red",
          detail: showDetails ? `   (敵攻撃力 - プレイヤー防御力)` : undefined,
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
          detail: showDetails ? `   ${event.item.rarity} ${event.item.baseItem.type}` : undefined,
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
          detail: showDetails ? `   (基礎ダメージ + スケーリング × 属性係数)` : undefined,
        };
      case "SkillHeal":
        return { text: `[スキル] ${event.skillName}で${event.amount}回復！`, color: "green" };
      case "ManaRegenerated":
        return { text: `[MP回復] マナが${event.amount}回復`, color: "blue" };
      case "NotEnoughMana":
        return { text: `[MP不足] マナ不足！ ${event.skillName}には${event.required}MP必要`, color: "gray" };
      case "GoldDropped":
        return { text: `[Gold] ${formatGold(event.amount)}ゴールド獲得！`, color: "yellow" };
      default:
        return { text: "" };
    }
  };

  // ダメージ系のログには詳細を表示
  const showDetails = filter === "damage" || filter === "skill";
  
  return (
    <Box flexDirection="column">
      {displayEvents.map((event, i) => {
        const { text, color, detail } = formatEvent(event, showDetails);
        // 空のイベントはスキップ
        if (!text) return null;
        
        // 詳細表示の有無に関わらず、固定の高さを確保
        if (showDetails && event.type !== "PlayerAttack" && detail) {
          return (
            <Box key={i} flexDirection="column" height={2}>
              <Text color={color} dimColor={i > 9}>
                {text}
              </Text>
              <Text dimColor>{detail}</Text>
            </Box>
          );
        } else {
          return (
            <Box key={i} height={1}>
              <Text color={color} dimColor={i > 9}>
                {text}
              </Text>
            </Box>
          );
        }
      })}
    </Box>
  );
};

export const BattleDetailView: React.FC<Props> = ({ session, battleLog, isPaused }) => {
  const playerStats = calculateTotalStats(session.player);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  
  useInput((input, key) => {
    // Tab キーは親コンポーネントで処理するのでスキップ
    if (key.tab) {
      return;
    }
    
    // 左右キーでログフィルター切り替え
    if (key.leftArrow || key.rightArrow) {
      const filters: LogFilter[] = ["all", "damage", "heal", "loot", "skill", "system"];
      const currentIndex = filters.indexOf(logFilter);
      if (key.leftArrow) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : filters.length - 1;
        setLogFilter(filters[newIndex]);
      } else if (key.rightArrow) {
        const newIndex = currentIndex < filters.length - 1 ? currentIndex + 1 : 0;
        setLogFilter(filters[newIndex]);
      }
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
              <Text>攻撃力: {playerStats.damage} 防御力: {playerStats.defense}</Text>
              <Text>クリティカル: {(playerStats.criticalChance * 100).toFixed(0)}% / {(playerStats.criticalDamage * 100).toFixed(0)}%</Text>
            </Box>
          </Box>
        </Box>

        {/* 敵情報 */}
        <Box width="50%" borderStyle="single" padding={1}>
          <Text bold color="red">敵情報</Text>
          {session.currentMonster ? (
            <Box flexDirection="column">
              <Text>{session.currentMonster.name} Lv.{session.currentMonster.level}</Text>
              <HealthBar
                current={session.currentMonster.currentHealth}
                max={session.currentMonster.stats.maxHealth}
                label="HP"
                color="red"
                width={25}
              />
              <Box marginTop={1}>
                <Text dimColor>攻撃力: {session.currentMonster.stats.damage}</Text>
                <Text dimColor>防御力: {session.currentMonster.stats.defense}</Text>
              </Box>
            </Box>
          ) : (
            <Text dimColor>敵がいません</Text>
          )}
        </Box>
      </Box>

      {/* 戦闘ログ（フル表示） */}
      <Box borderStyle="single" padding={1} flexGrow={1}>
        <Box flexDirection="column" height="100%">
          <Box>
            <Text bold underline>戦闘ログ (最新15件)</Text>
          </Box>
          
          {/* フィルタータブ */}
          <Box marginTop={1}>
            {(() => {
              const tabs = [
                { key: "all", label: "全て" },
                { key: "damage", label: "ダメージ" },
                { key: "heal", label: "回復" },
                { key: "loot", label: "アイテム" },
                { key: "skill", label: "スキル" },
                { key: "system", label: "システム" },
              ];
              
              return tabs.map((tab, index) => (
                <React.Fragment key={tab.key}>
                  <Text
                    color={logFilter === tab.key ? "cyan" : "gray"}
                    bold={logFilter === tab.key}
                  >
                    {tab.label}
                  </Text>
                  {index < tabs.length - 1 && <Text> | </Text>}
                </React.Fragment>
              ));
            })()}
          </Box>
          
          <Box marginTop={1} flexGrow={1} overflow="hidden">
            <BattleLogFull events={battleLog} filter={logFilter} />
          </Box>
        </Box>
      </Box>

      {/* 操作説明 */}
      <Box marginTop={1} height={1}>
        <Text dimColor>
          ←→: ログフィルター | P: 一時停止 | R: 休憩（全回復） | Ctrl+C: 終了
        </Text>
      </Box>
    </Box>
  );
};