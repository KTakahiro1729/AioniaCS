<template>
  <div class="io-modal">
    <button class="button-base" @click="$emit('save-local')">
      {{ localOutputLabel }}
    </button>
    <AnimatedButton
      class="button-base"
      :trigger="triggerKey"
      :default-label="outputLabels.default"
      :animating-label="outputLabels.animating"
      :success-label="outputLabels.success"
      :timings="outputTimings"
      @click="$emit('output-cocofolia')"
    />
    <button class="button-base" @click="$emit('output-chat-palette')">
      {{ chatPaletteLabel }}
    </button>
    <button class="button-base" @click="$emit('print')">
      {{ printLabel }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AnimatedButton from '@/shared/ui/base/AnimatedButton.vue';

defineProps({
  signedIn: Boolean,
  localOutputLabel: String,
  outputLabels: Object,
  outputTimings: Object,
  printLabel: String,
  chatPaletteLabel: String,
});

defineEmits(['save-local', 'output-cocofolia', 'output-chat-palette', 'print']);

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
