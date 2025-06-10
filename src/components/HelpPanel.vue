<template>
  <div class="help-panel" v-if="isVisible">
    <button class="help-close" @click="$emit('close')">×</button>
    <div v-html="helpText"></div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  helpText: String,
});

const emit = defineEmits(['close']);
</script>

<style scoped>
/* Styles moved from _layout.css */
.help-panel {
  position: fixed;
  bottom: 92px; /* This might need to be adjusted based on footer height if footer is also a component later */
  left: 20px;
  background-color: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 5px 15px rgb(0 0 0 / 50%);
  z-index: 1000; /* Ensure this z-index is appropriate */
  max-width: 90%;
  width: 420px;
  font-size: 0.9em;
  color: var(--color-text-normal);
}

/* Styles for content within v-html="helpText" need to be global or un-scoped if they are part of helpText HTML. */
/* However, if helpText is simple, these might apply to wrapper divs if present in helpText. */
/* For now, these are scoped, meaning they only apply if helpText itself contains these selectors, which is unlikely for v-html. */
/* A better approach for v-html content is to have its styles be global or use :deep() selector if needed. */
/* For this task, I'm moving them as they were in _layout.css. */
.help-panel :deep(h4) { /* Using :deep to style content passed via v-html */
  font-family: "Noto Serif JP", serif;
  color: var(--color-accent);
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.help-panel :deep(ul) {
  padding-left: 20px;
  margin-top: 5px;
  margin-bottom: 15px;
}

.help-panel :deep(li) {
  margin-bottom: 5px;
}

.help-panel :deep(p) {
  margin-top: 0;
  margin-bottom: 10px;
}

.help-close {
  position: absolute;
  top: 5px;
  right: 5px;
  background: transparent;
  border: none;
  color: var(--color-accent);
  font-size: 1.2em;
  cursor: pointer;
}
</style>
