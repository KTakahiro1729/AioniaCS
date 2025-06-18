<template>
  <div class="main-footer">
    <div :class="['status-display', experienceStatusClass]">
      経験点 {{ currentExperiencePoints }} / {{ maxExperiencePoints }}
    </div>
    <div class="footer-button-container">
      <button
        class="button-base footer-button footer-button--save"
        @click="$emit('save')"
        :title="uiStore.isSignedIn ? 'クラウド保存' : '端末に保存'"
      >
        <span
          class="icon-svg icon-svg--footer"
          :class="uiStore.isSignedIn ? 'icon-svg-cloud-upload' : 'icon-svg-local-download'"
        ></span>
        {{ uiStore.isSignedIn ? '保存' : '端末保存' }}
      </button>
    </div>
    <div class="footer-button-container">
      <template v-if="!uiStore.isSignedIn">
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
      </template>
      <button
        v-else
        class="button-base footer-button footer-button--load"
        title="クラウド読込"
        @click="$emit('open-hub')"
      >
        <span class="icon-svg icon-svg--footer icon-svg-cloud"></span>
        読み込み
      </button>
    </div>
    <div
      class="button-base footer-button footer-button--output"
      @click="$emit('io')"
      ref="outputButton"
    >
      <span class="icon-svg icon-svg--footer icon-svg-io"></span>
      入出力
    </div>
    <button
      class="button-base footer-button footer-button--share"
      :aria-label="isViewingShared ? '自分用にコピーして編集' : '共有'"
      @click="handleShareClick"
    >
      <span class="icon-svg icon-svg--footer icon-svg-share"></span>
      {{ isViewingShared ? '自分用にコピーして編集' : '共有' }}
    </button>
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
  experienceStatusClass: String,
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  currentWeight: Number,
  isViewingShared: Boolean,
  dataManager: Object,
  signIn: Function,
});

const emit = defineEmits(['save', 'file-upload', 'share', 'copy-edit', 'open-hub', 'io']);
const outputButton = ref(null);

defineExpose({ outputButton });

const uiStore = useUiStore();
const { generateShare, copyLink, isLongData } = useShare(props.dataManager);
const { showModal } = useModal();
const { showToast } = useNotifications();
const modalStore = useModalStore();


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
</style>

