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

<style scoped>
.gm-table-layout {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-body);
  box-shadow: inset 0 0 24px rgb(0 0 0 / 45%);
}

.gm-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 720px;
}

.gm-table__row-label {
  min-width: 200px;
  background: var(--color-panel-header);
  color: var(--color-text-normal);
  font-weight: 600;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.gm-table__sticky {
  position: sticky;
  left: 0;
  z-index: 2;
}

.gm-table__character-header {
  min-width: 240px;
  padding: 0;
  background: var(--color-panel-body);
}

.gm-character-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-normal);
  position: relative;
}

.gm-character-header__name {
  font-family: 'Shippori Mincho', serif;
  font-size: 1.1rem;
  color: var(--color-text-normal);
  flex: 1;
}

.gm-character-header__settings {
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-sub-header);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--color-text-normal);
}

.gm-character-menu {
  position: absolute;
  top: 58px;
  right: 16px;
  background: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  border-radius: 12px;
  box-shadow: 0 10px 26px rgb(0 0 0 / 65%);
  display: flex;
  flex-direction: column;
  min-width: 160px;
  z-index: 5;
}

.gm-character-menu__item {
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--color-text-normal);
  text-align: left;
  cursor: pointer;
}

.gm-character-menu__item:hover {
  background: var(--color-panel-sub-header);
}

.gm-character-menu__item--danger {
  color: var(--color-delete-text);
}

.gm-add-button {
  width: 48px;
  height: 48px;
  margin: 12px auto;
  border-radius: 50%;
  border: 1px dashed var(--color-border-normal);
  background: var(--color-panel-header);
  color: var(--color-text-normal);
  font-size: 1.5rem;
  cursor: pointer;
}

.gm-row:nth-child(odd) td {
  background: var(--color-panel-body);
}

.gm-row:nth-child(even) td {
  background: var(--color-panel-sub-header);
}

.gm-cell {
  padding: 16px;
  vertical-align: top;
  min-width: 220px;
}

.gm-cell--memo {
  min-width: 260px;
}

.gm-memo-textarea {
  width: 100%;
  min-height: 120px;
  border-radius: 10px;
  border: 1px solid var(--color-border-normal);
  background: var(--color-input-bg);
  color: var(--color-text-normal);
  padding: 12px;
  resize: vertical;
  font-family: 'Shippori Mincho', serif;
}

.gm-weakness-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gm-weakness-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gm-weakness-text {
  color: var(--color-text-normal);
}

.gm-weakness-tag {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--color-panel-sub-header);
  color: var(--color-text-muted);
}

.gm-weakness-empty {
  color: var(--color-text-muted);
}

.gm-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gm-tag {
  background: var(--color-panel-sub-header);
  padding: 4px 10px;
  border-radius: 10px;
  font-family: 'Fira Code', 'Shippori Mincho', monospace;
  font-size: 0.85rem;
  color: var(--color-text-normal);
}

.gm-empty {
  color: var(--color-text-muted);
}

.gm-skill-detail {
  display: flex;
  gap: 12px;
  align-items: center;
}

.gm-skill-detail-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.gm-skill-check {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-normal);
}

.gm-skill-check.is-checked {
  background: var(--color-accent-dark);
  border-color: var(--color-accent);
}

.gm-skill-expert {
  color: var(--color-text-muted);
}

.gm-weight {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 1.2rem;
}

.gm-weight__penalty.is-none {
  color: var(--color-text-muted);
}

.gm-weight__penalty.is-light {
  color: var(--color-load-light);
}

.gm-weight__penalty.is-heavy {
  color: var(--color-load-heavy);
}

.gm-toggle {
  background: var(--color-panel-sub-header);
  border: 1px solid var(--color-border-normal);
  border-radius: 8px;
  color: var(--color-text-normal);
  padding: 4px 12px;
  cursor: pointer;
}

.gm-toggle--action {
  background: var(--color-accent-middle);
}

.gm-table__add-column,
.gm-table__spacer {
  width: 120px;
  background: var(--color-panel-body);
}

.gm-table__spacer {
  border-left: 1px solid var(--color-border-normal);
}

.gm-table__add-column {
  text-align: center;
}

.gm-row.is-collapsed td {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .gm-table__row-label {
    min-width: 180px;
  }

  .gm-cell {
    min-width: 200px;
  }
}
</style>
