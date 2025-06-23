<template>
  <div class="io-modal">
    <button class="button-base" @click="$emit('save-local')">
      {{ saveLocalLabel }}
    </button>
    <label class="button-base">
      {{ loadLocalLabel }}
      <input type="file" class="hidden" @change="(e) => $emit('load-local', e)" accept=".json,.txt,.zip" />
    </label>
    <AnimatedButton
      class="button-base"
      :trigger="triggerKey"
      :default-label="outputLabels.default"
      :animating-label="outputLabels.animating"
      :success-label="outputLabels.success"
      :timings="outputTimings"
      @click="$emit('output-cocofolia')"
    />
    <button class="button-base" @click="$emit('print')">
      {{ printLabel }}
    </button>
    <button class="button-base" v-if="signedIn" @click="$emit('drive-folder')">
      {{ driveFolderLabel }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AnimatedButton from '../../common/AnimatedButton.vue';

defineProps({
  signedIn: Boolean,
  saveLocalLabel: String,
  loadLocalLabel: String,
  outputLabels: Object,
  outputTimings: Object,
  printLabel: String,
  driveFolderLabel: String,
});

defineEmits(['save-local', 'load-local', 'output-cocofolia', 'print', 'drive-folder']);

const triggerKey = ref(0);
function triggerAnimation() {
  triggerKey.value += 1;
}

function handleCopySuccess(event) {
  if (event.detail.type === 'cocofolia') {
    triggerAnimation();
  }
}

onMounted(() => {
  document.removeEventListener('aionia-copy-success', handleCopySuccess);
  document.addEventListener('aionia-copy-success', handleCopySuccess);
});

onUnmounted(() => {
  document.removeEventListener('aionia-copy-success', handleCopySuccess);
});
</script>

<style scoped>
.io-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
