<template>
  <div class="share-dialog-overlay" @keydown.esc="emit('close')" tabindex="0">
    <div class="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
      <h2 id="share-dialog-title">共有</h2>
      <div v-if="!shareUrl && !isLoading">
        <div class="expiration-options">
          <label
            ><input type="radio" name="expires" value="24h" v-model="selected" />24時間</label
          >
          <label
            ><input type="radio" name="expires" value="7d" v-model="selected" />7日間</label
          >
          <label
            ><input
              type="radio"
              name="expires"
              value="never"
              v-model="selected"
            />無期限</label
          >
        </div>
        <button class="button-base" @click="generate" aria-label="共有リンクを生成">共有リンクを生成</button>
      </div>
      <div v-else-if="isLoading" class="loading">生成中...</div>
      <div v-else class="result">
        <textarea class="share-url" v-model="shareUrl" readonly />
        <button class="button-base" @click="copyUrl" aria-label="コピー">コピー</button>
        <div class="share-security-warning">
          共有リンクは第三者に渡さないでください。
        </div>
      </div>
      <button class="button-base" @click="emit('close')" aria-label="閉じる">閉じる</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// Emits close event only
const emit = defineEmits(['close']);
const props = defineProps({ generateShareLink: Function });

const selected = ref('never');
const shareUrl = ref('');
const isLoading = ref(false);

function expiresMs() {
  return selected.value === '24h'
    ? 86400000
    : selected.value === '7d'
    ? 604800000
    : 0;
}

async function generate() {
  isLoading.value = true;
  try {
    shareUrl.value = await props.generateShareLink(expiresMs());
  } finally {
    isLoading.value = false;
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
  } catch (err) {
    console.error(err);
  }
}
</script>

<style scoped>
</style>
