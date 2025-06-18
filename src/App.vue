<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import { useGoogleDrive } from './composables/useGoogleDrive.js';
import { useHelp } from './composables/useHelp.js';
import { useDataExport } from './composables/useDataExport.js';
import { useKeyboardHandling } from './composables/useKeyboardHandling.js';
import { usePrint } from './composables/usePrint.js';
import { base64ToArrayBuffer } from './libs/sabalessshare/src/crypto.js';
import { receiveSharedData } from './libs/sabalessshare/src/index.js';
import { receiveDynamicData } from './libs/sabalessshare/src/dynamic.js';
import { parseShareUrl } from './libs/sabalessshare/src/url.js';
import { DriveStorageAdapter } from './services/driveStorageAdapter.js';
import { messages } from './locales/ja.js';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import CharacterSheetLayout from './layouts/CharacterSheetLayout.vue';
import MainHeader from './components/ui/MainHeader.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
import NotificationContainer from './components/notifications/NotificationContainer.vue';
import BaseModal from './components/modals/BaseModal.vue';
import CharacterHub from './components/ui/CharacterHub.vue';
import CharacterHubControls from './components/ui/CharacterHubControls.vue';
import ShareOptions from './components/modals/contents/ShareOptions.vue';
import IoModal from './components/modals/contents/IoModal.vue';
import { useModal } from './composables/useModal.js';
import { useNotifications } from './composables/useNotifications.js';
// --- Template Refs ---
const mainFooter = ref(null);
const mainHeader = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();
const { printCharacterSheet, openPreviewPage  } = usePrint();

const {
  dataManager,
  saveData,
  handleFileUpload,
  outputToCocofolia,
} = useDataExport(mainFooter);


const {
  canSignInToGoogle,
  handleSignInClick,
  handleSignOutClick,
  promptForDriveFolder,
  saveCharacterToDrive,
  handleSaveToDriveClick,
} = useGoogleDrive(dataManager);

const {
  helpState,
  isHelpVisible,
  handleHelpIconMouseOver,
  handleHelpIconMouseLeave,
  handleHelpIconClick,
  closeHelpPanel,
} = useHelp(helpPanelRef, mainHeader);

const { showToast, showAsyncToast } = useNotifications();
const { showModal } = useModal();

async function openHub() {
  await showModal({
    component: CharacterHub,
    title: 'クラウドキャラクター管理',
    props: {
      dataManager,
      loadCharacter: loadCharacterById,
      saveToDrive: saveCharacterToDrive,
    },
    globalActions: {
      component: CharacterHubControls,
      on: {
        'sign-in': handleSignInClick,
        'sign-out': handleSignOutClick,
        refresh: refreshHubList,
        new: saveNewCharacter,
      },
    },
    buttons: [],
  });
}

function refreshHubList() {
  uiStore.refreshDriveCharacters(dataManager.googleDriveManager);
}

async function saveNewCharacter() {
  await saveCharacterToDrive(null, characterStore.character.name);
}

async function openIoModal() {
  await showModal({
    component: IoModal,
    props: { isSignedIn: uiStore.isSignedIn },
    title: '入出力',
    on: {
      print: printCharacterSheet,
      cocofolia: outputToCocofolia,
      'local-save': saveData,
      'local-load': handleFileUpload,
    },
    buttons: [],
  });
}


async function loadCharacterById(id, name) {
  const loadPromise = dataManager
    .loadDataFromDrive(id)
    .then((parsedData) => {
      if (parsedData) {
        Object.assign(characterStore.character, parsedData.character);
        characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
        characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
        Object.assign(characterStore.equipments, parsedData.equipments);
        characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
        uiStore.currentDriveFileId = id;
        uiStore.currentDriveFileName = name;
      }
    });
  showAsyncToast(loadPromise, {
    loading: messages.googleDrive.load.loading(name),
    success: messages.googleDrive.load.success(name),
    error: (err) => messages.googleDrive.load.error(err),
  });
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
    let key = 'general';
    if (err.name === 'InvalidLinkError') key = 'invalid';
    else if (err.name === 'ExpiredLinkError') key = 'expired';
    else if (err.name === 'PasswordRequiredError') key = 'passwordRequired';
    else if (err.name === 'DecryptionError') key = 'decryptionFailed';
    showToast({ type: 'error', ...messages.share.loadError.toast(key) });
    console.error('Error loading shared data:', err);
  }
});
</script>

<template>
  <MainHeader
    ref="mainHeader"
    @open-hub="openHub"
    @help-mouseover="handleHelpIconMouseOver"
    @help-mouseleave="handleHelpIconMouseLeave"
    @help-click="handleHelpIconClick"
  />
  <div v-if="uiStore.isViewingShared" class="view-mode-banner">閲覧モードで表示中</div>
  <CharacterSheetLayout />
  <MainFooter
    ref="mainFooter"
    :experience-status-class="experienceStatusClass"
    :current-experience-points="currentExperiencePoints"
    :max-experience-points="maxExperiencePoints"
    :current-weight="currentWeight"
    :data-manager="dataManager"
    :sign-in="handleSignInClick"
    :is-viewing-shared="uiStore.isViewingShared"
    @save="uiStore.isSignedIn ? handleSaveToDriveClick() : saveData()"
    @file-upload="handleFileUpload"
    @open-hub="openHub"
    @io="openIoModal"
    @copy-edit="uiStore.isViewingShared = false"
  />
  <HelpPanel
    ref="helpPanelRef"
    :is-visible="isHelpVisible"
    :help-text="AioniaGameData.helpText"
    @close="closeHelpPanel"
  />
  <!-- CharacterHub and ShareModal are now injected via BaseModal -->
  <BaseModal />
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
