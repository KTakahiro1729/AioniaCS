/* @vitest-environment jsdom */
import { flushPromises, mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DriveLoadContent from '@/features/modals/components/contents/DriveLoadContent.vue';
import { messages } from '@/i18n/index.js';

const managerMock = {
  deleteCharacterFile: vi.fn(),
  ensureFilePublic: vi.fn(),
  loadFileContent: vi.fn(),
};

const hideModalMock = vi.fn();
const enableShareMock = vi.fn();
const disableShareMock = vi.fn();

vi.mock('@/features/modals/stores/modalStore.js', () => ({
  useModalStore: () => ({
    hideModal: hideModalMock,
  }),
}));

vi.mock('@/features/cloud-sync/composables/useShare.js', () => ({
  useShare: () => ({
    enableShare: enableShareMock,
    disableShare: disableShareMock,
  }),
}));

vi.mock('@/infrastructure/google-drive/googleDriveManager.js', () => ({
  getGoogleDriveManagerInstance: () => managerMock,
}));

const copyTextMock = vi.fn();

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

global.URL.createObjectURL = (blob) => `blob:${blob.size}`;
global.URL.revokeObjectURL = vi.fn();

const displayedItems = ref([]);
const revealMore = vi.fn();
const initialize = vi.fn();
const refresh = vi.fn();
const cleanup = vi.fn();
const selectCharacter = vi.fn();
const syncItemMetadata = vi.fn().mockResolvedValue({ payload: null, syncItems: [] });

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
      syncItemMetadata,
    }),
  };
});

describe('DriveLoadContent', () => {
  beforeEach(() => {
    revealMore.mockClear();
    initialize.mockClear();
    selectCharacter.mockClear();
    syncItemMetadata.mockClear();
    syncItemMetadata.mockResolvedValue();
    hideModalMock.mockClear();
    managerMock.deleteCharacterFile.mockReset();
    managerMock.ensureFilePublic.mockReset();
    managerMock.loadFileContent.mockReset();
    enableShareMock.mockReset();
    disableShareMock.mockReset();
    copyTextMock.mockReset();
    displayedItems.value = [];
  });

  it('triggers revealMore when the sentinel enters view', async () => {
    mount(DriveLoadContent);
    observerCallback?.([{ isIntersecting: true }]);
    expect(revealMore).toHaveBeenCalled();
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
    const wrapper = mount(DriveLoadContent);
    await wrapper.find('[data-test="drive-row-load"]').trigger('click');
    await flushPromises();
    expect(selectCharacter).toHaveBeenCalledWith('file-1', null);
    expect(hideModalMock).toHaveBeenCalled();
  });

  it('syncs metadata for out-of-sync items without blocking load', async () => {
    displayedItems.value = [
      {
        id: 'file-sync',
        fileName: 'Hero.zip',
        characterName: 'ロードテスト',
        lastModifiedAtDrive: 1700,
        createdAt: 1600,
        outOfSync: true,
      },
    ];
    syncItemMetadata.mockResolvedValue({
      payload: { character: { name: 'Synced' }, skills: [], specialSkills: [], equipments: {}, histories: [] },
    });

    const wrapper = mount(DriveLoadContent);
    await wrapper.find('[data-test="drive-row-load"]').trigger('click');
    await flushPromises();

    expect(syncItemMetadata).toHaveBeenCalledWith('file-sync');
    expect(selectCharacter).toHaveBeenCalledWith('file-sync', {
      character: { name: 'Synced' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    });
    expect(hideModalMock).toHaveBeenCalled();
  });

  it('renders character info with timestamps and warnings', () => {
    displayedItems.value = [
      {
        id: 'file-2',
        fileName: 'Shared File.zip',
        characterName: 'Shared Hero',
        lastModifiedAtDrive: 2000,
        createdAt: 1900,
        shared: true,
        outOfSync: true,
      },
    ];

    const wrapper = mount(DriveLoadContent);
    expect(wrapper.find('[data-test="drive-row-title"]').text()).toBe('Shared Hero');
    const fields = wrapper.findAll('[data-test="drive-row-field"]');
    expect(fields[0].text()).toContain(messages.driveLoadPage.labels.created);
    expect(fields[1].text()).toContain(messages.driveLoadPage.labels.modified);
    const warning = wrapper.find('[data-test="drive-row-warning"]');
    expect(warning.text()).toBe('▲');
    expect(warning.attributes('title')).toBe(messages.driveLoadPage.labels.hashWarning);
  });

  it('omits non-zip entries from the rendered list', () => {
    displayedItems.value = [
      { id: 'zip-1', fileName: 'Playable.zip', characterName: 'Playable', lastModifiedAtDrive: 1200, createdAt: 1000 },
      { id: 'legacy', fileName: 'legacy.json', characterName: 'Legacy', lastModifiedAtDrive: 1300, createdAt: 900 },
    ];

    const wrapper = mount(DriveLoadContent);
    const cards = wrapper.findAll('[data-test="drive-row"]');
    expect(cards).toHaveLength(1);
    expect(cards[0].text()).toContain('Playable');
  });

  it('shares a file through the share button and copies the link', async () => {
    enableShareMock.mockResolvedValue('https://example.com/share');
    displayedItems.value = [
      { id: 'file-3', fileName: 'Shareable.zip', characterName: 'Shareable', lastModifiedAtDrive: 1500, createdAt: 1400 },
    ];

    const wrapper = mount(DriveLoadContent);
    await wrapper.find('[data-test="drive-row-share"]').trigger('click');
    await flushPromises();

    expect(enableShareMock).toHaveBeenCalledWith('file-3');
    expect(copyTextMock).toHaveBeenCalledWith('https://example.com/share');
  });

  it('downloads a file with a readable filename', async () => {
    const content = new Uint8Array([1, 2, 3]).buffer;
    managerMock.loadFileContent.mockResolvedValue(content);

    displayedItems.value = [
      { id: 'file-4', fileName: 'Archive.zip', characterName: 'Archive', lastModifiedAtDrive: 1600, createdAt: 1500 },
    ];

    const wrapper = mount(DriveLoadContent);
    await wrapper.find('[data-test="drive-row-download"]').trigger('click');
    await flushPromises();

    expect(managerMock.loadFileContent).toHaveBeenCalledWith('file-4');
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('deletes a file after confirmation', async () => {
    managerMock.deleteCharacterFile.mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    displayedItems.value = [
      { id: 'file-5', fileName: 'ToRemove.zip', characterName: 'Remove', lastModifiedAtDrive: 1700, createdAt: 1600 },
    ];

    const wrapper = mount(DriveLoadContent);
    await wrapper.find('[data-test="drive-row-delete"]').trigger('click');
    await flushPromises();

    expect(window.confirm).toHaveBeenCalled();
    expect(managerMock.deleteCharacterFile).toHaveBeenCalledWith('file-5');
  });

  it('unshares a file when confirmed', async () => {
    disableShareMock.mockResolvedValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    displayedItems.value = [
      { id: 'file-6', fileName: 'Shared.zip', characterName: 'Shared', shared: true, lastModifiedAtDrive: 1800, createdAt: 1750 },
    ];

    const wrapper = mount(DriveLoadContent);
    await wrapper.find('[data-test="drive-row-unshare"]').trigger('click');
    await flushPromises();

    expect(disableShareMock).toHaveBeenCalledWith('file-6');
    expect(refresh).toHaveBeenCalled();
  });
});
