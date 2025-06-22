import React, { useState, useEffect } from "react";
import { Box, useInput } from "ink";
import type { Session, Item, BattleEvent, BaseItem, ItemId, Skill } from "../../core/types.ts";
import { processBattleTurn, processAction } from "../../core/session.ts";
import { BattleDetailView } from "./BattleDetailView.tsx";
import { EquipmentDetailView } from "./EquipmentDetailView.tsx";
import { ClearScreen } from "./ClearScreen.tsx";
import { CommonHeader } from "./CommonHeader.tsx";

type Props = {
  session: Session;
  onSessionUpdate: (session: Session) => void;
  baseItems: Map<ItemId, BaseItem>;
  monsterTemplates: any[];
  skills: Skill[];
};

type ViewMode = "battle" | "equipment";

export const GameContainer: React.FC<Props> = ({
  session: initialSession,
  onSessionUpdate,
  baseItems,
  monsterTemplates,
  skills,
}) => {
  const [session, setSession] = useState(initialSession);
  const [battleLog, setBattleLog] = useState<BattleEvent[]>([]);
  const [isInBattle, setIsInBattle] = useState(true); // 自動で戦闘開始
  const [isPaused, setIsPaused] = useState(false);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [turn, setTurn] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("battle");
  const [viewKey, setViewKey] = useState(0); // 画面切り替え時のキー
  const [gameSpeed, setGameSpeed] = useState<0 | 1 | 3 | 5>(1); // ゲームスピード

  // バトル自動進行
  useEffect(() => {
    if (!session || !isInBattle || isPaused || session.state === "Completed" || gameSpeed === 0) return;

    const baseDelay = 1000;
    const actualDelay = Math.floor(baseDelay / gameSpeed);
    
    const timer = setTimeout(() => {
      const result = processBattleTurn(
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

        // プレイヤーが倒れたら自動復活して戦闘継続
        if (result.value.updatedSession.player.currentHealth === 0) {
          const totalStats = result.value.updatedSession.player.baseStats;
          const revivedSession = {
            ...result.value.updatedSession,
            player: {
              ...result.value.updatedSession.player,
              currentHealth: totalStats.maxHealth,
              currentMana: totalStats.maxMana,
            },
            state: "InProgress" as const,
          };
          setSession(revivedSession);
          onSessionUpdate(revivedSession);
          setBattleLog((prev) => [...prev, { type: "PlayerHeal" as const, amount: totalStats.maxHealth }]);
        }
      }
    }, actualDelay);

    return () => clearTimeout(timer);
  }, [session, isInBattle, isPaused, turn, gameSpeed]);

  // キー入力
  useInput((input, key) => {
    // Tab でビュー切り替え
    if (key.tab) {
      setViewMode(viewMode === "battle" ? "equipment" : "battle");
      setViewKey(prev => prev + 1); // キーを更新して再マウント
    }

    // P キーで一時停止
    if (input === "p") {
      setIsPaused(!isPaused);
    }
    
    // Space キーでゲームスピード切り替え
    if (input === " ") {
      const speeds: Array<0 | 1 | 3 | 5> = [0, 1, 3, 5];
      const currentIndex = speeds.indexOf(gameSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      setGameSpeed(speeds[nextIndex]);
    }

    // R キーで休憩（全回復）
    if (input === "r") {
      const totalStats = session.player.baseStats;
      const healedSession = {
        ...session,
        player: {
          ...session.player,
          currentHealth: totalStats.maxHealth,
          currentMana: totalStats.maxMana,
        },
        state: "InProgress" as const,
      };
      setSession(healedSession);
      onSessionUpdate(healedSession);
    }
  });

  // バトル状況
  const battleStatus = {
    isInBattle,
    currentMonster: session.currentMonster ? {
      name: session.currentMonster.name,
      level: session.currentMonster.level,
      healthPercent: Math.round((session.currentMonster.currentHealth / session.currentMonster.stats.maxHealth) * 100),
    } : undefined,
  };

  // セッション更新ハンドラ
  const handleSessionUpdate = (updatedSession: Session) => {
    setSession(updatedSession);
    onSessionUpdate(updatedSession);
  };

  // インベントリ更新ハンドラ
  const handleInventoryUpdate = (updatedInventory: Item[]) => {
    setInventory(updatedInventory);
  };

  // ビューの表示（画面クリア付き）
  return (
    <ClearScreen key={`view-${viewKey}`}>
      <Box flexDirection="column" height={40}>
        <CommonHeader session={session} currentView={viewMode} gameSpeed={gameSpeed} />
        
        <Box flexGrow={1} overflow="hidden">
          {viewMode === "battle" ? (
            <BattleDetailView
              session={session}
              battleLog={battleLog}
              isPaused={isPaused}
            />
          ) : (
            <EquipmentDetailView
              session={session}
              onSessionUpdate={handleSessionUpdate}
              inventory={inventory}
              onInventoryUpdate={handleInventoryUpdate}
              battleStatus={battleStatus}
            />
          )}
        </Box>
      </Box>
    </ClearScreen>
  );
};