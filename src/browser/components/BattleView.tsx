import React from 'react';
import { Box, Text, useInput } from '../../../packages/ink-browser';
import type { Session, BattleEvent } from '../../core/types';

interface BattleViewProps {
  session: Session;
  battleLog: BattleEvent[];
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onRest: () => void;
}

const HealthBar: React.FC<{ current: number; max: number; label: string; color: string; width?: number }> = ({
  current,
  max,
  label,
  color,
  width = 20,
}) => {
  const percentage = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const filled = Math.max(0, Math.min(width, Math.round((current / max) * width)));
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

export const BattleView: React.FC<BattleViewProps> = ({
  session,
  battleLog,
  isPaused,
  onPause,
  onResume,
  onRest,
}) => {
  useInput((input, key) => {
    if (input === 'p' || input === 'P') {
      if (isPaused) {
        onResume();
      } else {
        onPause();
      }
    } else if (input === 'r' || input === 'R') {
      onRest();
    }
  });

  // 最新のログ5件を取得
  const recentLogs = battleLog.slice(-5);

  return (
    <Box flexDirection="column">
      {/* 一時停止表示 */}
      {isPaused && (
        <Box marginBottom={1}>
          <Text color="yellow" bold>[一時停止中]</Text>
        </Box>
      )}

      {/* 戦闘状況 */}
      <Box flexDirection="row" marginBottom={1}>
        {/* 左側：味方 */}
        <Box width="50%" borderStyle="single" padding={1} marginRight={1}>
          <Text bold underline color="green">味方</Text>
          <Box flexDirection="column" marginTop={1}>
            <Box flexDirection="column">
              <Box>
                <Text color="green">{session.player.class} Lv.{session.player.level}</Text>
              </Box>
              <Box>
                <HealthBar
                  current={session.player.currentHealth}
                  max={session.player.baseStats.maxHealth}
                  label="HP"
                  color="green"
                  width={30}
                />
              </Box>
              <Box>
                {/* リソース表示 */}
                {(() => {
                  const pool = session.player.resourcePool;
                  const resources = [];
                  if (pool.White > 0) resources.push({ color: 'white', symbol: '○', value: pool.White });
                  if (pool.Red > 0) resources.push({ color: 'red', symbol: '●', value: pool.Red });
                  if (pool.Blue > 0) resources.push({ color: 'blue', symbol: '●', value: pool.Blue });
                  if (pool.Green > 0) resources.push({ color: 'green', symbol: '●', value: pool.Green });
                  if (pool.Black > 0) resources.push({ color: 'magenta', symbol: '●', value: pool.Black });
                  
                  return resources.map((res, idx) => (
                    <React.Fragment key={res.color}>
                      <Text color={res.color}>{res.symbol}{res.value}</Text>
                      {idx < resources.length - 1 && <Text> </Text>}
                    </React.Fragment>
                  ));
                })()}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 右側：敵 */}
        <Box width="50%" borderStyle="single" padding={1}>
          <Text bold underline color="red">敵 (Wave {session.wave})</Text>
          <Box flexDirection="column" marginTop={1}>
            {session.currentMonster ? (
              <Box flexDirection="column">
                <Box>
                  <Text color={session.currentMonster.currentHealth > 0 ? "red" : "gray"}>
                    {session.currentMonster.name} Lv.{session.currentMonster.level}
                  </Text>
                </Box>
                <Box>
                  <HealthBar
                    current={session.currentMonster.currentHealth}
                    max={session.currentMonster.stats.maxHealth}
                    label="HP"
                    color={session.currentMonster.currentHealth > 0 ? "red" : "gray"}
                    width={30}
                  />
                </Box>
              </Box>
            ) : (
              <Text dimColor>敵がいません</Text>
            )}
          </Box>
        </Box>
      </Box>

      {/* 戦闘ログ */}
      <Box borderStyle="single" padding={1} height={8}>
        <Box flexDirection="column">
          <Text bold underline>戦闘ログ</Text>
          {recentLogs.map((event, idx) => {
            let text = '';
            let color: string | undefined;
            
            switch (event.type) {
              case 'PlayerAttack':
                text = `[攻撃] ${event.damage}ダメージを与えた`;
                color = 'cyan';
                break;
              case 'MonsterAttack':
                text = `[被弾] ${event.damage}ダメージを受けた`;
                color = 'red';
                break;
              case 'MonsterDefeated':
                text = `[撃破] ${event.monsterName}を倒した！`;
                color = 'yellow';
                break;
              case 'ItemDropped':
                text = `[入手] ${event.item.baseItem.name}を入手！`;
                color = 'green';
                break;
              case 'PlayerLevelUp':
                text = `[LvUP] レベル${event.newLevel}になった！`;
                color = 'magenta';
                break;
              default:
                text = '';
            }
            
            if (text) {
              return (
                <Box key={idx}>
                  <Text color={color}>{text}</Text>
                </Box>
              );
            }
            return null;
          })}
        </Box>
      </Box>

      {/* 操作説明 */}
      <Box marginTop={1}>
        <Text dimColor>P: 一時停止 | R: 休憩</Text>
      </Box>
    </Box>
  );
};