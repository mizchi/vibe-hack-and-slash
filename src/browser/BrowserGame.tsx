import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp } from '../../packages/ink-browser';
import { ClassSelectionView } from './components/ClassSelectionView';
import { BattleView } from './components/BattleView';
import type { 
  PlayerClass, 
  Session, 
  BattleEvent,
  PlayerId,
  SessionId,
  BaseItem,
  ItemId,
  Skill
} from '../core/types';
import { 
  createInitialPlayer, 
  createSession,
  processBattleTurn,
  spawnMonster
} from '../core/session';
import { loadGameData } from './data-loader';

type ViewType = "Opening" | "ClassSelection" | "Battle" | "GameOver";

export const BrowserGame: React.FC = () => {
  const { exit } = useApp();
  
  // ゲームステート
  const [currentView, setCurrentView] = useState<ViewType>("ClassSelection");
  const [session, setSession] = useState<Session | null>(null);
  const [battleLog, setBattleLog] = useState<BattleEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  
  // データのセットアップ
  const baseItems = useRef<Map<ItemId, BaseItem>>(new Map());
  const skills = useRef<Skill[]>([]);
  const [gameData, setGameData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // ゲームデータの読み込み
    loadGameData().then(data => {
      setGameData(data);
      
      // ベースアイテムの読み込み
      data.baseItemsData.items.forEach((item: any) => {
        baseItems.current.set(item.id as ItemId, item as BaseItem);
      });
      
      // スキルの読み込み
      skills.current = data.skillsData.skills as Skill[];
      
      setIsLoading(false);
    }).catch(error => {
      console.error('Failed to load game data:', error);
      setIsLoading(false);
    });
  }, []);
  
  // バトルループ
  useEffect(() => {
    if (!session || isPaused || currentView !== "Battle") return;
    
    const battleTimer = setInterval(async () => {
      const result = await processBattleTurn(
        session,
        baseItems.current,
        gameData?.monsterTemplatesData?.monsters || [],
        skills.current,
        turnCount
      );
      
      if (result.ok) {
        const { events, updatedSession } = result.value;
        setSession(updatedSession);
        setBattleLog(prev => [...prev, ...events]);
        setTurnCount(prev => prev + 1);
        
        // ゲームオーバーチェック
        if (updatedSession.player.currentHealth === 0) {
          setCurrentView("GameOver");
        }
      }
    }, 500); // 0.5秒ごとにターンを処理
    
    return () => clearInterval(battleTimer);
  }, [session, isPaused, currentView, turnCount, gameData]);
  
  // クラス選択ハンドラ
  const handleSelectClass = (playerClass: PlayerClass) => {
    if (!gameData) return;
    
    // 初期スキルの設定
    const classSkillIds = (gameData.classSkillsData as any)[playerClass] || [];
    const classSkills = skills.current.filter(skill => 
      classSkillIds.includes(skill.id)
    );
    
    // プレイヤー作成
    const player = createInitialPlayer(
      "player1" as PlayerId,
      playerClass,
      classSkills
    );
    
    // 初期装備の設定
    const starterItems = (gameData.starterEquipmentData as any)[playerClass];
    if (starterItems) {
      Object.entries(starterItems).forEach(([slot, itemId]) => {
        const baseItem = baseItems.current.get(itemId as ItemId);
        if (baseItem) {
          player.equipment.set(slot as any, {
            id: `${itemId}_starter` as ItemId,
            baseItem,
            rarity: "Common",
            level: 1 as any,
          });
        }
      });
    }
    
    // セッション作成
    const newSession = createSession(
      "session1" as SessionId,
      player
    );
    
    // 初期モンスターの生成
    const monster = spawnMonster(
      gameData.monsterTemplatesData.monsters,
      player.level
    );
    newSession.currentMonster = monster;
    
    setSession(newSession);
    setCurrentView("Battle");
  };
  
  // ローディング中
  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">Loading game data...</Text>
      </Box>
    );
  }
  
  // ビューのレンダリング
  switch (currentView) {
    case "ClassSelection":
      return <ClassSelectionView onSelectClass={handleSelectClass} />;
      
    case "Battle":
      if (!session) return null;
      return (
        <BattleView
          session={session}
          battleLog={battleLog}
          isPaused={isPaused}
          onPause={() => setIsPaused(true)}
          onResume={() => setIsPaused(false)}
          onRest={() => {
            // 休憩機能（未実装）
            console.log("Rest not implemented");
          }}
        />
      );
      
    case "GameOver":
      return (
        <Box flexDirection="column">
          <Box borderStyle="double" padding={1}>
            <Text color="red" bold>GAME OVER</Text>
          </Box>
          <Box marginTop={1}>
            <Text>撃破数: {session?.defeatedCount || 0}体</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>ブラウザをリロードして再スタート</Text>
          </Box>
        </Box>
      );
      
    default:
      return null;
  }
};