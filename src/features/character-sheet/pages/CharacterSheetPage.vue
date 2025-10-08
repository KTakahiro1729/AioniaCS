<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useHelp } from '@/shared/composables/useHelp.js';
import { useDataExport } from '@/features/character-sheet/composables/useDataExport.js';
import { useKeyboardHandling } from '@/shared/composables/useKeyboardHandling.js';
import { usePrint } from '@/features/character-sheet/composables/usePrint.js';
import { messages } from '@/locales/ja.js';
import { useAppModals } from '@/features/modals/composables/useAppModals.js';
import { useAppInitialization } from '@/app/providers/useAppInitialization.js';
import { AioniaGameData } from '@/data/gameData.js';
import CharacterSheetLayout from '@/features/character-sheet/components/CharacterSheetLayout.vue';
import MainHeader from '@/features/character-sheet/components/ui/MainHeader.vue';
import MainFooter from '@/features/character-sheet/components/ui/MainFooter.vue';
import HelpPanel from '@/features/character-sheet/components/ui/HelpPanel.vue';

const mainHeader = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const router = useRouter();
useKeyboardHandling();

const { dataManager, saveData, handleFileUpload, outputToCocofolia } = useDataExport();
const { printCharacterSheet, openPreviewPage } = usePrint();

const { handleSignInClick, handleSignOutClick, saveCharacterToDrive, saveOrUpdateCurrentCharacterInDrive } =
  useGoogleDrive(dataManager);

const { helpState, isHelpVisible, handleHelpIconMouseOver, handleHelpIconMouseLeave, handleHelpIconClick, closeHelpPanel } = useHelp(
  helpPanelRef,
  mainHeader,
);

const { openHub, openIoModal, openShareModal } = useAppModals({
  dataManager,
  saveCharacterToDrive,
  handleSignInClick,
  handleSignOutClick,
  saveData,
  handleFileUpload,
  outputToCocofolia,
  printCharacterSheet,
  openPreviewPage,
  copyEditCallback: () => {
    uiStore.isViewingShared = false;
  },
});

const maxExperiencePoints = computed(() => characterStore.maxExperiencePoints);
const currentExperiencePoints = computed(() => characterStore.currentExperiencePoints);
const currentWeight = computed(() => characterStore.currentWeight);
const experienceStatusClass = computed(() => uiStore.experienceStatusClass);

watch(
  () => characterStore.calculatedScar,
  (currentScar) => {
    characterStore.character.currentScar = currentScar;
  },
  { immediate: true },
);

watch(
  () => characterStore.character.name,
  (name) => {
    document.title = name || messages.ui.header.defaultTitle;
  },
  { immediate: true },
);

const { initialize } = useAppInitialization(dataManager);
onMounted(initialize);

function navigateToGmTable() {
  router.push({ name: 'gm-table' });
}
</script>

<template>
  <MainHeader
    ref="mainHeader"
    :help-state="helpState"
    :default-title="messages.ui.header.defaultTitle"
    :cloud-hub-label="messages.ui.header.cloudHub"
    :help-label="messages.ui.header.helpLabel"
    :gm-table-label="messages.ui.header.gmTable"
    show-gm-table-button
    @open-hub="openHub"
    @help-mouseover="handleHelpIconMouseOver"
    @help-mouseleave="handleHelpIconMouseLeave"
    @help-click="handleHelpIconClick"
    @open-gm-table="navigateToGmTable"
  />
  <div v-if="uiStore.isViewingShared" class="view-mode-banner">
    {{ messages.ui.viewModeBanner }}
  </div>
  <CharacterSheetLayout />
  <MainFooter
    :experience-status-class="experienceStatusClass"
    :current-experience-points="currentExperiencePoints"
    :max-experience-points="maxExperiencePoints"
    :current-weight="currentWeight"
    :save-local="saveData"
    :handle-file-upload="handleFileUpload"
    :open-hub="openHub"
    :save-to-drive="saveOrUpdateCurrentCharacterInDrive"
    :experience-label="messages.ui.footer.experience"
    :io-label="messages.ui.footer.io"
    :share-label="messages.ui.footer.share"
    :copy-edit-label="messages.ui.footer.copyEdit"
    :is-viewing-shared="uiStore.isViewingShared"
    @io="openIoModal"
    @share="openShareModal"
  />
  <HelpPanel ref="helpPanelRef" :is-visible="isHelpVisible" :help-text="AioniaGameData.helpText" @close="closeHelpPanel" />
</template>

<style scoped>
.view-mode-banner {
  background: #333;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
}
</style>
