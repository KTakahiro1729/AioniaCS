<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DataManager } from '@/features/character-sheet/services/dataManager.js';
import { AioniaGameData } from '@/data/gameData.js';
import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';
import { messages } from '@/locales/ja.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import SessionMemoWindow from '../components/SessionMemoWindow.vue';
import { useGmTableStore } from '../stores/useGmTableStore.js';
import { downloadGmSession, readGmSessionFile } from '../services/gmSessionManager.js';

const router = useRouter();
const dataManager = new DataManager(AioniaGameData);
const gmStore = useGmTableStore();
const characterStore = useCharacterStore();
const { showToast } = useNotifications();

const gmMessages = messages.gmTable;

const characterFileInput = ref(null);
const reloadFileInput = ref(null);
const sessionFileInput = ref(null);

const pendingReloadId = ref(null);
const activeMenuId = ref(null);

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

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

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
  const description = specialSkillDescriptions.value.get(skill.name) || specialSkillDescriptions.value.get(skill.value);
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
    none: gmMessages.weight.penaltyNone,
    light: gmMessages.weight.penaltyLight,
    heavy: gmMessages.weight.penaltyHeavy,
  };
  return labels[key] || gmMessages.weight.penaltyNone;
}

function handleDocumentClick(event) {
  if (!event.target.closest('.gm-character-menu') && !event.target.closest('.gm-character-menu-trigger')) {
    activeMenuId.value = null;
  }
}

onMounted(() => {
  document.title = gmMessages.pageTitle;
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function triggerAddCharacter() {
  characterFileInput.value?.click();
}

function triggerSessionLoad() {
  sessionFileInput.value?.click();
}

async function parseCharacterFile(file) {
  try {
    const lower = file.name.toLowerCase();
    let raw;
    if (lower.endsWith('.zip')) {
      const buffer = await file.arrayBuffer();
      raw = await deserializeCharacterPayload(buffer);
    } else {
      const text = await file.text();
      raw = await deserializeCharacterPayload(text);
    }
    return dataManager.parseLoadedData(raw);
  } catch (error) {
    console.error('Failed to parse character file', error);
    throw new Error(gmMessages.errors.characterLoad);
  }
}

async function handleCharacterFileChange(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';
  if (!file) return;
  try {
    const parsed = await parseCharacterFile(file);
    gmStore.addCharacter({ parsedData: parsed, sourceName: file.name });
    showToast({ type: 'success', title: gmMessages.toasts.added.title, message: gmMessages.toasts.added.message(file.name) });
  } catch (error) {
    showToast({ type: 'error', title: gmMessages.toasts.loadError.title, message: error.message });
  }
}

async function handleReloadFileChange(event) {
  const file = event.target.files?.[0] || null;
  const columnId = pendingReloadId.value;
  pendingReloadId.value = null;
  event.target.value = '';
  if (!file || !columnId) return;
  try {
    const parsed = await parseCharacterFile(file);
    gmStore.replaceCharacter(columnId, { parsedData: parsed, sourceName: file.name });
    showToast({ type: 'success', title: gmMessages.toasts.reloaded.title, message: gmMessages.toasts.reloaded.message(file.name) });
  } catch (error) {
    showToast({ type: 'error', title: gmMessages.toasts.loadError.title, message: error.message });
  }
}

async function handleSessionFileChange(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';
  if (!file) return;
  try {
    const payload = await readGmSessionFile(file);
    gmStore.loadFromSession(payload);
    showToast({ type: 'success', title: gmMessages.toasts.sessionLoaded.title, message: gmMessages.toasts.sessionLoaded.message });
  } catch (error) {
    showToast({ type: 'error', title: gmMessages.toasts.sessionLoadError.title, message: error.message });
  }
}

function openMenu(columnId) {
  activeMenuId.value = activeMenuId.value === columnId ? null : columnId;
}

function editCharacter(column) {
  const data = column.data;
  Object.assign(characterStore.character, clone(data.character));
  characterStore.skills.splice(0, characterStore.skills.length, ...clone(data.skills));
  characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...clone(data.specialSkills));
  Object.assign(characterStore.equipments, clone(data.equipments));
  characterStore.histories.splice(0, characterStore.histories.length, ...clone(data.histories));
  activeMenuId.value = null;
  router.push({ name: 'character-sheet' });
}

function reloadCharacter(column) {
  pendingReloadId.value = column.id;
  reloadFileInput.value?.click();
}

function deleteCharacter(column) {
  const name = column.data?.character?.name || gmMessages.labels.unknownCharacter;
  const confirmed = typeof window === 'undefined' ? true : window.confirm(gmMessages.confirm.delete(name));
  if (confirmed) {
    gmStore.removeCharacter(column.id);
    showToast({ type: 'info', title: gmMessages.toasts.removed.title, message: gmMessages.toasts.removed.message });
  }
  activeMenuId.value = null;
}

function toggleMemoRow() {
  gmStore.toggleRow('memo');
}

function toggleWeaknessRow() {
  gmStore.toggleRow('weaknesses');
}

function toggleSkillDetail() {
  gmStore.setSkillDetailExpanded(!gmStore.skillDetailExpanded);
}

function saveSession() {
  const payload = gmStore.toSessionPayload();
  downloadGmSession(payload, gmMessages.session.defaultFileName);
  showToast({ type: 'success', title: gmMessages.toasts.sessionSaved.title, message: gmMessages.toasts.sessionSaved.message });
}

const memoWindowPosition = computed(() => ({ top: gmStore.sessionWindow.top, left: gmStore.sessionWindow.left }));
const memoWindowSize = computed(() => ({ width: gmStore.sessionWindow.width, height: gmStore.sessionWindow.height }));

function updateMemoPosition(position) {
  gmStore.updateSessionWindow(position);
}

function updateMemoSize(size) {
  gmStore.updateSessionWindow(size);
}

function toggleMemoWindow() {
  gmStore.updateSessionWindow({ minimized: !gmStore.sessionWindow.minimized });
}

function goToSheet() {
  router.push({ name: 'character-sheet' });
}
</script>

<template>
  <div class="gm-table-page">
    <header class="gm-table-page__header">
      <div class="gm-table-page__title-block">
        <h1 class="gm-table-page__title">{{ gmMessages.pageTitle }}</h1>
        <p class="gm-table-page__subtitle">{{ gmMessages.pageSubtitle }}</p>
      </div>
      <div class="gm-table-page__actions">
        <button type="button" class="gm-table-button" @click="goToSheet">{{ gmMessages.actions.backToSheet }}</button>
        <button type="button" class="gm-table-button" @click="saveSession" :disabled="!gmStore.hasCharacters">
          {{ gmMessages.actions.saveSession }}
        </button>
        <button type="button" class="gm-table-button" @click="triggerSessionLoad">
          {{ gmMessages.actions.loadSession }}
        </button>
      </div>
    </header>
    <div class="gm-table-container">
      <table class="gm-table">
        <thead>
          <tr>
            <th class="gm-table__row-label gm-table__sticky">{{ gmMessages.headers.characterName }}</th>
            <th v-for="column in gmStore.columns" :key="column.id" class="gm-table__character-header">
              <div class="gm-character-header">
                <span class="gm-character-header__name">{{ column.data.character.name || gmMessages.labels.unknownCharacter }}</span>
                <button
                  type="button"
                  class="gm-character-header__settings gm-character-menu-trigger"
                  @click.stop="openMenu(column.id)"
                  :aria-label="gmMessages.actions.openCharacterMenu(column.data.character.name || gmMessages.labels.unknownCharacter)"
                >
                  ⚙️
                </button>
                <transition name="fade">
                  <div v-if="activeMenuId === column.id" class="gm-character-menu" @click.stop>
                    <button type="button" class="gm-character-menu__item" @click="editCharacter(column)">
                      {{ gmMessages.characterMenu.edit }}
                    </button>
                    <button type="button" class="gm-character-menu__item" @click="reloadCharacter(column)">
                      {{ gmMessages.characterMenu.reload }}
                    </button>
                    <button type="button" class="gm-character-menu__item gm-character-menu__item--danger" @click="deleteCharacter(column)">
                      {{ gmMessages.characterMenu.remove }}
                    </button>
                  </div>
                </transition>
              </div>
            </th>
            <th class="gm-table__add-column">
              <button type="button" class="gm-add-button" @click="triggerAddCharacter">+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="gm-row gm-row--memo" :class="{ 'is-collapsed': !gmStore.rowVisibility.memo }">
            <th class="gm-table__row-label gm-table__sticky">
              <button type="button" class="gm-toggle" @click="toggleMemoRow">
                {{ gmStore.rowVisibility.memo ? '▼' : '▶' }}
              </button>
              <span>{{ gmMessages.rows.memo }}</span>
            </th>
            <td v-for="column in gmStore.columns" :key="column.id" class="gm-cell gm-cell--memo">
              <textarea
                class="gm-memo-textarea"
                :value="column.memo"
                :placeholder="gmMessages.placeholders.characterMemo"
                @input="gmStore.setCharacterMemo(column.id, $event.target.value)"
              ></textarea>
            </td>
            <td class="gm-table__spacer"></td>
          </tr>
          <tr class="gm-row gm-row--weakness" :class="{ 'is-collapsed': !gmStore.rowVisibility.weaknesses }">
            <th class="gm-table__row-label gm-table__sticky">
              <button type="button" class="gm-toggle" @click="toggleWeaknessRow">
                {{ gmStore.rowVisibility.weaknesses ? '▼' : '▶' }}
              </button>
              <span>{{ gmMessages.rows.weakness }}</span>
            </th>
            <td v-for="column in gmStore.columns" :key="column.id" class="gm-cell">
              <ul class="gm-weakness-list">
                <li v-for="(weakness, index) in getWeaknesses(column)" :key="index" class="gm-weakness-item">
                  <span class="gm-weakness-text">{{ weakness.text }}</span>
                  <span v-if="weakness.acquired" class="gm-weakness-tag">{{ weakness.acquired }}</span>
                </li>
                <li v-if="getWeaknesses(column).length === 0" class="gm-weakness-empty">{{ gmMessages.labels.noWeakness }}</li>
              </ul>
            </td>
            <td class="gm-table__spacer"></td>
          </tr>
          <tr v-if="!gmStore.skillDetailExpanded" class="gm-row gm-row--skills">
            <th class="gm-table__row-label gm-table__sticky">
              <button type="button" class="gm-toggle gm-toggle--action" @click="toggleSkillDetail">
                {{ gmMessages.rows.skillToggle.detail }}
              </button>
              <span>{{ gmMessages.rows.skills }}</span>
            </th>
            <td v-for="column in gmStore.columns" :key="column.id" class="gm-cell">
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
                    @click="toggleSkillDetail"
                  >
                    {{ gmMessages.rows.skillToggle.summary }}
                  </button>
                </div>
              </th>
              <td v-for="column in gmStore.columns" :key="column.id" class="gm-cell gm-cell--skill-detail">
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
            <td v-for="column in gmStore.columns" :key="column.id" class="gm-cell">
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
            <td v-for="column in gmStore.columns" :key="column.id" class="gm-cell">
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
      <input ref="characterFileInput" type="file" class="gm-file-input" accept=".json,.zip" @change="handleCharacterFileChange" />
      <input ref="reloadFileInput" type="file" class="gm-file-input" accept=".json,.zip" @change="handleReloadFileChange" />
      <input ref="sessionFileInput" type="file" class="gm-file-input" accept=".json" @change="handleSessionFileChange" />
    </div>
    <SessionMemoWindow
      :memo="gmStore.sessionMemo"
      :position="memoWindowPosition"
      :size="memoWindowSize"
      :minimized="gmStore.sessionWindow.minimized"
      :title="gmMessages.session.memoTitle"
      @update:memo="gmStore.updateSessionMemo"
      @update:position="updateMemoPosition"
      @update:size="updateMemoSize"
      @toggle-minimize="toggleMemoWindow"
    />
  </div>
</template>

<style scoped>
.gm-table-page {
  min-height: 100vh;
  padding: 96px 24px 48px;
  background: radial-gradient(circle at top, rgba(40, 32, 60, 0.85), rgba(18, 14, 26, 0.98));
  color: var(--color-text-normal);
}

.gm-table-page__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 32px;
}

.gm-table-page__title {
  font-family: 'Cinzel Decorative', 'Shippori Mincho', serif;
  font-size: clamp(28px, 5vw, 42px);
  margin: 0;
  color: var(--color-accent-light);
}

.gm-table-page__subtitle {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
}

.gm-table-page__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.gm-table-button {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--color-border-normal);
  background: rgba(28, 23, 40, 0.85);
  color: var(--color-text-inverse);
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgb(0 0 0 / 45%);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.gm-table-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.gm-table-button:not(:disabled):hover {
  transform: translateY(-2px);
  background: var(--color-accent);
}

.gm-table-container {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(20, 16, 28, 0.85);
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
  background: rgba(32, 24, 44, 0.95);
  color: var(--color-text-inverse);
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
  background: rgba(17, 14, 24, 0.8);
}

.gm-character-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

.gm-character-header__name {
  font-family: 'Shippori Mincho', serif;
  font-size: 1.1rem;
  color: var(--color-text-normal);
  flex: 1;
}

.gm-character-header__settings {
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.gm-character-menu {
  position: absolute;
  top: 58px;
  right: 16px;
  background: rgba(28, 24, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  background: rgba(255, 255, 255, 0.08);
}

.gm-character-menu__item--danger {
  color: #ff8585;
}

.gm-add-button {
  width: 48px;
  height: 48px;
  margin: 12px auto;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.4);
  background: transparent;
  color: var(--color-text-inverse);
  font-size: 1.5rem;
  cursor: pointer;
}

.gm-row:nth-child(odd) td {
  background: rgba(18, 16, 28, 0.6);
}

.gm-row:nth-child(even) td {
  background: rgba(24, 20, 32, 0.75);
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 10, 18, 0.75);
  color: var(--color-text-normal);
  padding: 12px;
  resize: vertical;
  font-family: 'Shippori Mincho', serif;
}

.gm-weakness-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gm-weakness-item {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.gm-weakness-tag {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.75rem;
}

.gm-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gm-tag {
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 10px;
  font-family: 'Fira Code', 'Shippori Mincho', monospace;
  font-size: 0.85rem;
  color: var(--color-text-inverse);
}

.gm-empty {
  color: rgba(255, 255, 255, 0.4);
}

.gm-skill-detail {
  display: flex;
  gap: 12px;
  align-items: center;
}

.gm-skill-check {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.gm-skill-check.is-checked {
  background: rgba(92, 200, 150, 0.25);
  border-color: rgba(92, 200, 150, 0.6);
}

.gm-skill-expert {
  color: rgba(255, 255, 255, 0.8);
}

.gm-weight {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 1.2rem;
}

.gm-weight__penalty.is-none {
  color: rgba(255, 255, 255, 0.65);
}

.gm-weight__penalty.is-light {
  color: #ffd166;
}

.gm-weight__penalty.is-heavy {
  color: #ff6b6b;
}

.gm-toggle {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--color-text-inverse);
  padding: 4px 12px;
  cursor: pointer;
}

.gm-toggle--action {
  background: rgba(95, 68, 140, 0.4);
}

.gm-table__add-column,
.gm-table__spacer {
  width: 120px;
  background: rgba(17, 14, 24, 0.8);
}

.gm-table__spacer {
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.gm-table__add-column {
  text-align: center;
}

.gm-file-input {
  display: none;
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
  .gm-table-page {
    padding: 96px 12px 48px;
  }

  .gm-table__row-label {
    min-width: 180px;
  }

  .gm-cell {
    min-width: 200px;
  }
}
</style>
