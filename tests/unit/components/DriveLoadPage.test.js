/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DriveLoadPage from '@/features/cloud-sync/pages/DriveLoadPage.vue';
import { messages } from '@/i18n/index.js';

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
      {
        id: 'file-1',
        fileName: 'Sample',
        characterName: 'Hero',
        driveHash: 'abcd1234ef',
        cachedHash: 'abcd1234ef',
        lastModifiedAtDrive: 1000,
      },
    ];
    const wrapper = mount(DriveLoadPage);
    await wrapper.find('[data-test="drive-card"]').trigger('click');
    expect(selectCharacter).toHaveBeenCalledWith('file-1');
    expect(pushMock).toHaveBeenCalledWith({ name: 'character-sheet' });
  });

  it('shows sharing and integrity indicators with truncated hashes', () => {
    displayedItems.value = [
      {
        id: 'file-2',
        fileName: 'Shared File',
        characterName: 'Sentinel',
        driveHash: 'abcd1234efgh',
        cachedHash: 'abcd1234ijkl',
        lastModifiedAtDrive: 2000,
        shared: true,
        outOfSync: true,
      },
    ];

    const wrapper = mount(DriveLoadPage);
    const badges = wrapper.findAll('.drive-load-page__badge');
    expect(badges[0].text()).toBe(messages.driveLoadPage.labels.shared);
    expect(badges[1].text()).toBe(messages.driveLoadPage.labels.outOfSync);

    const hashTexts = wrapper.findAll('.drive-load-page__row dd').map((node) => node.text());
    expect(hashTexts[1]).toBe('abcd1234...');
    expect(hashTexts[2]).toBe('abcd1234...');
    expect(wrapper.find('.drive-load-page__warning').text()).toBe(messages.driveLoadPage.labels.hashWarning);
  });
});
