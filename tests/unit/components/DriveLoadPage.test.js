/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DriveLoadPage from '@/features/cloud-sync/pages/DriveLoadPage.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

let observerCallback;
class MockIntersectionObserver {
  constructor(callback) {
    observerCallback = callback;
  }

  observe() {}
  disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver;

const revealMore = vi.fn();
const initialize = vi.fn();
const refresh = vi.fn();
const cleanup = vi.fn();

vi.mock('@/features/cloud-sync/composables/useDriveLoadPageState.js', () => {
  return {
    useDriveLoadPageState: () => ({
      displayedItems: ref([]),
      isLoadingCache: ref(false),
      isSyncing: ref(false),
      isFetchingMore: ref(false),
      statusMessage: computed(() => 'status'),
      errorMessage: ref(''),
      initialize,
      revealMore,
      refresh,
      cleanup,
    }),
  };
});

describe('DriveLoadPage', () => {
  beforeEach(() => {
    revealMore.mockClear();
    initialize.mockClear();
  });

  it('triggers revealMore when the sentinel enters view', async () => {
    mount(DriveLoadPage);
    observerCallback?.([{ isIntersecting: true }]);
    expect(revealMore).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });
});
