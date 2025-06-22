#!/usr/bin/env tsx
import React from "react";
import { render, Box } from "ink";
import { readFileSync } from "fs";
import { CommonHeader } from "../src/app/components/CommonHeader.tsx";
import { BattleDetailView } from "../src/app/components/BattleDetailView.tsx";
import { EquipmentDetailView } from "../src/app/components/EquipmentDetailView.tsx";
import { ClearScreen } from "../src/app/components/ClearScreen.tsx";
import type { Session, BaseItem, ItemId, Skill, BattleEvent, Item } from "../src/core/types.ts";

// コマンドライン引数から状態ファイルを読み込む
const stateFile = process.argv[2];
if (!stateFile) {
  console.error("Usage: tsx scripts/render-ui.ts <state.json>");
  process.exit(1);
}

try {
  const stateJson = readFileSync(stateFile, "utf-8");
  const state = JSON.parse(stateJson);

  // セッションの準備（デフォルト値を設定）
  const defaultSession: Session = {
    id: "test-session",
    player: {
      id: "player1",
      class: "Warrior",
      level: 1,
      experience: 0,
      currentHealth: 100,
      currentMana: 30,
      equipment: new Map(),
      skills: [],
      skillCooldowns: new Map(),
      skillTimers: new Map(),
      gold: 100,
      baseStats: {
        maxHealth: 100,
        maxMana: 30,
        damage: 10,
        defense: 5,
        criticalChance: 0.1,
        criticalDamage: 1.5,
        lifeSteal: 0,
        manaRegen: 5,
        skillPower: 10,
      },
      baseAttributes: {
        strength: 10,
        intelligence: 5,
        dexterity: 8,
        vitality: 10,
      },
      elementResistance: {
        Physical: 0,
        Fire: 0,
        Ice: 0,
        Lightning: 0,
        Holy: 0,
        Dark: 0,
      },
    },
    defeatedCount: 0,
    state: "InProgress",
    startedAt: new Date(),
    ...state.session,
  };

  // equipment をMapに変換
  if (state.session?.player?.equipment) {
    const equipmentMap = new Map();
    if (Array.isArray(state.session.player.equipment)) {
      state.session.player.equipment.forEach(([slot, item]: any) => {
        equipmentMap.set(slot, item);
      });
    } else if (typeof state.session.player.equipment === "object") {
      Object.entries(state.session.player.equipment).forEach(([slot, item]) => {
        equipmentMap.set(slot, item);
      });
    }
    defaultSession.player.equipment = equipmentMap;
  }

  // skillTimers をMapに変換
  if (state.session?.player?.skillTimers) {
    const skillTimersMap = new Map();
    if (Array.isArray(state.session.player.skillTimers)) {
      state.session.player.skillTimers.forEach(([skillId, timer]: any) => {
        skillTimersMap.set(skillId, timer);
      });
    } else if (typeof state.session.player.skillTimers === "object") {
      Object.entries(state.session.player.skillTimers).forEach(([skillId, timer]) => {
        skillTimersMap.set(skillId, timer);
      });
    }
    defaultSession.player.skillTimers = skillTimersMap;
  }
  
  // skillCooldowns をMapに変換
  if (state.session?.player?.skillCooldowns) {
    const skillCooldownsMap = new Map();
    if (Array.isArray(state.session.player.skillCooldowns)) {
      state.session.player.skillCooldowns.forEach(([skillId, cooldown]: any) => {
        skillCooldownsMap.set(skillId, cooldown);
      });
    } else if (typeof state.session.player.skillCooldowns === "object") {
      Object.entries(state.session.player.skillCooldowns).forEach(([skillId, cooldown]) => {
        skillCooldownsMap.set(skillId, cooldown);
      });
    }
    defaultSession.player.skillCooldowns = skillCooldownsMap;
  }

  // バトルログとインベントリを準備
  const battleLog: BattleEvent[] = state.battleLog || [];
  const inventory: Item[] = state.inventory || [];

  // コンポーネントのレンダリング
  const App = () => {
    const [viewMode, setViewMode] = React.useState<"battle" | "equipment">("battle");
    const [session, setSession] = React.useState(defaultSession);

    return (
      <ClearScreen>
        <Box flexDirection="column" height={40}>
          <CommonHeader session={session} currentView={viewMode} />
          
          <Box flexGrow={1} overflow="hidden">
            {viewMode === "battle" ? (
              <BattleDetailView
                session={session}
                battleLog={battleLog}
                isPaused={false}
              />
            ) : (
              <EquipmentDetailView
                session={session}
                onSessionUpdate={setSession}
                inventory={inventory}
                onInventoryUpdate={() => {}}
                battleStatus={state.battleStatus || { isInBattle: false }}
              />
            )}
          </Box>
        </Box>
      </ClearScreen>
    );
  };

  const { waitUntilExit } = render(<App />);

  waitUntilExit();
} catch (error) {
  console.error("Error loading state file:", error);
  process.exit(1);
}