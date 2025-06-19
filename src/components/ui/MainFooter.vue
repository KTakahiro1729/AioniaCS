<template>
  <div class="main-footer">
    <div
      class="button-base footer-help-icon"
      ref="helpIcon"
      :class="{ 'footer-help-icon--fixed': helpState === 'fixed' }"
      @mouseover="$emit('help-mouseover')"
      @mouseleave="$emit('help-mouseleave')"
      @click="$emit('help-click')"
      tabindex="0"
    >
      ？
    </div>
    <div :class="['status-display', experienceStatusClass]">
      経験点 {{ currentExperiencePoints }} / {{ maxExperiencePoints }}
    </div>
    <div class="footer-button-container">
      <button
        class="button-base footer-button footer-button--save"
        @click="$emit('save')"
        title="端末に保存"
      >
        <span class="icon-svg icon-svg--footer icon-svg-local-download"></span>
        端末保存
      </button>
    </div>
    <div class="footer-button-container">
      <label
        class="button-base footer-button footer-button--load"
        for="load_input_vue"
        title="端末から読込む"
      >
        <span class="icon-svg icon-svg--footer icon-svg-local-upload"></span>
        読み込み
      </label>
      <input
        type="file"
        id="load_input_vue"
        @change="(e) => $emit('file-upload', e)"
        accept=".json,.txt,.zip"
        class="hidden"
      />
    </div>
    <div class="button-base footer-button footer-button--output" @click="$emit('output')" ref="outputButton">
      {{ outputButtonText }}
    </div>
    <button
      class="button-base footer-button footer-button--share"
      :aria-label="isViewingShared ? '自分用にコピーして編集' : '共有'"
      @click="handleShareClick"
    >
      {{ isViewingShared ? '自分用にコピーして編集' : '共有' }}
    </button>
    <button
      class="button-base footer-button footer-button--print"
      @click="$emit('print')"
    >
      印刷
    </button>
    <div class="footer-build-info" v-if="buildInfo">
      {{ buildInfo }}
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose, defineEmits } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import ShareOptions from '../modals/contents/ShareOptions.vue';
import { useShare } from '../../composables/useShare.js';
import { useModal } from '../../composables/useModal.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { useModalStore } from '../../stores/modalStore.js';

const props = defineProps({
  helpState: String,
  experienceStatusClass: String,
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  currentWeight: Number,
  outputButtonText: String,
  isViewingShared: Boolean,
  dataManager: Object,
  signIn: Function,
});

const emit = defineEmits([
  'help-mouseover',
  'help-mouseleave',
  'help-click',
  'save',
  'file-upload',
  'output',
  'share',
  'copy-edit',
  'print',
]);
const outputButton = ref(null);
const helpIcon = ref(null);

defineExpose({ outputButton, helpIcon });

const uiStore = useUiStore();
const { generateShare, copyLink, isLongData } = useShare(props.dataManager);
const { showModal } = useModal();
const { showToast } = useNotifications();
const modalStore = useModalStore();

const buildBranch = import.meta.env.VITE_BUILD_BRANCH;
const buildHash = import.meta.env.VITE_BUILD_HASH;
const buildDate = import.meta.env.VITE_BUILD_DATE;
const buildInfo =
  buildBranch && buildHash && buildDate
    ? `${buildBranch} (${buildHash}) ${buildDate}`
    : '';

async function handleShareClick() {
  if (props.isViewingShared) {
    emit('copy-edit');
    return;
  }
  window.__driveSignIn = props.signIn;
  const result = await showModal({
    component: ShareOptions,
    props: { signedIn: uiStore.isSignedIn, longData: isLongData() },
    title: '共有リンクを生成',
    buttons: [
      { label: '生成', value: 'generate', variant: 'primary' },
      { label: 'キャンセル', value: 'cancel', variant: 'secondary' },
    ],
  });
  delete window.__driveSignIn;
  if (result.value !== 'generate' || !result.component) return;
  const optsComp = result.component;
  const opts = {
    type: optsComp.type.value,
    includeFull: optsComp.includeFull.value,
    password: optsComp.password.value || '',
    expiresInDays: Number(optsComp.expires.value) || 0,
  };
  if ((opts.type === 'dynamic' || opts.includeFull) && !uiStore.isSignedIn) {
    showToast({ type: 'error', title: 'Drive', message: 'サインインしてください' });
    return;
  }
  try {
    const link = await generateShare(opts);
    await copyLink(link);
    modalStore.hideModal();
  } catch (err) {
    showToast({ type: 'error', title: '共有リンク生成失敗', message: err.message });
  }
}
</script>

<style scoped>
.footer-button {
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
  white-space: nowrap;
}

.footer-button--output.state-1 {
  transition:
    background-color 0.5s ease-in-out,
    color 0.5s ease-in-out;
  background-color: var(--color-accent-light);
  color: var(--color-accent-light);
}

.footer-button--output.state-2 {
  transition: color 0.1s ease-in;
  background-color: var(--color-accent-light);
  color: var(--color-background);
}

.footer-button--output.state-3 {
  transition: color 0.5s ease-in-out;
  background-color: var(--color-accent-light);
  color: var(--color-accent-light);
}

.footer-button--output.state-4 {
  transition:
    background-color 0.7s ease-in-out,
    color 0.2s ease-in-out 0.5s;
  background-color: transparent;
  color: var(--color-accent);
}

.footer-button--load {
  padding: 0;
}

.footer-button--output {
  width: 175px;
  user-select: none;
}

.footer-button--output.is-animating {
  pointer-events: none;
}

.footer-button-container {
  position: relative;
  display: flex;
  align-items: stretch;
}

.footer-button--save,
.footer-button--load {
  width: 120px;
  flex-shrink: 0;
  justify-content: center;
}

.footer-button--save {
  padding: 0;
}

.footer-button--cloud {
  padding: 0 12px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}
</style>

