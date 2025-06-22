import { z } from 'zod';
import { ElementTypeSchema } from './item-schema.ts';

// MonsterStats
const MonsterStatsSchema = z.object({
  health: z.number().int().min(1),
  damage: z.number().int().min(1),
  defense: z.number().int().min(0),
  criticalChance: z.number().min(0).max(1),
  criticalDamage: z.number().min(1),
  lifeSteal: z.number().min(0).max(1)
});

// ElementResistance
const ElementResistanceSchema = z.object({
  Physical: z.number().int().optional(),
  Fire: z.number().int().optional(),
  Ice: z.number().int().optional(),
  Lightning: z.number().int().optional(),
  Holy: z.number().int().optional(),
  Dark: z.number().int().optional()
});

// LootEntry
const LootEntrySchema = z.object({
  baseItemId: z.string(),
  dropChance: z.number().min(0).max(1),
  rarityWeights: z.object({
    common: z.number().min(0),
    magic: z.number().min(0),
    rare: z.number().min(0),
    legendary: z.number().min(0)
  })
});

// MonsterTemplate
export const MonsterTemplateSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string(),
  levelRange: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1)
  }),
  baseStats: MonsterStatsSchema,
  elementResistance: ElementResistanceSchema.optional(),
  lootTable: z.array(LootEntrySchema)
});

// Monsters data structure
export const MonstersDataSchema = z.object({
  $schema: z.string().optional(),
  monsters: z.array(MonsterTemplateSchema)
});

export type MonstersData = z.infer<typeof MonstersDataSchema>;
export type MonsterTemplate = z.infer<typeof MonsterTemplateSchema>;