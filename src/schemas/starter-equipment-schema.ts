import { z } from 'zod';

// EquipmentSlot enum
const EquipmentSlotSchema = z.enum([
  "MainHand", "OffHand", "Armor", "Helm", "Gloves", 
  "Boots", "Ring1", "Ring2", "Amulet", "Belt"
]);

// StarterEquipmentEntry
const StarterEquipmentEntrySchema = z.object({
  baseItemId: z.string(),
  slot: EquipmentSlotSchema
});

// StarterEquipment data structure
export const StarterEquipmentDataSchema = z.object({
  $schema: z.string().optional(),
  Warrior: z.array(StarterEquipmentEntrySchema),
  Mage: z.array(StarterEquipmentEntrySchema),
  Rogue: z.array(StarterEquipmentEntrySchema),
  Paladin: z.array(StarterEquipmentEntrySchema)
});

export type StarterEquipmentData = z.infer<typeof StarterEquipmentDataSchema>;