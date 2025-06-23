// JSONファイルを直接インポート（import attributes付き）
import baseItemsData from '../../data/items.json' with { type: 'json' };
import monsterTemplatesData from '../../data/monsters.json' with { type: 'json' };
import skillsData from '../../data/skills.json' with { type: 'json' };
import starterEquipmentData from '../../data/starter-equipment.json' with { type: 'json' };
import classSkillsData from '../../data/class-skills.json' with { type: 'json' };

// データをまとめて返す
export const loadGameData = async () => {
  // importしたデータをそのまま返す
  return {
    baseItemsData,
    monsterTemplatesData,
    skillsData,
    starterEquipmentData,
    classSkillsData
  };
};