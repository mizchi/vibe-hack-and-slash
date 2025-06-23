import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import type { Session, PlayerClass, ItemId, BaseItem, PlayerId, EquipmentSlot, SessionId, Skill, Item, Level } from "../core/types.ts";
import { createInitialPlayer, createSession } from "../core/session.ts";
import type { ViewType } from "./types.ts";
import { OpeningView } from "./components/OpeningView.tsx";
import { GameContainer } from "./components/GameContainer.tsx";

// データ読み込み（実際はinfra層で行うべき）
import itemsData from "../../data/items.json" assert { type: "json" };
import monstersData from "../../data/monsters.json" assert { type: "json" };
import skillsData from "../../data/skills.json" assert { type: "json" };
import starterEquipmentData from "../../data/starter-equipment.json" assert { type: "json" };
import classSkillsData from "../../data/class-skills.json" assert { type: "json" };


export const Game: React.FC = () => {
  const { exit } = useApp();
  
  // ゲームステート
  const [currentView, setCurrentView] = useState<ViewType>("Opening");
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // データ準備
  const baseItems = new Map<ItemId, BaseItem>(
    [...itemsData.weapons, ...itemsData.armors, ...itemsData.accessories].map(
      (item) => [item.id as ItemId, item as BaseItem]
    )
  );

  // クラス選択後の処理
  const handleClassSelected = (playerClass: PlayerClass) => {
    setSelectedClass(playerClass);
    
    // 職業別のスキルを取得
    const classSkillIds = classSkillsData[playerClass] || [];
    const classSkills = skillsData.skills.filter(skill => {
      // クラス専用スキル
      if (classSkillIds.includes(skill.id)) {
        return true;
      }
      // クラス制限がある場合、該当クラスかチェック
      if (skill.requiredClass && skill.requiredClass.length > 0) {
        return skill.requiredClass.includes(playerClass);
      }
      // クラス制限がない基本スキルは含めない（クラス専用スキルのみ）
      return false;
    });
    
    // console.log(`${playerClass} initial skills:`, classSkills.map(s => s.id));
    
    const player = createInitialPlayer("player1" as PlayerId, playerClass, classSkills as Skill[]);
    
    // 初期装備を付与
    const starterEquipment = starterEquipmentData[playerClass] || [];
    starterEquipment.forEach(({ baseItemId, slot }) => {
      const baseItem = baseItems.get(baseItemId as ItemId);
      if (baseItem) {
        const item: Item = {
          id: `starter_${baseItemId}` as ItemId,
          baseItem,
          rarity: "Common",
          level: 1 as Level
        };
        player.equipment.set(slot as EquipmentSlot, item);
      }
    });
    
    const newSession = createSession("session1" as SessionId, player);
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
          skills={skillsData.skills as Skill[]}
        />
      );
    
    default:
      return <Text>Unknown view</Text>;
  }

};