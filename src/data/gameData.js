import specialSkillsCsv from '../contents/game_data/rules_special_skills.csv?raw';
import itemsCsv from '../contents/game_data/rules_items.csv?raw';
import baseSkillsCsv from '../contents/game_data/base_skills.csv?raw';
import speciesOptionsCsv from '../contents/game_data/species_options.csv?raw';
import weaknessOptionsCsv from '../contents/game_data/weakness_options.csv?raw';
import specialSkillGroupsCsv from '../contents/game_data/special_skill_groups.csv?raw';
import speciesLabelsCsv from '../contents/game_data/species_labels.csv?raw';
import equipmentLabelsCsv from '../contents/game_data/equipment_labels.csv?raw';
import defaultCharacterCsv from '../contents/game_data/default_character.csv?raw';
import experiencePointsCsv from '../contents/game_data/experience_points.csv?raw';
import configCsv from '../contents/game_data/config.csv?raw';
import helpManual from '../contents/documents/help_manual.md?raw';
import { parseCsv } from '../i18n/loader.js';

const toBoolean = (value) => String(value).toLowerCase() === 'true';

const toNumber = (value) => {
  if (value === '' || value === undefined || value === null) {
    return 0;
  }
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const parseJsonValue = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const buildSpecialSkillData = () => {
  const { rows } = parseCsv(specialSkillsCsv);
  const specialSkillData = {};
  const specialSkillsRequiringNote = [];

  rows.forEach((row) => {
    const group = row.group || '';
    if (!specialSkillData[group]) {
      specialSkillData[group] = [];
    }

    const requiresNote = toBoolean(row.requires_note);
    specialSkillData[group].push({
      value: row.value,
      label: row.label,
      description: row.description,
    });

    if (requiresNote && !specialSkillsRequiringNote.includes(row.value)) {
      specialSkillsRequiringNote.push(row.value);
    }
  });

  return { specialSkillData, specialSkillsRequiringNote };
};

const buildItemData = () => {
  const { rows } = parseCsv(itemsCsv);
  const weaponOptions = [];
  const armorOptions = [];
  const weaponDamage = {};
  const equipmentWeights = { weapon: {}, armor: {} };
  const equipmentGroupLabelMap = {};

  rows.forEach((row) => {
    if (row.category === 'weapon') {
      equipmentGroupLabelMap[row.value] = row.label;
      weaponOptions.push({
        value: row.value,
        label: row.label,
        description: row.description || null,
      });
      weaponDamage[row.value] = row.damage || '';
      equipmentWeights.weapon[row.value] = toNumber(row.weight);
    }

    if (row.category === 'armor') {
      equipmentGroupLabelMap[row.value] = row.label;
      armorOptions.push({
        value: row.value,
        label: row.label,
        description: row.description || null,
      });
      equipmentWeights.armor[row.value] = toNumber(row.weight);
    }
  });

  return { weaponOptions, armorOptions, weaponDamage, equipmentWeights, equipmentGroupLabelMap };
};

const buildCommonData = () => {
  const baseSkillRows = parseCsv(baseSkillsCsv).rows;
  const speciesOptionRows = parseCsv(speciesOptionsCsv).rows;
  const weaknessOptionRows = parseCsv(weaknessOptionsCsv).rows;
  const specialSkillGroupRows = parseCsv(specialSkillGroupsCsv).rows;
  const speciesLabelRows = parseCsv(speciesLabelsCsv).rows;
  const equipmentLabelRows = parseCsv(equipmentLabelsCsv).rows;
  const defaultCharacterRows = parseCsv(defaultCharacterCsv).rows;
  const experiencePointRows = parseCsv(experiencePointsCsv).rows;
  const configRows = parseCsv(configCsv).rows;

  const baseSkills = baseSkillRows.map((row) => {
    const hasExperts = toBoolean(row.can_have_experts);
    const expertCount = Number(row.default_experts_count || 0) || (hasExperts ? 1 : 0);
    const experts = hasExperts ? Array.from({ length: expertCount }, () => ({ value: '' })) : [];

    return {
      id: row.key,
      name: row.label,
      checked: false,
      canHaveExperts: hasExperts,
      experts,
    };
  });

  const speciesOptions = speciesOptionRows.map((row) => ({ value: row.key, label: row.label, disabled: toBoolean(row.disabled) }));

  const weaknessAcquisitionOptions = weaknessOptionRows.map((row) => ({
    value: row.key,
    text: row.label,
    disabled: toBoolean(row.disabled),
  }));

  const specialSkillGroupOptions = specialSkillGroupRows.map((row) => ({ value: row.key, label: row.label }));

  const speciesLabelMap = speciesLabelRows.reduce((acc, row) => ({ ...acc, [row.key]: row.label }), {});

  const equipmentGroupLabelMap = equipmentLabelRows.reduce((acc, row) => ({ ...acc, [row.key]: row.label }), {});

  const defaultCharacterData = defaultCharacterRows.reduce((acc, row) => ({ ...acc, [row.key]: parseJsonValue(row.value) }), {});

  const experiencePointValues = experiencePointRows.reduce((acc, row) => ({ ...acc, [row.key]: toNumber(row.value) }), {});

  const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: toNumber(row.value) }), {});

  return {
    baseSkills,
    speciesOptions,
    weaknessAcquisitionOptions,
    specialSkillGroupOptions,
    speciesLabelMap,
    equipmentGroupLabelMap,
    defaultCharacterData,
    experiencePointValues,
    config,
  };
};

const { specialSkillData, specialSkillsRequiringNote } = buildSpecialSkillData();
const { weaponOptions, armorOptions, weaponDamage, equipmentWeights, equipmentGroupLabelMap: equipmentLabels } = buildItemData();
const {
  baseSkills,
  speciesOptions,
  weaknessAcquisitionOptions,
  specialSkillGroupOptions,
  speciesLabelMap,
  equipmentGroupLabelMap,
  defaultCharacterData,
  experiencePointValues,
  config,
} = buildCommonData();

export const AioniaGameData = {
  specialSkillData,
  baseSkills,
  specialSkillsRequiringNote,
  speciesOptions,
  weaponOptions,
  armorOptions,
  weaknessAcquisitionOptions,
  specialSkillGroupOptions,
  speciesLabelMap,
  equipmentGroupLabelMap: { ...equipmentLabels, ...equipmentGroupLabelMap },
  weaponDamage,
  equipmentWeights,
  defaultCharacterData,
  experiencePointValues,
  config,
  helpText: helpManual,
};
