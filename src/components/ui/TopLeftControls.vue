<template>
  <div class="top-left-controls">
    <div class="google-drive-button-container">
      <button
        class="button-base icon-button"
        title="Cloud Hub"
        v-if="isGapiInitialized && isGisInitialized"
        @click="$emit('open-hub')"
      >
        <span class="icon-svg icon-svg-cloud" aria-label="Cloud"></span>
      </button>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  isGapiInitialized: Boolean,
  isGisInitialized: Boolean,
});

const emit = defineEmits(['open-hub']);
</script>

<style scoped>
</style>

