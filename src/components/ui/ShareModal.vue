<template>
  <transition name="modal">
    <div class="modal-overlay" v-if="uiStore.isShareModalVisible">
      <div class="modal share-modal">
        <button class="modal-close close-cross" @click="uiStore.closeShareModal()">×</button>
        <ShareOptions
          ref="options"
          :signed-in="uiStore.isSignedIn"
          :long-data="isLongData()"
        />
        <div class="modal-actions">
          <button class="modal-button modal-button--primary" @click="generate">生成</button>
          <button class="modal-button modal-button--secondary" @click="uiStore.closeShareModal()">キャンセル</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';
import ShareOptions from '../notifications/ShareOptions.vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useShare } from '../../composables/useShare.js';
import { useNotifications } from '../../composables/useNotifications.js';

const props = defineProps({ dataManager: Object });

const uiStore = useUiStore();
const { generateShare, copyLink, isLongData } = useShare(props.dataManager);
const { showToast } = useNotifications();

const options = ref(null);

async function generate() {
  if (!options.value) return;
  const opts = {
    type: options.value.type.value,
    includeFull: options.value.includeFull.value,
    password: options.value.password.value || '',
    expiresInDays: Number(options.value.expires.value) || 0,
  };
  if ((opts.type === 'dynamic' || opts.includeFull) && !uiStore.isSignedIn) {
    showToast({ type: 'error', title: 'Drive', message: 'サインインしてください' });
    return;
  }
  try {
    const link = await generateShare(opts);
    await copyLink(link);
    uiStore.closeShareModal();
  } catch (err) {
    showToast({ type: 'error', title: '共有リンク生成失敗', message: err.message });
  }
}
</script>

<style scoped>
</style>

