<template>
  <div class="load-indicator">
    <span class="load-indicator--label"> 荷重: {{ loadValue }}</span>
    <div class="load-indicator--steps">
      <div v-for="i in 15" :key="i" :class="['load-indicator--step', stepClasses[i - 1]]"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCharacterStore } from '../../stores/characterStore.js';
import { calculateStepClasses } from '../../utils/loadIndicator.js';

const props = defineProps({
  load: Number,
});

const characterStore = useCharacterStore();

const loadValue = computed(() => props.load ?? characterStore.currentWeight);
const stepClasses = computed(() => calculateStepClasses(loadValue.value));
</script>

<style scoped>
.load-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 20px;
}

.load-indicator--label {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.9em;
}

.load-indicator--steps {
  display: flex;
  gap: 2px;
}

.load-indicator--step {
  width: 10px;
  height: 16px;
  border-radius: 2px;
  background-color: var(--color-ghost-normal);
}

.load-indicator--step--on-normal {
  background-color: var(--color-load-normal);
}

.load-indicator--step--on-light {
  background-color: var(--color-load-light);
}

.load-indicator--step--on-heavy {
  background-color: var(--color-load-heavy);
}

.load-indicator--step--ghost-normal {
  background-color: var(--color-load-ghost-normal);
}

.load-indicator--step--ghost-light {
  background-color: var(--color-load-ghost-light);
}

.load-indicator--step--ghost-heavy {
  background-color: var(--color-load-ghost-heavy);
}
</style>
