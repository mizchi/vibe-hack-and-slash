import type { Player, Item, CharacterStats, EquipmentSlot } from "../../core/types.ts";
import { calculateTotalStats } from "../../core/damage.ts";

export type StatChange = {
  attack: { current: number; new: number; diff: number };
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
      current: currentStats.baseDamage,
      new: newStats.baseDamage,
      diff: newStats.baseDamage - currentStats.baseDamage,
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