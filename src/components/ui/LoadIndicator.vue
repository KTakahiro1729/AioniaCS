<template>
  <div class="load-indicator">
    <span class="load-indicator__label">荷重: {{ weight }}</span>
    <div class="load-indicator__steps">
      <span
        v-for="n in 15"
        :key="n"
        :class="stepClass(n)"
        class="load-indicator__step"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/characterStore.js'

const characterStore = useCharacterStore()

const weight = computed(() => characterStore.currentWeight)

const penaltyState = computed(() => {
  if (weight.value <= 5) return 'normal'
  if (weight.value <= 10) return 'light'
  return 'heavy'
})

function stepClass(n) {
  const classes = []
  const w = weight.value
  if (n <= w) {
    classes.push('load-indicator__step--on')
    if (penaltyState.value === 'light') classes.push('load-indicator__step--light')
    else if (penaltyState.value === 'heavy') classes.push('load-indicator__step--heavy')
  } else {
    if (penaltyState.value === 'light' && n > w && n <= 11) {
      classes.push('load-indicator__step--ghost-light')
    } else if (penaltyState.value === 'heavy' && n > w) {
      classes.push('load-indicator__step--ghost-heavy')
    }
  }
  return classes
}
</script>

<style scoped>
.load-indicator {
  display: flex;
  align-items: center;
}

.load-indicator__label {
  margin-right: 6px;
}

.load-indicator__steps {
  display: flex;
  gap: 2px;
}

.load-indicator__step {
  width: 10px;
  height: 16px;
  border: 1px solid var(--color-border-normal);
  box-sizing: border-box;
}

.load-indicator__step--on {
  background-color: var(--status-normal-color);
}

.load-indicator__step--light.load-indicator__step--on {
  background-color: var(--status-light-penalty-color);
}

.load-indicator__step--heavy.load-indicator__step--on {
  background-color: var(--status-heavy-penalty-color);
}

.load-indicator__step--ghost-light {
  background-color: var(--ghost-light-penalty-color);
}

.load-indicator__step--ghost-heavy {
  background-color: var(--ghost-heavy-penalty-color);
}
</style>
