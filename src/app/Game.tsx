import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import type { Session, PlayerClass } from "../core/types.ts";
import { createInitialPlayer, createSession } from "../core/session.ts";
import type { ViewType } from "./types.ts";
import { OpeningView } from "./components/OpeningView.tsx";
import { GameContainer } from "./components/GameContainer.tsx";

// データ読み込み（実際はinfra層で行うべき）
import itemsData from "../../data/items.json" assert { type: "json" };
import monstersData from "../../data/monsters.json" assert { type: "json" };
import skillsData from "../../data/skills.json" assert { type: "json" };


export const Game: React.FC = () => {
  const { exit } = useApp();
  
  // ゲームステート
  const [currentView, setCurrentView] = useState<ViewType>("Opening");
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // データ準備
  const baseItems = new Map(
    [...itemsData.weapons, ...itemsData.armors, ...itemsData.accessories].map(
      (item) => [item.id, item]
    )
  );

  // クラス選択後の処理
  const handleClassSelected = (playerClass: PlayerClass) => {
    setSelectedClass(playerClass);
    const player = createInitialPlayer("player1", playerClass);
    // 初期スキルを付与
    player.skills = skillsData.skills.slice(0, 3); // 最初の3つのスキル
    const newSession = createSession("session1", player);
    setSession(newSession);
    setCurrentView("Field");
  };


  // セッション更新
  const handleSessionUpdate = (updatedSession: Session) => {
    setSession(updatedSession);
  };

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

  // 画面表示
  switch (currentView) {
    case "Opening":
      return <OpeningView onClassSelected={handleClassSelected} />;
    
    case "Field":
      if (!session) return <Text>Loading...</Text>;
      return (
        <GameContainer
          session={session}
          onSessionUpdate={handleSessionUpdate}
          baseItems={baseItems}
          monsterTemplates={monstersData.monsters}
          skills={skillsData.skills}
        />
      );
    
    default:
      return <Text>Unknown view</Text>;
  }

};