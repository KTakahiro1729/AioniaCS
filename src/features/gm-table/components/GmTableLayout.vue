<template>
  <div class="gm-table-layout">
    <table class="gm-table">
      <thead>
        <tr>
          <th class="gm-table__row-label gm-table__sticky">{{ gmMessages.headers.characterName }}</th>
          <th v-for="column in columns" :key="column.id" class="gm-table__character-header">
            <div class="gm-character-header">
              <span class="gm-character-header__name">
                {{ column.data.character.name || gmMessages.labels.unknownCharacter }}
              </span>
              <button
                type="button"
                class="gm-character-header__settings gm-character-menu-trigger"
                @click.stop="$emit('open-menu', column.id)"
                :aria-label="gmMessages.actions.openCharacterMenu(column.data.character.name || gmMessages.labels.unknownCharacter)"
              >
                ⚙️
              </button>
              <transition name="fade">
                <div v-if="activeMenuId === column.id" class="gm-character-menu" @click.stop>
                  <button type="button" class="gm-character-menu__item" @click="$emit('edit-character', column)">
                    {{ gmMessages.characterMenu.edit }}
                  </button>
                  <button type="button" class="gm-character-menu__item" @click="$emit('reload-character', column)">
                    {{ gmMessages.characterMenu.reload }}
                  </button>
                  <button
                    type="button"
                    class="gm-character-menu__item gm-character-menu__item--danger"
                    @click="$emit('delete-character', column)"
                  >
                    {{ gmMessages.characterMenu.remove }}
                  </button>
                </div>
              </transition>
            </div>
          </th>
          <th class="gm-table__add-column">
            <button type="button" class="gm-add-button" @click="$emit('add-character')">+</button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="gm-row gm-row--memo" :class="{ 'is-collapsed': !rowVisibility.memo }">
          <th class="gm-table__row-label gm-table__sticky">
            <button type="button" class="gm-toggle" @click="$emit('toggle-memo-row')">
              {{ rowVisibility.memo ? '▼' : '▶' }}
            </button>
            <span>{{ gmMessages.rows.memo }}</span>
          </th>
          <td v-for="column in columns" :key="column.id" class="gm-cell gm-cell--memo">
            <textarea
              class="gm-memo-textarea"
              :value="column.memo"
              :placeholder="gmMessages.placeholders.characterMemo"
              @input="$emit('set-character-memo', column.id, $event.target.value)"
            ></textarea>
          </td>
          <td class="gm-table__spacer"></td>
        </tr>
        <tr class="gm-row gm-row--weakness" :class="{ 'is-collapsed': !rowVisibility.weaknesses }">
          <th class="gm-table__row-label gm-table__sticky">
            <button type="button" class="gm-toggle" @click="$emit('toggle-weakness-row')">
              {{ rowVisibility.weaknesses ? '▼' : '▶' }}
            </button>
            <span>{{ gmMessages.rows.weakness }}</span>
          </th>
          <td v-for="column in columns" :key="column.id" class="gm-cell">
            <ul class="gm-weakness-list">
              <li v-for="(weakness, index) in getWeaknesses(column)" :key="index" class="gm-weakness-item">
                <span class="gm-weakness-text">{{ weakness.text }}</span>
                <span v-if="weakness.acquired" class="gm-weakness-tag">{{ weakness.acquired }}</span>
              </li>
              <li v-if="getWeaknesses(column).length === 0" class="gm-weakness-empty">
                {{ gmMessages.labels.noWeakness }}
              </li>
            </ul>
          </td>
          <td class="gm-table__spacer"></td>
        </tr>
        <tr v-if="!skillDetailExpanded" class="gm-row gm-row--skills">
          <th class="gm-table__row-label gm-table__sticky">
            <button type="button" class="gm-toggle gm-toggle--action" @click="$emit('toggle-skill-detail')">
              {{ gmMessages.rows.skillToggle.detail }}
            </button>
            <span>{{ gmMessages.rows.skills }}</span>
          </th>
          <td v-for="column in columns" :key="column.id" class="gm-cell">
            <div class="gm-tag-list">
              <code v-for="(skill, index) in getSkillSummary(column)" :key="index" class="gm-tag">{{ skill }}</code>
              <span v-if="getSkillSummary(column).length === 0" class="gm-empty">{{ gmMessages.labels.noSkill }}</span>
            </div>
          </td>
          <td class="gm-table__spacer"></td>
        </tr>
        <template v-else>
          <tr v-for="(skill, index) in baseSkills" :key="skill.id" class="gm-row gm-row--skill-detail">
            <th class="gm-table__row-label gm-table__sticky">
              <div class="gm-skill-detail-label">
                <span>{{ skill.name }}</span>
                <button
                  v-if="index === 0"
                  type="button"
                  class="gm-toggle gm-toggle--action"
                  @click="$emit('toggle-skill-detail')"
                >
                  {{ gmMessages.rows.skillToggle.summary }}
                </button>
              </div>
            </th>
            <td v-for="column in columns" :key="column.id" class="gm-cell gm-cell--skill-detail">
              <div class="gm-skill-detail">
                <span class="gm-skill-check" :class="{ 'is-checked': getSkillState(column, skill.id)?.checked }">
                  {{ getSkillState(column, skill.id)?.checked ? '✓' : '—' }}
                </span>
                <span class="gm-skill-expert" v-if="skill.canHaveExperts">
                  {{
                    (getSkillState(column, skill.id)?.experts || [])
                      .map((expert) => expert?.value?.trim())
                      .filter(Boolean)
                      .join('、') || gmMessages.labels.noExpert
                  }}
                </span>
              </div>
            </td>
            <td class="gm-table__spacer"></td>
          </tr>
        </template>
        <tr class="gm-row gm-row--special-skills">
          <th class="gm-table__row-label gm-table__sticky">{{ gmMessages.rows.specialSkills }}</th>
          <td v-for="column in columns" :key="column.id" class="gm-cell">
            <div class="gm-tag-list">
              <code
                v-for="(skill, index) in column.data.specialSkills.filter((s) => s.name)"
                :key="`${skill.name}-${index}`"
                class="gm-tag"
                :title="getSpecialSkillTooltip(skill)"
              >
                {{ skill.name }}
              </code>
              <span v-if="column.data.specialSkills.filter((s) => s.name).length === 0" class="gm-empty">
                {{ gmMessages.labels.noSpecialSkill }}
              </span>
            </div>
          </td>
          <td class="gm-table__spacer"></td>
        </tr>
        <tr class="gm-row gm-row--weight">
          <th class="gm-table__row-label gm-table__sticky">{{ gmMessages.rows.weight }}</th>
          <td v-for="column in columns" :key="column.id" class="gm-cell">
            <div class="gm-weight">
              <span class="gm-weight__value">{{ calculateWeight(column).total }}</span>
              <span class="gm-weight__separator">/</span>
              <span class="gm-weight__penalty" :class="`is-${calculateWeight(column).penalty}`">
                {{ weightPenaltyLabel(calculateWeight(column).penalty) }}
              </span>
            </div>
          </td>
          <td class="gm-table__spacer"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AioniaGameData } from '@/data/gameData.js';

const props = defineProps({
  columns: { type: Array, default: () => [] },
  gmMessages: { type: Object, required: true },
  rowVisibility: { type: Object, required: true },
  skillDetailExpanded: { type: Boolean, default: false },
  activeMenuId: { type: [String, Number, null], default: null },
});

defineEmits([
  'toggle-memo-row',
  'toggle-weakness-row',
  'toggle-skill-detail',
  'open-menu',
  'edit-character',
  'reload-character',
  'delete-character',
  'set-character-memo',
  'add-character',
]);

const baseSkills = computed(() =>
  AioniaGameData.baseSkills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    canHaveExperts: skill.canHaveExperts,
  })),
);

const specialSkillDescriptions = computed(() => {
  const map = new Map();
  Object.values(AioniaGameData.specialSkillData).forEach((group) => {
    group.forEach((item) => {
      map.set(item.value, item.description);
      map.set(item.label, item.description);
    });
  });
  return map;
});

function getWeaknesses(column) {
  const weaknesses = column.data?.character?.weaknesses || [];
  return weaknesses.filter((item) => item && item.text && item.text.trim() !== '');
}

function getSkillSummary(column) {
  const list = column.data?.skills || [];
  return list
    .filter((skill) => skill.checked)
    .map((skill) => {
      const experts = (skill.experts || []).map((expert) => expert?.value?.trim()).filter(Boolean);
      return experts.length > 0 ? `${skill.name}（${experts.join('、')}）` : skill.name;
    });
}

function getSkillState(column, skillId) {
  return (column.data?.skills || []).find((skill) => skill.id === skillId) || null;
}

function getSpecialSkillTooltip(skill) {
  const description =
    specialSkillDescriptions.value.get(skill.name) || specialSkillDescriptions.value.get(skill.value);
  if (skill.note) {
    return `${skill.name}\n${skill.note}`;
  }
  if (description) {
    return description;
  }
  return `${skill.name}\n説明`;
}

function calculateWeight(column) {
  const equipments = column.data?.equipments || {};
  const weaponWeights = AioniaGameData.equipmentWeights.weapon;
  const armorWeights = AioniaGameData.equipmentWeights.armor;
  const total =
    (weaponWeights[equipments.weapon1?.group] || 0) +
    (weaponWeights[equipments.weapon2?.group] || 0) +
    (armorWeights[equipments.armor?.group] || 0);
  let penalty = 'none';
  if (total >= 5) {
    penalty = 'heavy';
  } else if (total >= 3) {
    penalty = 'light';
  }
  return { total, penalty };
}

function weightPenaltyLabel(key) {
  const labels = {
    none: props.gmMessages.weight.penaltyNone,
    light: props.gmMessages.weight.penaltyLight,
    heavy: props.gmMessages.weight.penaltyHeavy,
  };
  return labels[key] || props.gmMessages.weight.penaltyNone;
}
</script>

<style scoped src="./GmTableLayout.css"></style>

