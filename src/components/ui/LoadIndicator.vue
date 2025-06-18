<template>
  <div class="load-indicator">
    <span class="load-indicator--label">
      荷重: {{ loadValue }}</span>
    <div class="load-indicator--steps">
      <div
        v-for="i in 15"
        :key="i"
        :class="['load-indicator--step', stepClasses[i - 1]]"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/characterStore.js'
import { calculateStepClasses } from '../../utils/loadIndicator.js'

const props = defineProps({
  load: Number,
})

const characterStore = useCharacterStore()

const loadValue = computed(() => props.load ?? characterStore.currentWeight)
const stepClasses = computed(() => calculateStepClasses(loadValue.value))
</script>

