<template>
  <header class="gm-table-header">
    <div class="gm-table-header__title-block">
      <h1 class="gm-table-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="gm-table-header__subtitle">{{ subtitle }}</p>
    </div>
    <div class="gm-table-header__actions">
      <button type="button" class="gm-table-header__button" @click="$emit('back')">
        {{ backLabel }}
      </button>
      <button
        type="button"
        class="gm-table-header__button"
        :disabled="!hasCharacters"
        @click="$emit('save')"
      >
        {{ saveLabel }}
      </button>
      <button type="button" class="gm-table-header__button" @click="$emit('load')">
        {{ loadLabel }}
      </button>
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  backLabel: { type: String, default: '' },
  saveLabel: { type: String, default: '' },
  loadLabel: { type: String, default: '' },
  hasCharacters: { type: Boolean, default: false },
});
</script>

<style scoped>
.gm-table-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 32px;
}

.gm-table-header__title {
  font-family: 'Cinzel Decorative', 'Shippori Mincho', serif;
  font-size: clamp(28px, 5vw, 42px);
  margin: 0;
  color: var(--color-accent-light);
}

.gm-table-header__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

.gm-table-header__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.gm-table-header__button {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-header);
  color: var(--color-text-normal);
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgb(0 0 0 / 45%);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.gm-table-header__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.gm-table-header__button:not(:disabled):hover {
  transform: translateY(-2px);
  background: var(--color-accent);
}

@media (max-width: 640px) {
  .gm-table-header {
    align-items: flex-start;
  }
}
</style>
