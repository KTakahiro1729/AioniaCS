<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { messages } from '@/i18n/index.js';
import { useDriveLoadPageState } from '@/features/cloud-sync/composables/useDriveLoadPageState.js';

const router = useRouter();
const sentinelRef = ref(null);
const observer = ref(null);

const {
  displayedItems,
  isLoadingCache,
  isSyncing,
  isFetchingMore,
  statusMessage,
  errorMessage,
  initialize,
  revealMore,
  refresh,
  cleanup,
  selectCharacter,
} = useDriveLoadPageState();

const isEmpty = computed(() => !isLoadingCache.value && displayedItems.value.length === 0);
const isBusy = computed(() => isSyncing.value || isFetchingMore.value);
const statusLabel = computed(() => statusMessage.value);
const statusDetail = computed(() => (errorMessage.value ? messages.driveLoadPage.status.retryHint : ''));

function goBackToSheet() {
  router.push({ name: 'character-sheet' });
}

function onSelectCharacter(fileId) {
  if (!fileId) return;
  selectCharacter(fileId);
  router.push({ name: 'character-sheet' });
}

function formatHash(hash) {
  if (!hash) return messages.driveLoadPage.labels.notAvailable;
  const shortHash = hash.slice(0, 8);
  return hash.length > 8 ? `${shortHash}...` : shortHash;
}

function formatTimestamp(seconds) {
  if (!seconds) return messages.driveLoadPage.labels.unknownDate;
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return messages.driveLoadPage.labels.unknownDate;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function setupObserver() {
  if (!sentinelRef.value) return;
  if (observer.value) {
    observer.value.disconnect();
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revealMore();
          break;
        }
      }
    },
    { rootMargin: '0px 0px 180px 0px', threshold: 0.1 },
  );

  observer.value.observe(sentinelRef.value);
}

onMounted(() => {
  initialize();
  setupObserver();
});

onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
  cleanup();
});
</script>

<template>
  <div class="drive-load-page">
    <header class="drive-load-page__header">
      <button class="button-base drive-load-page__back" type="button" @click="goBackToSheet">
        {{ messages.driveLoadPage.buttons.back }}
      </button>
      <h1 class="drive-load-page__title">{{ messages.driveLoadPage.title }}</h1>
    </header>

    <section class="drive-load-page__content">
      <div class="drive-load-page__status" :data-busy="isBusy">
        <div class="drive-load-page__status-indicator" :data-state="errorMessage ? 'error' : isSyncing ? 'sync' : 'idle'" />
        <div class="drive-load-page__status-text">{{ statusLabel }}</div>
        <button class="button-base drive-load-page__refresh" type="button" :disabled="isBusy" @click="refresh">
          {{ messages.driveLoadPage.buttons.refresh }}
        </button>
      </div>
      <p v-if="statusDetail" class="drive-load-page__status-detail">{{ statusDetail }}</p>

      <p v-if="isEmpty" class="drive-load-page__placeholder">{{ messages.driveLoadPage.placeholder }}</p>

      <div v-else class="drive-load-page__list" role="list">
        <button
          v-for="item in displayedItems"
          :key="item.id"
          class="drive-load-page__card"
          type="button"
          role="listitem"
          :aria-label="`${messages.driveLoadPage.labels.selectAction}: ${item.fileName || messages.driveLoadPage.labels.untitled}`"
          data-test="drive-card"
          @click="onSelectCharacter(item.id)"
        >
          <header class="drive-load-page__card-header">
            <div>
              <p class="drive-load-page__file-name">{{ item.fileName || messages.driveLoadPage.labels.untitled }}</p>
              <p class="drive-load-page__character-name">{{ item.characterName || messages.driveLoadPage.labels.unknownCharacter }}</p>
            </div>
            <div class="drive-load-page__indicators" aria-live="polite">
              <span
                v-if="item.shared"
                class="drive-load-page__badge drive-load-page__badge--muted"
                :aria-label="messages.driveLoadPage.labels.sharedAria"
              >
                {{ messages.driveLoadPage.labels.shared }}
              </span>
              <span v-if="item.outOfSync" class="drive-load-page__badge drive-load-page__badge--warning" role="status">
                {{ messages.driveLoadPage.labels.outOfSync }}
              </span>
            </div>
          </header>
          <dl class="drive-load-page__details">
            <div class="drive-load-page__row">
              <dt>{{ messages.driveLoadPage.labels.modified }}</dt>
              <dd>{{ formatTimestamp(item.lastModifiedAtDrive) }}</dd>
            </div>
            <div class="drive-load-page__row">
              <dt>{{ messages.driveLoadPage.labels.driveHash }}</dt>
              <dd :title="item.driveHash || messages.driveLoadPage.labels.notAvailable">
                {{ formatHash(item.driveHash) }}
              </dd>
            </div>
            <div class="drive-load-page__row">
              <dt>{{ messages.driveLoadPage.labels.cachedHash }}</dt>
              <dd :title="item.cachedHash || messages.driveLoadPage.labels.notAvailable">
                {{ formatHash(item.cachedHash) }}
              </dd>
            </div>
          </dl>
          <p v-if="item.outOfSync" class="drive-load-page__warning" role="status">
            {{ messages.driveLoadPage.labels.hashWarning }}
          </p>
        </button>
      </div>

      <div ref="sentinelRef" class="drive-load-page__sentinel" aria-hidden="true">
        <span v-if="isSyncing">{{ messages.driveLoadPage.status.syncing }}</span>
        <span v-else-if="isFetchingMore">{{ messages.driveLoadPage.status.loadMore }}</span>
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

.drive-load-page__status-detail {
  margin: 0 0 4px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.drive-load-page__status {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-muted, #3a3a4a);
  border-radius: 6px;
  background: var(--color-panel-body, #181824);
}

.drive-load-page__status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border-muted, #3a3a4a);
}

.drive-load-page__status-indicator[data-state='sync'] {
  background: #4da3ff;
  box-shadow: 0 0 0 6px rgba(77, 163, 255, 0.15);
}

.drive-load-page__status-indicator[data-state='error'] {
  background: #ff6b6b;
  box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.15);
}

.drive-load-page__status-text {
  color: var(--color-text-primary);
  font-weight: 600;
  min-height: 20px;
}

.drive-load-page__refresh {
  justify-self: end;
  min-width: 120px;
}

.drive-load-page__placeholder {
  margin: 0;
  color: var(--color-text-muted);
}

.drive-load-page__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.drive-load-page__card {
  appearance: none;
  border: none;
  text-align: left;
  width: 100%;
  border: 1px solid var(--color-border-muted, #3a3a4a);
  border-radius: 6px;
  padding: 12px;
  background: linear-gradient(145deg, rgba(39, 39, 52, 0.9), rgba(26, 26, 36, 0.9));
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.drive-load-page__card:hover {
  border-color: var(--color-border-normal);
  transform: translateY(-1px);
}

.drive-load-page__card:focus-visible {
  outline: 2px solid #4da3ff;
  outline-offset: 2px;
}

.drive-load-page__card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.drive-load-page__indicators {
  display: flex;
  gap: 6px;
  align-items: center;
}

.drive-load-page__file-name {
  margin: 0;
  font-weight: 700;
  font-size: 1rem;
}

.drive-load-page__character-name {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.drive-load-page__badge {
  background: #ffb347;
  color: #1a1a24;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.drive-load-page__badge--warning {
  background: #ff6b6b;
  color: #1a1a24;
}

.drive-load-page__badge--muted {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-muted, #3a3a4a);
}

.drive-load-page__details {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drive-load-page__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.drive-load-page__row dt {
  color: var(--color-text-muted);
}

.drive-load-page__row dd {
  margin: 0;
  text-align: right;
  color: var(--color-text-primary);
}

.drive-load-page__warning {
  margin: 4px 0 0;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 107, 0.4);
  background: rgba(255, 107, 107, 0.08);
  color: #ffdede;
  font-size: 0.9rem;
}

.drive-load-page__sentinel {
  min-height: 16px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 4px;
}
</style>
