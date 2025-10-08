<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { AioniaGameData } from '@/data/gameData.js';

const props = defineProps({
  characters: {
    type: Array,
    default: () => [],
  },
  rowState: {
    type: Object,
    required: true,
  },
  baseSkills: {
    type: Array,
    required: true,
  },
  specialSkillDictionary: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  'import-files',
  'toggle-memo',
  'toggle-weaknesses',
  'toggle-skills-detail',
  'update-character-memo',
  'edit-character',
  'reload-character',
  'remove-character',
]);

const menuOpenFor = ref(null);
const fileInput = ref(null);

function triggerFileDialog() {
  fileInput.value?.click();
}

function handleFileChange(event) {
  const files = event.target.files;
  emit('import-files', files);
  event.target.value = '';
}

function toggleMenu(id) {
  menuOpenFor.value = menuOpenFor.value === id ? null : id;
}

function closeMenu() {
  menuOpenFor.value = null;
}

function handleMenuAction(action, character) {
  closeMenu();
  emit(action, character);
}

function handleDocumentClick(event) {
  if (!event.target.closest) return;
  const menuRoot = event.target.closest('.gm-table__header-cell');
  if (!menuRoot) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function getCharacterName(character) {
  return character?.data?.character?.name || '名無しの冒険者';
}

function handleMemoInput(id, event) {
  emit('update-character-memo', { id, value: event.target.value });
}

function getWeaknesses(character) {
  return (character?.data?.character?.weaknesses || []).filter((weakness) => weakness?.text);
}

function getSkillSummary(character) {
  const skills = character?.data?.skills || [];
  return skills.filter((skill) => skill.checked).map((skill) => {
    const experts = Array.isArray(skill.experts)
      ? skill.experts.filter((expert) => expert.value).map((expert) => expert.value)
      : [];
    return experts.length > 0 ? `${skill.name}（${experts.join(' / ')}）` : skill.name;
  });
}

function getDetailedSkill(character, skillId) {
  const skills = character?.data?.skills || [];
  return skills.find((skill) => skill.id === skillId);
}

function getSkillExperts(character, skillId) {
  const skill = getDetailedSkill(character, skillId);
  if (!skill || !Array.isArray(skill.experts)) {
    return [];
  }
  return skill.experts.filter((expert) => expert.value);
}

function getSpecialSkills(character) {
  return (character?.data?.specialSkills || []).filter((skill) => skill.name);
}

function buildSpecialSkillTooltip(label) {
  const dictionary = resolveDictionary(props.specialSkillDictionary);
  const description = dictionary.get(label) || `${label}\n説明`;
  return description;
}

function resolveDictionary(value) {
  if (value instanceof Map) {
    return value;
  }
  if (value && typeof value.entries === 'function') {
    return new Map(value.entries());
  }
  if (value && typeof value === 'object') {
    return new Map(Object.entries(value));
  }
  return new Map();
}

function getWeightInfo(character) {
  const equipments = character?.data?.equipments || {};
  const weaponWeights = AioniaGameData.equipmentWeights.weapon;
  const armorWeights = AioniaGameData.equipmentWeights.armor;
  const weapon1Weight = weaponWeights[equipments.weapon1?.group] || 0;
  const weapon2Weight = weaponWeights[equipments.weapon2?.group] || 0;
  const armorWeight = armorWeights[equipments.armor?.group] || 0;
  const total = weapon1Weight + weapon2Weight + armorWeight;
  let status = 'なし';
  let tone = 'none';
  if (total >= 6) {
    status = '重度ペナルティ';
    tone = 'heavy';
  } else if (total >= 3) {
    status = '軽度ペナルティ';
    tone = 'light';
  }
  return { total, status, tone };
}

const tableClasses = computed(() => ({
  'gm-table__body--weakness-open': props.rowState.weaknessesExpanded,
}));
</script>

<template>
  <div class="gm-table">
    <div class="gm-table__toolbar">
      <span class="gm-table__title">GMコントロールテーブル</span>
      <button type="button" class="gm-table__add-button" @click="triggerFileDialog">＋</button>
      <input ref="fileInput" class="gm-table__file-input" type="file" accept=".json,.zip" multiple @change="handleFileChange" />
    </div>
    <div class="gm-table__scroll">
      <table class="gm-table__table">
        <thead>
          <tr>
            <th class="gm-table__sticky-header gm-table__header-label">項目</th>
            <th v-for="character in characters" :key="character.id" class="gm-table__header-cell">
              <div class="gm-table__character-header">
                <span class="gm-table__character-name">{{ getCharacterName(character) }}</span>
                <button type="button" class="gm-table__character-menu" @click.stop="toggleMenu(character.id)">⚙️</button>
                <div v-if="menuOpenFor === character.id" class="gm-table__menu">
                  <button type="button" class="gm-table__menu-item" @click="handleMenuAction('edit-character', character)">編集</button>
                  <button type="button" class="gm-table__menu-item" @click="handleMenuAction('reload-character', character)">再読込</button>
                  <button
                    type="button"
                    class="gm-table__menu-item gm-table__menu-item--danger"
                    @click="handleMenuAction('remove-character', character)"
                  >
                    削除
                  </button>
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody :class="tableClasses">
          <tr class="gm-table__row">
            <th class="gm-table__sticky-header">
              <div class="gm-table__row-label">
                <span>キャラクターメモ</span>
                <button type="button" class="gm-table__toggle" @click="emit('toggle-memo')">{{ rowState.memoVisible ? '▼' : '▶' }}</button>
              </div>
            </th>
            <td v-for="character in characters" :key="`memo-${character.id}`" class="gm-table__cell">
              <textarea
                v-if="rowState.memoVisible"
                class="gm-table__memo"
                :value="character.memo"
                placeholder="メモを入力"
                @input="handleMemoInput(character.id, $event)"
              />
            </td>
          </tr>
          <tr class="gm-table__row gm-table__row--weakness">
            <th class="gm-table__sticky-header">
              <div class="gm-table__row-label">
                <span>弱点</span>
                <button type="button" class="gm-table__toggle" @click="emit('toggle-weaknesses')">
                  {{ rowState.weaknessesExpanded ? '▼' : '▶' }}
                </button>
              </div>
            </th>
            <td v-for="character in characters" :key="`weakness-${character.id}`" class="gm-table__cell">
              <ul class="gm-table__weaknesses" :class="{ 'gm-table__weaknesses--collapsed': !rowState.weaknessesExpanded }">
                <li v-for="(weakness, index) in getWeaknesses(character)" :key="`${character.id}-weakness-${index}`">
                  <span class="gm-table__weakness-text">{{ weakness.text }}</span>
                  <span v-if="weakness.acquired" class="gm-table__weakness-meta">({{ weakness.acquired }})</span>
                </li>
                <li v-if="getWeaknesses(character).length === 0" class="gm-table__weakness-empty">弱点なし</li>
              </ul>
            </td>
          </tr>
          <tr v-if="!rowState.skillsDetailed" class="gm-table__row">
            <th class="gm-table__sticky-header">
              <div class="gm-table__row-label">
                <span>技能</span>
                <button type="button" class="gm-table__detail" @click="emit('toggle-skills-detail')">詳細表示に切り替え</button>
              </div>
            </th>
            <td v-for="character in characters" :key="`skill-summary-${character.id}`" class="gm-table__cell">
              <div class="gm-table__skill-tags">
                <code v-for="(skill, index) in getSkillSummary(character)" :key="`${character.id}-skill-${index}`" class="gm-table__tag">{{ skill }}</code>
                <span v-if="getSkillSummary(character).length === 0" class="gm-table__empty">習得なし</span>
              </div>
            </td>
          </tr>
          <template v-else>
            <tr v-for="skill in baseSkills" :key="skill.id" class="gm-table__row">
              <th class="gm-table__sticky-header">
                <div class="gm-table__row-label">
                  <span>{{ skill.name }}</span>
                  <button type="button" class="gm-table__detail gm-table__detail--collapse" @click="emit('toggle-skills-detail')">一覧へ戻る</button>
                </div>
              </th>
              <td v-for="character in characters" :key="`skill-${character.id}-${skill.id}`" class="gm-table__cell">
                <div class="gm-table__skill-detail">
                  <span class="gm-table__skill-check" :class="{ 'gm-table__skill-check--active': getDetailedSkill(character, skill.id)?.checked }">
                    {{ getDetailedSkill(character, skill.id)?.checked ? '✔' : '✖' }}
                  </span>
                  <div class="gm-table__skill-experts">
                    <span
                      v-for="(expert, expertIndex) in getSkillExperts(character, skill.id)"
                      :key="`${character.id}-${skill.id}-expert-${expertIndex}`"
                      class="gm-table__expert"
                    >
                      {{ expert.value }}
                    </span>
                    <span v-if="!(getDetailedSkill(character, skill.id)?.checked)" class="gm-table__empty">未習得</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr class="gm-table__row">
            <th class="gm-table__sticky-header">
              <span class="gm-table__row-label">特技</span>
            </th>
            <td v-for="character in characters" :key="`special-${character.id}`" class="gm-table__cell">
              <div class="gm-table__skill-tags">
                <code
                  v-for="(skill, index) in getSpecialSkills(character)"
                  :key="`${character.id}-special-${index}`"
                  class="gm-table__tag"
                  :title="buildSpecialSkillTooltip(skill.name)"
                >
                  {{ skill.name }}
                </code>
                <span v-if="getSpecialSkills(character).length === 0" class="gm-table__empty">習得なし</span>
              </div>
            </td>
          </tr>
          <tr class="gm-table__row">
            <th class="gm-table__sticky-header">
              <span class="gm-table__row-label">荷重</span>
            </th>
            <td v-for="character in characters" :key="`weight-${character.id}`" class="gm-table__cell">
              <div class="gm-table__weight" :class="`gm-table__weight--${getWeightInfo(character).tone}`">
                <span class="gm-table__weight-value">{{ getWeightInfo(character).total }} / 10</span>
                <span class="gm-table__weight-status">{{ getWeightInfo(character).status }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.gm-table {
  background: radial-gradient(circle at top left, rgba(68, 54, 105, 0.45), rgba(18, 17, 26, 0.85));
  border-radius: 18px;
  padding: 1.5rem;
  color: #f1edff;
  border: 1px solid rgba(110, 93, 152, 0.3);
  position: relative;
}

.gm-table__toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.gm-table__title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.gm-table__add-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(199, 181, 255, 0.6);
  background: rgba(35, 34, 48, 0.8);
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.gm-table__add-button:hover {
  transform: scale(1.05);
  background: rgba(74, 60, 112, 0.8);
}

.gm-table__file-input {
  display: none;
}

.gm-table__scroll {
  overflow-x: auto;
}

.gm-table__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 720px;
}

.gm-table__header-label {
  min-width: 160px;
}

.gm-table__sticky-header {
  position: sticky;
  left: 0;
  background: rgba(27, 26, 38, 0.95);
  backdrop-filter: blur(4px);
  z-index: 2;
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-right: 1px solid rgba(110, 93, 152, 0.2);
}

.gm-table__header-cell {
  position: relative;
  background: rgba(39, 37, 55, 0.85);
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid rgba(110, 93, 152, 0.2);
}

.gm-table__character-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gm-table__character-name {
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
}

.gm-table__character-menu {
  background: rgba(54, 47, 78, 0.8);
  border: 1px solid rgba(199, 181, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: inherit;
}

.gm-table__menu {
  position: absolute;
  top: 48px;
  right: 0;
  background: rgba(24, 22, 34, 0.95);
  border: 1px solid rgba(110, 93, 152, 0.4);
  border-radius: 12px;
  padding: 0.5rem;
  display: grid;
  gap: 0.25rem;
  z-index: 5;
  min-width: 160px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

.gm-table__menu-item {
  background: transparent;
  border: none;
  color: inherit;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.gm-table__menu-item:hover {
  background: rgba(87, 72, 122, 0.5);
}

.gm-table__menu-item--danger {
  color: #ff9f9f;
}

.gm-table__row {
  background: rgba(19, 18, 28, 0.72);
}

.gm-table__cell {
  padding: 0.75rem;
  vertical-align: top;
  border-bottom: 1px solid rgba(110, 93, 152, 0.15);
}

.gm-table__row-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gm-table__toggle,
.gm-table__detail {
  background: rgba(45, 41, 63, 0.9);
  border: 1px solid rgba(199, 181, 255, 0.3);
  border-radius: 999px;
  padding: 0.15rem 0.75rem;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.gm-table__detail--collapse {
  font-size: 0.75rem;
}

.gm-table__memo {
  width: 100%;
  min-height: 120px;
  background: rgba(17, 16, 24, 0.85);
  border: 1px solid rgba(92, 80, 122, 0.4);
  border-radius: 12px;
  color: inherit;
  padding: 0.75rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.4;
}

.gm-table__memo:focus {
  outline: none;
  border-color: rgba(199, 181, 255, 0.7);
}

.gm-table__weaknesses {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  max-height: 360px;
  overflow: hidden;
}

.gm-table__weaknesses--collapsed {
  max-height: 48px;
}

.gm-table__weakness-text {
  font-weight: 500;
}

.gm-table__weakness-meta {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: rgba(209, 198, 242, 0.75);
}

.gm-table__weakness-empty {
  color: rgba(209, 198, 242, 0.5);
}

.gm-table__skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.gm-table__tag {
  background: rgba(52, 45, 74, 0.8);
  border: 1px solid rgba(199, 181, 255, 0.35);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
}

.gm-table__empty {
  color: rgba(209, 198, 242, 0.45);
}

.gm-table__skill-detail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gm-table__skill-check {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid rgba(166, 150, 214, 0.45);
  background: rgba(36, 32, 49, 0.8);
  color: rgba(193, 183, 231, 0.6);
}

.gm-table__skill-check--active {
  color: #b8f1c3;
  border-color: rgba(152, 220, 178, 0.7);
  background: rgba(49, 70, 60, 0.6);
}

.gm-table__skill-experts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.gm-table__expert {
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  background: rgba(69, 56, 101, 0.75);
  border: 1px solid rgba(199, 181, 255, 0.25);
}

.gm-table__weight {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(32, 29, 45, 0.8);
  border: 1px solid rgba(110, 93, 152, 0.25);
}

.gm-table__weight--none {
  background: rgba(32, 29, 45, 0.8);
}

.gm-table__weight--light {
  background: rgba(74, 60, 112, 0.75);
  border-color: rgba(199, 181, 255, 0.35);
}

.gm-table__weight--heavy {
  background: rgba(124, 56, 74, 0.75);
  border-color: rgba(255, 162, 162, 0.45);
}

.gm-table__weight-value {
  font-weight: 600;
  font-size: 1rem;
}

.gm-table__weight-status {
  font-size: 0.9rem;
  letter-spacing: 0.04em;
}

@media (max-width: 768px) {
  .gm-table {
    padding: 1rem;
  }

  .gm-table__table {
    min-width: 600px;
  }
}
</style>
