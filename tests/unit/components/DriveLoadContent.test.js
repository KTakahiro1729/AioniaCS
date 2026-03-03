/* @vitest-environment jsdom */
import { flushPromises, mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DriveLoadContent from '@/features/modals/components/contents/DriveLoadContent.vue';
import { messages } from '@/i18n/index.js';

const managerMock = {
  deleteCharacterFile: vi.fn(),
};
const enableShareMock = vi.fn();
const copyTextMock = vi.fn();

const hideModalMock = vi.fn();
vi.mock('@/features/modals/stores/modalStore.js', () => ({
  useModalStore: () => ({
    hideModal: hideModalMock,
  }),
}));

vi.mock('@/infrastructure/google-drive/googleDriveManager.js', () => ({
  getGoogleDriveManagerInstance: () => managerMock,
}));

vi.mock('@/features/cloud-sync/composables/useShare.js', () => ({
  useShare: () => ({
    enableShare: enableShareMock,
  }),
}));

vi.mock('@/shared/utils/clipboard.js', () => ({
  copyText: (...args) => copyTextMock(...args),
}));

vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    showToast: vi.fn(),
    showAsyncToast: (promise) => promise,
    logAndToastError: vi.fn(),
  }),
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
const removeItem = vi.fn((id) => {
  displayedItems.value = displayedItems.value.filter((item) => item.id !== id);
});

vi.mock('@/features/cloud-sync/composables/useDriveLoadPageState.js', () => {
  return {
    useDriveLoadPageState: () => ({
      displayedItems,
      isLoadingCache: ref(false),
      isSyncing: ref(false),
      isFetchingMore: ref(false),
      isLoading: computed(() => false),
      isBusy: computed(() => false),
      statusMessage: computed(() => 'status'),
      errorMessage: ref(''),
      initialize,
      revealMore,
      refresh,
      cleanup,
      selectCharacter,
      removeItem,
    }),
  };
});

describe('DriveLoadContent', () => {
  function mountWithProps(props = {}) {
    return mount(DriveLoadContent, {
      props: {
        isSignedIn: true,
        isDriveReady: true,
        ...props,
      },
    });
  }

  beforeEach(() => {
    revealMore.mockClear();
    initialize.mockClear();
    selectCharacter.mockClear();
    hideModalMock.mockClear();
    managerMock.deleteCharacterFile.mockReset();
    enableShareMock.mockReset();
    copyTextMock.mockReset();
    removeItem.mockClear();
    displayedItems.value = [];
  });

  it('shares a file and copies generated link', async () => {
    enableShareMock.mockResolvedValue('https://example.com/share');
    displayedItems.value = [
      { id: 'file-3', fileName: 'Shareable.zip', characterName: 'Shareable', lastModifiedAtDrive: 1500, createdAt: 1400 },
    ];

    const wrapper = mountWithProps();
    await wrapper.find('[data-test="drive-row-share"]').trigger('click');
    await flushPromises();

    expect(enableShareMock).toHaveBeenCalledWith('file-3');
    expect(copyTextMock).toHaveBeenCalledWith('https://example.com/share');
  });

  it('triggers revealMore when the sentinel enters view', async () => {
    mountWithProps();
    observerCallback?.([{ isIntersecting: true }]);
    expect(revealMore).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });

  it('waits for drive readiness before initializing', async () => {
    const wrapper = mountWithProps({ isDriveReady: false });
    await flushPromises();
    expect(initialize).not.toHaveBeenCalled();
    await wrapper.setProps({ isDriveReady: true });
    await flushPromises();
    expect(initialize).toHaveBeenCalled();
  });

  it('loads a character through the load button and closes modal', async () => {
    displayedItems.value = [
      {
        id: 'file-1',
        fileName: 'Hero.zip',
        characterName: 'ロードテスト',
        lastModifiedAtDrive: 1700,
        createdAt: 1600,
      },
    ];
    const wrapper = mountWithProps();
    await wrapper.find('[data-test="drive-row-load"]').trigger('click');
    await flushPromises();
    expect(selectCharacter).toHaveBeenCalledWith('file-1', null);
    expect(hideModalMock).toHaveBeenCalled();
  });

  it('renders character info with timestamps', () => {
    displayedItems.value = [
      {
        id: 'file-2',
        fileName: 'Shared File.zip',
        characterName: 'Shared Hero',
        lastModifiedAtDrive: 2000,
        createdAt: 1900,
      },
    ];

    const wrapper = mountWithProps();
    expect(wrapper.find('[data-test="drive-row-title"]').text()).toBe('Shared Hero');
    const fields = wrapper.findAll('[data-test="drive-row-field"]');
    expect(fields[0].text()).toContain(messages.driveLoadPage.labels.created);
    expect(fields[1].text()).toContain(messages.driveLoadPage.labels.modified);
  });

  it('omits non-zip entries from the rendered list', () => {
    displayedItems.value = [
      { id: 'zip-1', fileName: 'Playable.zip', characterName: 'Playable', lastModifiedAtDrive: 1200, createdAt: 1000 },
      { id: 'legacy', fileName: 'legacy.json', characterName: 'Legacy', lastModifiedAtDrive: 1300, createdAt: 900 },
    ];

    const wrapper = mountWithProps();
    const cards = wrapper.findAll('[data-test="drive-row"]');
    expect(cards).toHaveLength(1);
    expect(cards[0].text()).toContain('Playable');
  });

  it('deletes a file after confirmation', async () => {
    managerMock.deleteCharacterFile.mockResolvedValue();
    displayedItems.value = [
      { id: 'file-5', fileName: 'ToRemove.zip', characterName: 'Remove', lastModifiedAtDrive: 1700, createdAt: 1600 },
    ];

    const wrapper = mountWithProps();
    const deleteButton = wrapper.find('[data-test="drive-row-delete"]');
    await deleteButton.trigger('click');
    await flushPromises();

    expect(wrapper.html()).toContain(messages.driveLoadPage.confirmations.delete('Remove'));

    await wrapper.find('[data-test="drive-row-delete"]').trigger('click');
    await flushPromises();

    expect(managerMock.deleteCharacterFile).toHaveBeenCalledWith('file-5');
  });

  it('removes an item from the DOM after deletion', async () => {
    managerMock.deleteCharacterFile.mockResolvedValue();
    displayedItems.value = [
      { id: 'file-7', fileName: 'ToRemove.zip', characterName: 'Remove', lastModifiedAtDrive: 1700, createdAt: 1600 },
      { id: 'file-8', fileName: 'Keep.zip', characterName: 'Keep', lastModifiedAtDrive: 1500, createdAt: 1400 },
    ];

    const wrapper = mountWithProps();

    await wrapper.find('[data-test="drive-row-delete"]').trigger('click');
    await flushPromises();
    await wrapper.find('[data-test="drive-row-delete"]').trigger('click');
    await flushPromises();

    expect(removeItem).toHaveBeenCalledWith('file-7');
    const items = wrapper.findAll('[data-test="drive-row"]');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain('Keep');
  });
});
