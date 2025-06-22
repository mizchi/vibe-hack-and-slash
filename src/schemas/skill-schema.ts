import { z } from 'zod';
import { ElementTypeSchema, PlayerClassSchema } from './item-schema.ts';

// SkillType enum
export const SkillTypeSchema = z.enum(["Active", "Passive"]);

// SkillTargetType enum
export const SkillTargetTypeSchema = z.enum(["Self", "Enemy", "All"]);

// SkillEffect variants
const DamageEffectSchema = z.object({
  type: z.literal("Damage"),
  baseDamage: z.number().int().min(0),
  scaling: z.number().min(0),
  element: ElementTypeSchema
});

const HealEffectSchema = z.object({
  type: z.literal("Heal"),
  baseHeal: z.number().int().min(0),
  scaling: z.number().min(0)
});

const BuffEffectSchema = z.object({
  type: z.literal("Buff"),
  stat: z.string(),
  value: z.number(),
  duration: z.number().int()
});

const DebuffEffectSchema = z.object({
  type: z.literal("Debuff"),
  stat: z.string(),
  value: z.number(),
  duration: z.number().int()
});

const StunEffectSchema = z.object({
  type: z.literal("Stun"),
  duration: z.number().int().min(1)
});

const DamageOverTimeEffectSchema = z.object({
  type: z.literal("DamageOverTime"),
  damage: z.number().int().min(0),
  duration: z.number().int().min(1),
  element: ElementTypeSchema
});

const LifeDrainEffectSchema = z.object({
  type: z.literal("LifeDrain"),
  percentage: z.number().min(0).max(1)
});

export const SkillEffectSchema = z.discriminatedUnion("type", [
  DamageEffectSchema,
  HealEffectSchema,
  BuffEffectSchema,
  DebuffEffectSchema,
  StunEffectSchema,
  DamageOverTimeEffectSchema,
  LifeDrainEffectSchema
]);

// TriggerCondition variants
const AlwaysTriggerSchema = z.object({
  type: z.literal("Always")
});

const HealthBelowTriggerSchema = z.object({
  type: z.literal("HealthBelow"),
  percentage: z.number().min(0).max(1)
});

const ManaAboveTriggerSchema = z.object({
  type: z.literal("ManaAbove"),
  percentage: z.number().min(0).max(1)
});

const EnemyHealthBelowTriggerSchema = z.object({
  type: z.literal("EnemyHealthBelow"),
  percentage: z.number().min(0).max(1)
});

const CriticalHitTriggerSchema = z.object({
  type: z.literal("CriticalHit")
});

const OnKillTriggerSchema = z.object({
  type: z.literal("OnKill")
});

const TurnIntervalTriggerSchema = z.object({
  type: z.literal("TurnInterval"),
  interval: z.number().int().min(1)
});

export const TriggerConditionSchema = z.discriminatedUnion("type", [
  AlwaysTriggerSchema,
  HealthBelowTriggerSchema,
  ManaAboveTriggerSchema,
  EnemyHealthBelowTriggerSchema,
  CriticalHitTriggerSchema,
  OnKillTriggerSchema,
  TurnIntervalTriggerSchema
]);

// Skill
export const SkillSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string(),
  description: z.string(),
  type: SkillTypeSchema,
  manaCost: z.number().int().min(0),
  cooldown: z.number().int().min(0),
  targetType: SkillTargetTypeSchema,
  effects: z.array(SkillEffectSchema),
  triggerConditions: z.array(TriggerConditionSchema),
  priority: z.number().int().min(1).max(10),
  requiredWeaponTags: z.array(z.string()).optional(),
  requiredClass: z.array(PlayerClassSchema).optional(),
  guaranteedCritical: z.boolean().optional()
});

// Skills data structure
export const SkillsDataSchema = z.object({
  $schema: z.string().optional(),
  skills: z.array(SkillSchema)
});

export type SkillsData = z.infer<typeof SkillsDataSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type SkillEffect = z.infer<typeof SkillEffectSchema>;
export type TriggerCondition = z.infer<typeof TriggerConditionSchema>;