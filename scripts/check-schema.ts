#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { ItemsDataSchema } from '../data/schemas/item-schema.ts';
import { SkillsDataSchema } from '../data/schemas/skill-schema.ts';
import { MonstersDataSchema } from '../data/schemas/monster-schema.ts';
import { StarterEquipmentDataSchema } from '../data/schemas/starter-equipment-schema.ts';
import { ClassSkillsDataSchema } from '../data/schemas/class-skills-schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 検証対象のファイルとスキーマ
const filesToValidate = [
  { file: 'data/items.json', schema: ItemsDataSchema, name: 'Items' },
  { file: 'data/skills.json', schema: SkillsDataSchema, name: 'Skills' },
  { file: 'data/monsters.json', schema: MonstersDataSchema, name: 'Monsters' },
  { file: 'data/starter-equipment.json', schema: StarterEquipmentDataSchema, name: 'Starter Equipment' },
  { file: 'data/class-skills.json', schema: ClassSkillsDataSchema, name: 'Class Skills' }
];

let hasErrors = false;

console.log('🔍 Validating JSON data with Zod schemas...\n');

for (const { file, schema, name } of filesToValidate) {
  try {
    // データを読み込む
    const dataPath = path.join(rootDir, file);
    const dataContent = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Zodで検証
    const result = schema.safeParse(dataContent);
    
    if (result.success) {
      console.log(`✅ ${name} (${file}) - Valid`);
    } else {
      console.error(`❌ ${name} (${file}) - Invalid`);
      console.error('Errors:');
      result.error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      hasErrors = true;
    }
  } catch (error) {
    console.error(`❌ ${name} (${file}) - Error: ${error.message}`);
    hasErrors = true;
  }
}

// 追加の検証: スキル参照チェック
if (!hasErrors) {
  console.log('\n🔍 Checking skill references...');
  
  try {
    const skillsData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/skills.json'), 'utf8'));
    const classSkillsData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/class-skills.json'), 'utf8'));
    
    const availableSkillIds = new Set(skillsData.skills.map((s: any) => s.id));
    let refErrors = false;
    
    for (const [className, skillIds] of Object.entries(classSkillsData)) {
      if (className === '$schema') continue;
      
      for (const skillId of skillIds as string[]) {
        if (!availableSkillIds.has(skillId)) {
          console.error(`❌ ${className} references non-existent skill: ${skillId}`);
          refErrors = true;
        }
      }
    }
    
    if (!refErrors) {
      console.log('✅ All skill references are valid');
    } else {
      hasErrors = true;
    }
  } catch (error) {
    console.error('❌ Error checking skill references:', error.message);
    hasErrors = true;
  }
}

// 追加の検証: アイテム参照チェック
if (!hasErrors) {
  console.log('\n🔍 Checking item references...');
  
  try {
    const itemsData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/items.json'), 'utf8'));
    const starterEquipmentData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/starter-equipment.json'), 'utf8'));
    const monstersData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/monsters.json'), 'utf8'));
    
    const availableItemIds = new Set([
      ...itemsData.weapons.map((i: any) => i.id),
      ...itemsData.armors.map((i: any) => i.id),
      ...itemsData.accessories.map((i: any) => i.id)
    ]);
    
    let refErrors = false;
    
    // スターター装備の参照チェック
    for (const [className, equipment] of Object.entries(starterEquipmentData)) {
      if (className === '$schema') continue;
      
      for (const equip of equipment as any[]) {
        if (!availableItemIds.has(equip.baseItemId)) {
          console.error(`❌ ${className} starter equipment references non-existent item: ${equip.baseItemId}`);
          refErrors = true;
        }
      }
    }
    
    // モンスターのルートテーブル参照チェック
    for (const monster of monstersData.monsters) {
      for (const loot of monster.lootTable) {
        if (!availableItemIds.has(loot.baseItemId)) {
          console.error(`❌ ${monster.name} loot table references non-existent item: ${loot.baseItemId}`);
          refErrors = true;
        }
      }
    }
    
    if (!refErrors) {
      console.log('✅ All item references are valid');
    } else {
      hasErrors = true;
    }
  } catch (error) {
    console.error('❌ Error checking item references:', error.message);
    hasErrors = true;
  }
}

console.log('\n' + (hasErrors ? '❌ Validation failed' : '✅ All validations passed'));
process.exit(hasErrors ? 1 : 0);