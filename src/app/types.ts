import type { PlayerClass } from "../core/types.ts";

// 画面の種類
export type ViewType = "Opening" | "Field" | "Battle";

// アプリケーションの状態
export type AppState = {
  currentView: ViewType;
  selectedClass?: PlayerClass;
};