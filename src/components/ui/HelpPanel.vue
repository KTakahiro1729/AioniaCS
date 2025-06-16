<template>
  <transition name="fade">
    <div class="help-panel" v-if="isVisible" ref="panelEl">
      <button class="help-close close-cross" @click="$emit('close')">×</button>
      <div class="accordion">
        <div
          v-for="(section, index) in sections"
          :key="section.title"
          class="accordion__item"
        >
          <button
            class="accordion__header"
            @click="toggle(index)"
          >
            {{ section.title }}
            <span class="accordion__indicator">
              {{ activeSection === index ? '−' : '+' }}
            </span>
          </button>
          <div
            class="accordion__body"
            v-show="activeSection === index"
            v-html="section.content"
          ></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, defineExpose, watch } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
  isVisible: Boolean,
  helpText: String,
});

const emit = defineEmits(['close']);

const panelEl = ref(null);
const sections = ref([]);
const activeSection = ref(0);

watch(
  () => props.helpText,
  (val) => {
    sections.value = parseSections(val);
    activeSection.value = 0;
  },
  { immediate: true },
);

function parseSections(text) {
  if (!text) return [];
  const parts = text.split(/^####\s+/m).filter(Boolean);
  return parts.map((part) => {
    const lines = part.split('\n');
    const title = lines.shift().trim();
    const body = lines.join('\n');
    const html = DOMPurify.sanitize(marked.parse(body));
    return { title, content: html };
  });
}

function toggle(index) {
  activeSection.value = activeSection.value === index ? -1 : index;
}

defineExpose({ panelEl });
</script>

<style scoped>
</style>

