<template>
  <transition name="fade">
    <div class="help-panel" v-if="isVisible" ref="panelEl">
      <button class="help-close close-cross" @click="$emit('close')">×</button>
      <div class="accordion">
        <div v-for="(section, index) in sections" :key="section.title" class="accordion__item">
          <button class="accordion__header" @click="toggle(index)">
            {{ section.title }}
            <span class="accordion__indicator">
              {{ activeSection === index ? '−' : '+' }}
            </span>
          </button>
          <div class="accordion__body" v-show="activeSection === index" v-html="section.html"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, defineExpose, watch } from 'vue';

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
  async (val) => {
    sections.value = parseSections(val);
    activeSection.value = 0;
    if (sections.value[0]) {
      const { marked } = await import('marked');
      const { default: DOMPurify } = await import('dompurify');
      sections.value[0].html = DOMPurify.sanitize(marked.parse(sections.value[0].content));
    }
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
    return { title, content: body, html: '' };
  });
}

async function toggle(index) {
  if (activeSection.value === index) {
    activeSection.value = -1;
    return;
  }

  activeSection.value = index;
  const section = sections.value[index];

  if (!section.html) {
    const { marked } = await import('marked');
    const { default: DOMPurify } = await import('dompurify');
    section.html = DOMPurify.sanitize(marked.parse(section.content));
  }
}
defineExpose({ panelEl });
</script>

<style scoped>
.help-panel {
  position: fixed;
  top: 92px;
  right: 20px;
  background-color: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  padding: 30px;
  border-radius: 4px;
  box-shadow: 0 5px 15px rgb(0 0 0 / 50%);
  z-index: 200;
  max-width: 90%;
  width: 400px;
  font-size: 0.9em;
  color: var(--color-text-normal);
}

.help-panel h4 {
  font-family: 'Noto Serif JP', serif;
  color: var(--color-accent);
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.help-panel ul {
  padding-left: 20px;
  margin-top: 5px;
  margin-bottom: 15px;
}

.help-panel li {
  margin-bottom: 5px;
}

.help-panel p {
  margin-top: 0;
  margin-bottom: 10px;
}

.accordion__item + .accordion__item {
  margin-top: 10px;
}

.accordion__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: var(--color-panel-header);
  color: var(--color-accent);
  padding: 8px 10px;
  border: none;
  cursor: pointer;
  font-size: 1em;
  border-radius: 3px;
}

.accordion__indicator {
  margin-left: 10px;
}

.accordion__body {
  padding-top: 5px;
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

@media (max-width: 768px) {
  .help-panel {
    width: calc(100% - 80px);
    max-width: none;
    top: 92px;
    right: 20px;
  }
}
</style>
