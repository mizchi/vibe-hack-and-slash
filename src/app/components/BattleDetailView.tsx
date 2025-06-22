import React from "react";
import { Box, Text } from "ink";
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
  const percentage = Math.round((current / max) * 100);
  const filled = Math.round((current / max) * width);
  const empty = width - filled;

  return (
    <Box>
      <Text color={color}>{label}: </Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {current}/{max} ({percentage}%)</Text>
    </Box>
  );
};

const BattleLogFull: React.FC<{ events: BattleEvent[] }> = ({ events }) => {
  // 固定高さのために空の行で埋める
  const displayEvents = [...events.slice(-20)];
  while (displayEvents.length < 20) {
    displayEvents.unshift({ type: "PlayerAttack", damage: 0 as any, isCritical: false });
  }
  
  const formatEvent = (event: BattleEvent): { text: string; color?: string } => {
    switch (event.type) {
      case "PlayerAttack":
        if (event.damage === 0) return { text: "" }; // 空行用
        return {
          text: event.isCritical
            ? `⚔️  クリティカルヒット！ ${event.damage}ダメージを与えた！`
            : `⚔️  ${event.damage}ダメージを与えた`,
          color: event.isCritical ? "yellow" : undefined,
        };
      case "MonsterAttack":
        return { text: `🗡️  ${event.damage}ダメージを受けた`, color: "red" };
      case "PlayerHeal":
        return { text: `💚 ${event.amount}HP回復した`, color: "green" };
      case "MonsterDefeated":
        return { text: `✨ モンスターを撃破！ +${event.experience}EXP獲得`, color: "yellow" };
      case "ItemDropped":
        return { text: `📦 ${getItemDisplayName(event.item)}を入手！`, color: "cyan" };
      case "PlayerLevelUp":
        return { text: `🎉 レベルアップ！ Lv.${event.newLevel}になった！`, color: "magenta" };
      case "PlayerDefeated":
        return { text: `💀 倒れてしまった...`, color: "red" };
      case "SkillUsed":
        return { text: `🔮 ${event.skillName}を発動！ (-${event.manaCost}MP)`, color: "blue" };
      case "SkillDamage":
        return { text: `💥 ${event.skillName}で${event.damage}ダメージ！`, color: "magenta" };
      case "SkillHeal":
        return { text: `✨ ${event.skillName}で${event.amount}回復！`, color: "green" };
      case "ManaRegenerated":
        return { text: `💙 マナが${event.amount}回復`, color: "blue" };
      case "NotEnoughMana":
        return { text: `❌ マナ不足！ ${event.skillName}には${event.required}MP必要`, color: "gray" };
      case "GoldDropped":
        return { text: `💰 ${formatGold(event.amount)}ゴールド獲得！`, color: "yellow" };
      default:
        return { text: "" };
    }
  };

  return (
    <Box flexDirection="column" height={20}>
      {displayEvents.map((event, i) => {
        const { text, color } = formatEvent(event);
        return (
          <Text key={i} color={color} dimColor={i < displayEvents.length - 10}>
            {text}
          </Text>
        );
      })}
    </Box>
  );
};

export const BattleDetailView: React.FC<Props> = ({ session, battleLog, isPaused }) => {
  const playerStats = calculateTotalStats(session.player);

  return (
    <Box flexDirection="column" height="100%">
      {/* ヘッダー */}
      <Box borderStyle="double" padding={1} marginBottom={1}>
        <Text bold>⚔️  戦闘詳細</Text>
        {isPaused && <Text color="yellow"> ⏸ 一時停止中</Text>}
      </Box>

      {/* 戦闘状況 */}
      <Box flexDirection="row" marginBottom={1}>
        {/* プレイヤー情報 */}
        <Box width="50%" borderStyle="single" padding={1} marginRight={1}>
          <Text bold color="green">◆ {session.player.class} Lv.{session.player.level} ◆</Text>
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
          <Box marginTop={1}>
            <Text>攻撃力: {playerStats.damage} 防御力: {playerStats.defense}</Text>
            <Text>クリティカル: {(playerStats.criticalChance * 100).toFixed(0)}% / {(playerStats.criticalDamage * 100).toFixed(0)}%</Text>
          </Box>
        </Box>

        {/* 敵情報 */}
        <Box width="50%" borderStyle="single" padding={1}>
          <Text bold color="red">◆ 敵情報 ◆</Text>
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
      <Box borderStyle="single" padding={1} height={15}>
        <Text bold underline>戦闘ログ (最新20件)</Text>
        <Box marginTop={1}>
          <BattleLogFull events={battleLog} />
        </Box>
      </Box>

      {/* ステータスサマリー */}
      <Box borderStyle="single" padding={1} marginTop={1}>
        <Text>
          <Text bold>戦績: </Text>
          <Text>撃破数: {session.defeatedCount}体 | </Text>
          <Text color="yellow">所持金: {formatGold(session.player.gold)}G | </Text>
          <Text>EXP: {session.player.experience}/{session.player.level * 100}</Text>
        </Text>
      </Box>

      {/* 操作説明 */}
      <Box marginTop={1}>
        <Text dimColor>
          Tab: 装備管理へ | P: 一時停止 | R: 休憩（全回復） | Ctrl+C: 終了
        </Text>
      </Box>
    </Box>
  );
};