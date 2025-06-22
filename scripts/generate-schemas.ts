#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { ItemsDataSchema } from '../src/schemas/item-schema.ts';
import { SkillsDataSchema } from '../src/schemas/skill-schema.ts';
import { MonstersDataSchema } from '../src/schemas/monster-schema.ts';
import { StarterEquipmentDataSchema } from '../src/schemas/starter-equipment-schema.ts';
import { ClassSkillsDataSchema } from '../src/schemas/class-skills-schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const schemasDir = path.join(rootDir, 'schemas');

// スキーマ生成の設定
const schemas = [
  { name: 'items', schema: ItemsDataSchema },
  { name: 'skills', schema: SkillsDataSchema },
  { name: 'monsters', schema: MonstersDataSchema },
  { name: 'starter-equipment', schema: StarterEquipmentDataSchema },
  { name: 'class-skills', schema: ClassSkillsDataSchema }
];

// schemasディレクトリが存在しない場合は作成
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, { recursive: true });
}

console.log('🔨 Generating JSON Schemas from Zod schemas...\n');

for (const { name, schema } of schemas) {
  try {
    // ZodスキーマからJSON Schemaを生成
    const jsonSchema = zodToJsonSchema(schema, {
      name: `${name}.schema`,
      $refStrategy: "relative",
      basePath: [`https://example.com/hacknslash`],
      target: "jsonSchema7",
      errorMessages: true
    });
    
    // $schema と $id を追加
    const schemaWithMeta = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: `https://example.com/hacknslash/${name}.schema.json`,
      title: `${name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')} Schema`,
      ...jsonSchema
    };
    
    // ファイルに書き込み
    const outputPath = path.join(schemasDir, `${name}.schema.json`);
    fs.writeFileSync(
      outputPath, 
      JSON.stringify(schemaWithMeta, null, 2),
      'utf8'
    );
    
    console.log(`✅ Generated ${name}.schema.json`);
  } catch (error) {
    console.error(`❌ Failed to generate ${name}.schema.json:`, error);
  }
}

console.log('\n✅ Schema generation complete!');