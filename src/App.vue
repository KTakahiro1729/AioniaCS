<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import { useGoogleDrive } from './composables/useGoogleDrive.js';
import { useHelp } from './composables/useHelp.js';
import { useDataExport } from './composables/useDataExport.js';
import { useKeyboardHandling } from './composables/useKeyboardHandling.js';
import { base64ToArrayBuffer } from './libs/sabalessshare/crypto.js';
import { receiveSharedData } from './libs/sabalessshare/index.js';
import { receiveDynamicData } from './libs/sabalessshare/dynamic.js';
import { parseShareUrl } from './libs/sabalessshare/url.js';
import { DriveStorageAdapter } from './services/driveStorageAdapter.js';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import CharacterSheetLayout from './layouts/CharacterSheetLayout.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
import NotificationContainer from './components/notifications/NotificationContainer.vue';
import ShareOptions from './components/notifications/ShareOptions.vue';
import { useShare } from './composables/useShare.js';
import CharacterHub from './components/ui/CharacterHub.vue';
import { useNotifications } from './composables/useNotifications.js';
// --- Template Refs ---
const mainFooter = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();

const {
  dataManager,
  outputButtonText,
  saveData,
  handleFileUpload,
  outputToCocofolia,
} = useDataExport(mainFooter);

const { generateShare, copyLink, isLongData } = useShare(dataManager);

const {
  canSignInToGoogle,
  handleSignInClick,
  handleSignOutClick,
  promptForDriveFolder,
  handleSaveToDriveClick,
} = useGoogleDrive(dataManager);

const {
  helpState,
  isHelpVisible,
  handleHelpIconMouseOver,
  handleHelpIconMouseLeave,
  handleHelpIconClick,
  closeHelpPanel,
} = useHelp(helpPanelRef, mainFooter);

const { showModal, showToast } = useNotifications();

const isHubVisible = ref(false);

function openHub() {
  isHubVisible.value = true;
}

function closeHub() {
  isHubVisible.value = false;
}

async function loadCharacterById(id, name) {
  showToast({ type: 'info', title: 'Google Drive', message: `Loading ${name}...` });
  try {
    const parsedData = await dataManager.loadDataFromDrive(id);
    if (parsedData) {
      Object.assign(characterStore.character, parsedData.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
      Object.assign(characterStore.equipments, parsedData.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
      uiStore.currentDriveFileId = id;
      uiStore.currentDriveFileName = name;
      showToast({ type: 'success', title: 'Loaded', message: `${name} from Drive` });
    }
  } catch (err) {
    showToast({ type: 'error', title: 'Load error', message: err.message || 'Unknown error' });
  }
}

async function handleShare() {
  window.__driveSignIn = handleSignInClick;
  const result = await showModal({
    title: '共有',
    component: ShareOptions,
    buttons: [
      { label: '生成', value: 'generate', variant: 'primary' },
      { label: 'キャンセル', value: 'cancel', variant: 'secondary' },
    ],
  });
  if (result.value === 'generate' && result.component) {
    const opts = {
      type: result.component.type.value,
      includeFull: result.component.includeFull.value,
      password: result.component.password.value || '',
      expiresInDays: Number(result.component.expires.value) || 0,
    };
    if ((opts.type === 'dynamic' || opts.includeFull) && !uiStore.isSignedIn) {
      showToast({ type: 'error', title: 'Drive', message: 'サインインしてください' });
      return;
    }
    try {
      const link = await generateShare(opts);
      await copyLink(link);
    } catch (err) {
      showToast({ type: 'error', title: '共有リンク生成失敗', message: err.message });
    }
  }
  delete window.__driveSignIn;
}


// --- Computed Properties (formerly `computed`) ---

const maxExperiencePoints = computed(() => characterStore.maxExperiencePoints);
const currentExperiencePoints = computed(() => characterStore.currentExperiencePoints);
const currentWeight = computed(() => characterStore.currentWeight);
const experienceStatusClass = computed(() => uiStore.experienceStatusClass);



// --- Watchers (formerly `watch`) ---


watch(() => characterStore.character.initialScar, (newVal) => {
  if (characterStore.character.linkCurrentToInitialScar) {
    characterStore.character.currentScar = newVal;
  }
});

watch(() => characterStore.character.linkCurrentToInitialScar, (isLinked) => {
  if (isLinked) {
    characterStore.character.currentScar = characterStore.character.initialScar;
  }
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  const params = parseShareUrl(window.location);
  if (!params) return;
  try {
    let buffer;
    if (params.mode === 'dynamic') {
      const adapter = new DriveStorageAdapter(dataManager.googleDriveManager);
      buffer = await receiveDynamicData({
        location: window.location,
        adapter,
        passwordPromptHandler: async () =>
          Promise.resolve(window.prompt('共有データのパスワードを入力してください') || null),
      });
    } else {
      buffer = await receiveSharedData({
        location: window.location,
        downloadHandler: async (id) => {
          const text = await dataManager.googleDriveManager.loadFileContent(id);
          if (!text) throw new Error('no data');
          const { ciphertext, iv } = JSON.parse(text);
          return {
            ciphertext: base64ToArrayBuffer(ciphertext),
            iv: new Uint8Array(base64ToArrayBuffer(iv)),
          };
        },
        passwordPromptHandler: async () =>
          Promise.resolve(window.prompt('共有データのパスワードを入力してください') || null),
      });
    }
    const parsed = JSON.parse(new TextDecoder().decode(buffer));
    Object.assign(characterStore.character, parsed.character);
    characterStore.skills.splice(0, characterStore.skills.length, ...parsed.skills);
    characterStore.specialSkills.splice(
      0,
      characterStore.specialSkills.length,
      ...parsed.specialSkills,
    );
    Object.assign(characterStore.equipments, parsed.equipments);
    characterStore.histories.splice(0, characterStore.histories.length, ...parsed.histories);
    uiStore.isViewingShared = true;
  } catch (err) {
    let msg = '共有データ読み込み失敗';
    if (err.name === 'InvalidLinkError') msg = '共有リンクが不正です';
    else if (err.name === 'ExpiredLinkError') msg = '共有リンクの有効期限が切れています';
    else if (err.name === 'PasswordRequiredError') msg = 'パスワードが必要です';
    else if (err.name === 'DecryptionError') msg = '復号に失敗しました';
    showToast({ type: 'error', title: '共有データエラー', message: msg });
    console.error('Error loading shared data:', err);
  }
});
</script>

<template>
  <TopLeftControls
    :is-gapi-initialized="uiStore.isGapiInitialized"
    :is-gis-initialized="uiStore.isGisInitialized"
    :can-sign-in-to-google="canSignInToGoogle"
    :is-signed-in="uiStore.isSignedIn"
    @sign-in="handleSignInClick"
    @sign-out="handleSignOutClick"
    @choose-folder="promptForDriveFolder(true)"
    @open-hub="openHub"
  />
  <div v-if="uiStore.isViewingShared" class="view-mode-banner">閲覧モードで表示中</div>
  <CharacterSheetLayout />
  <MainFooter
    ref="mainFooter"
    :help-state="helpState"
    :experience-status-class="experienceStatusClass"
    :current-experience-points="currentExperiencePoints"
    :max-experience-points="maxExperiencePoints"
    :current-weight="currentWeight"
    :output-button-text="outputButtonText"
    :is-viewing-shared="uiStore.isViewingShared"
    @save="saveData"
    @file-upload="handleFileUpload"
    @save-to-drive="handleSaveToDriveClick"
    @output="outputToCocofolia"
    @open-hub="openHub"
    @help-mouseover="handleHelpIconMouseOver"
    @help-mouseleave="handleHelpIconMouseLeave"
    @help-click="handleHelpIconClick"
    @share="handleShare"
    @copy-edit="uiStore.isViewingShared = false"
  />
  <HelpPanel
    ref="helpPanelRef"
    :is-visible="isHelpVisible"
    :help-text="AioniaGameData.helpText"
    @close="closeHelpPanel"
  />
  <CharacterHub
    v-if="isHubVisible"
    :data-manager="dataManager"
    :load-character="loadCharacterById"
    @close="closeHub"
  />
  <NotificationContainer />
</template>

<style scoped>
/*
  It is recommended to use Vite's asset handling.
  You can either @import your main CSS file here or manage it
  in your main.js/main.ts entry file.
*/
@import './assets/css/style.css';

/* Additional component-specific styles can go here */
.hidden {
  display: none !important;
}
.view-mode-banner {
  background: #333;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
}
</style>
