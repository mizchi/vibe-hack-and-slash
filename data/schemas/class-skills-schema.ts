import { z } from 'zod';

// ClassSkills data structure
export const ClassSkillsDataSchema = z.object({
  $schema: z.string().optional(),
  Warrior: z.array(z.string().regex(/^[a-z_]+$/)),
  Mage: z.array(z.string().regex(/^[a-z_]+$/)),
  Rogue: z.array(z.string().regex(/^[a-z_]+$/)),
  Paladin: z.array(z.string().regex(/^[a-z_]+$/))
});

export type ClassSkillsData = z.infer<typeof ClassSkillsDataSchema>;