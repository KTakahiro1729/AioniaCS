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

<style scoped src="./GmTableHeader.css"></style>

