import { z } from 'zod';

// ItemTag enum
export const ItemTagSchema = z.enum([
  "OneHanded", "TwoHanded", "Shield", "Staff", "Dagger",
  "Sword", "Axe", "Mace", "Bow", "Spear",
  "HeavyArmor", "LightArmor", "ClothArmor",
  "Ring", "Amulet", "Belt", "Helm", "Gloves", "Boots"
]);

// PlayerClass enum
export const PlayerClassSchema = z.enum(["Warrior", "Mage", "Rogue", "Paladin"]);

// ItemType enum
export const ItemTypeSchema = z.enum(["Weapon", "Armor", "Accessory"]);

// ElementType enum
export const ElementTypeSchema = z.enum([
  "Physical", "Fire", "Ice", "Lightning", "Holy", "Dark"
]);

// ItemModifier variants
const IncreaseDamageModifier = z.object({
  type: z.literal("IncreaseDamage"),
  value: z.number().int().min(1)
});

const IncreaseHealthModifier = z.object({
  type: z.literal("IncreaseHealth"),
  value: z.number().int().min(1)
});

const IncreaseDefenseModifier = z.object({
  type: z.literal("IncreaseDefense"),
  value: z.number().int().min(1)
});

const LifeStealModifier = z.object({
  type: z.literal("LifeSteal"),
  percentage: z.number().min(0).max(1)
});

const CriticalChanceModifier = z.object({
  type: z.literal("CriticalChance"),
  percentage: z.number().min(0).max(1)
});

const CriticalDamageModifier = z.object({
  type: z.literal("CriticalDamage"),
  multiplier: z.number().min(1)
});

const IncreaseManaModifier = z.object({
  type: z.literal("IncreaseMana"),
  value: z.number().int().min(1)
});

const ManaRegenModifier = z.object({
  type: z.literal("ManaRegen"),
  value: z.number().int().min(1)
});

const SkillPowerModifier = z.object({
  type: z.literal("SkillPower"),
  value: z.number().int().min(1)
});

const IncreaseStrengthModifier = z.object({
  type: z.literal("IncreaseStrength"),
  value: z.number().int().min(1)
});

const IncreaseIntelligenceModifier = z.object({
  type: z.literal("IncreaseIntelligence"),
  value: z.number().int().min(1)
});

const IncreaseDexterityModifier = z.object({
  type: z.literal("IncreaseDexterity"),
  value: z.number().int().min(1)
});

const IncreaseVitalityModifier = z.object({
  type: z.literal("IncreaseVitality"),
  value: z.number().int().min(1)
});

const ElementResistanceModifier = z.object({
  type: z.literal("ElementResistance"),
  element: ElementTypeSchema,
  value: z.number().int()
});

const ElementDamageModifier = z.object({
  type: z.literal("ElementDamage"),
  element: ElementTypeSchema,
  percentage: z.number().min(0)
});

export const ItemModifierSchema = z.discriminatedUnion("type", [
  IncreaseDamageModifier,
  IncreaseHealthModifier,
  IncreaseDefenseModifier,
  LifeStealModifier,
  CriticalChanceModifier,
  CriticalDamageModifier,
  IncreaseManaModifier,
  ManaRegenModifier,
  SkillPowerModifier,
  IncreaseStrengthModifier,
  IncreaseIntelligenceModifier,
  IncreaseDexterityModifier,
  IncreaseVitalityModifier,
  ElementResistanceModifier,
  ElementDamageModifier
]);

// WeaponScaling
export const WeaponScalingSchema = z.object({
  strength: z.number().min(0).optional(),
  intelligence: z.number().min(0).optional(),
  dexterity: z.number().min(0).optional()
});

// BaseItem
export const BaseItemSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string(),
  type: ItemTypeSchema,
  tags: z.array(ItemTagSchema),
  baseModifiers: z.array(ItemModifierSchema),
  requiredLevel: z.number().int().min(1).optional(),
  requiredClass: z.array(PlayerClassSchema).optional(),
  weaponScaling: WeaponScalingSchema.optional(),
  elementType: ElementTypeSchema.optional()
});

// Items data structure
export const ItemsDataSchema = z.object({
  $schema: z.string().optional(),
  weapons: z.array(BaseItemSchema),
  armors: z.array(BaseItemSchema),
  accessories: z.array(BaseItemSchema)
});

export type ItemsData = z.infer<typeof ItemsDataSchema>;
export type BaseItem = z.infer<typeof BaseItemSchema>;
export type ItemModifier = z.infer<typeof ItemModifierSchema>;