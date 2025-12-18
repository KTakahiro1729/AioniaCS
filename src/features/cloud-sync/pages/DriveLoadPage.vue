<script setup>
import { useRouter } from 'vue-router';
import { messages } from '@/i18n/index.js';

const router = useRouter();

function goBackToSheet() {
  router.push({ name: 'character-sheet' });
}
</script>

<template>
  <div class="drive-load-page">
    <header class="drive-load-page__header">
      <button class="button-base drive-load-page__back" type="button" @click="goBackToSheet">
        {{ messages.driveLoadPage.backLabel }}
      </button>
      <h1 class="drive-load-page__title">{{ messages.driveLoadPage.title }}</h1>
    </header>
    <section class="drive-load-page__content">
      <p class="drive-load-page__placeholder">{{ messages.driveLoadPage.placeholder }}</p>
      <div class="drive-load-page__list" aria-hidden="true">
        <div class="drive-load-page__list-item" />
        <div class="drive-load-page__list-item" />
        <div class="drive-load-page__list-item" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.drive-load-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  color: var(--color-text-primary, #fff);
}

.drive-load-page__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drive-load-page__back {
  min-width: 120px;
}

.drive-load-page__title {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.5px;
}

.drive-load-page__content {
  background: var(--color-panel, #1f1f2b);
  border: 1px solid var(--color-border-normal);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drive-load-page__placeholder {
  margin: 0;
  color: var(--color-text-muted);
}

.drive-load-page__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.drive-load-page__list-item {
  min-height: 120px;
  border: 1px dashed var(--color-border-muted, #3a3a4a);
  border-radius: 6px;
  background: var(--color-panel-body, #181824);
}
</style>
