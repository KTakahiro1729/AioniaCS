/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DriveLoadPage from '@/features/cloud-sync/pages/DriveLoadPage.vue';

const pushMock = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
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

const displayedItems = ref([]);
const revealMore = vi.fn();
const initialize = vi.fn();
const refresh = vi.fn();
const cleanup = vi.fn();
const selectCharacter = vi.fn();

vi.mock('@/features/cloud-sync/composables/useDriveLoadPageState.js', () => {
  return {
    useDriveLoadPageState: () => ({
      displayedItems,
      isLoadingCache: ref(false),
      isSyncing: ref(false),
      isFetchingMore: ref(false),
      statusMessage: computed(() => 'status'),
      errorMessage: ref(''),
      initialize,
      revealMore,
      refresh,
      cleanup,
      selectCharacter,
    }),
  };
});

describe('DriveLoadPage', () => {
  beforeEach(() => {
    revealMore.mockClear();
    initialize.mockClear();
    selectCharacter.mockClear();
    pushMock.mockClear();
    displayedItems.value = [];
  });

  it('triggers revealMore when the sentinel enters view', async () => {
    mount(DriveLoadPage);
    observerCallback?.([{ isIntersecting: true }]);
    expect(revealMore).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });

  it('selects a character and navigates back to the sheet', async () => {
    displayedItems.value = [
      { id: 'file-1', fileName: 'Sample', characterName: 'Hero', contentHash: 'abcd1234ef', lastModifiedAtDrive: 1000 },
    ];
    const wrapper = mount(DriveLoadPage);
    await wrapper.find('[data-test="drive-card"]').trigger('click');
    expect(selectCharacter).toHaveBeenCalledWith('file-1');
    expect(pushMock).toHaveBeenCalledWith({ name: 'character-sheet' });
  });
});
