import type { Player, Item, CharacterStats, EquipmentSlot } from "../../core/types.ts";
import { calculateTotalStats } from "../../core/combat.ts";

export type StatChange = {
  attack: { current: number; new: number; diff: number };
  defense: { current: number; new: number; diff: number };
  health: { current: number; new: number; diff: number };
  mana: { current: number; new: number; diff: number };
};

export const calculateStatChanges = (
  player: Player,
  item: Item,
  slot: EquipmentSlot
): StatChange => {
  // 現在のステータス
  const currentStats = calculateTotalStats(player);
  
  // 装備変更後のプレイヤーを仮想的に作成
  const newEquipment = new Map(player.equipment);
  newEquipment.set(slot, item);
  const newPlayer: Player = {
    ...player,
    equipment: newEquipment,
  };
  
  // 新しいステータスを計算
  const newStats = calculateTotalStats(newPlayer);
  
  return {
    attack: {
      current: currentStats.damage,
      new: newStats.damage,
      diff: newStats.damage - currentStats.damage,
    },
    defense: {
      current: currentStats.defense,
      new: newStats.defense,
      diff: newStats.defense - currentStats.defense,
    },
    health: {
      current: currentStats.maxHealth,
      new: newStats.maxHealth,
      diff: newStats.maxHealth - currentStats.maxHealth,
    },
    mana: {
      current: currentStats.maxMana,
      new: newStats.maxMana,
      diff: newStats.maxMana - currentStats.maxMana,
    },
  };
};