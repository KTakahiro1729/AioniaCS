/* @vitest-environment jsdom */
import { flushPromises, mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DriveLoadPage from '@/features/cloud-sync/pages/DriveLoadPage.vue';
import { messages } from '@/i18n/index.js';

const managerMock = {
  deleteCharacterFile: vi.fn(),
  ensureFilePublic: vi.fn(),
  loadFileContent: vi.fn(),
};

const pushMock = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
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
    managerMock.deleteCharacterFile.mockReset();
    managerMock.ensureFilePublic.mockReset();
    managerMock.loadFileContent.mockReset();
    copyTextMock.mockReset();
    displayedItems.value = [];
  });

  it('triggers revealMore when the sentinel enters view', async () => {
    mount(DriveLoadPage);
    observerCallback?.([{ isIntersecting: true }]);
    expect(revealMore).toHaveBeenCalled();
    expect(initialize).toHaveBeenCalled();
  });

  it('loads a character through the load button without card click', async () => {
    displayedItems.value = [
      {
        id: 'file-1',
        fileName: 'Hero.zip',
        lastModifiedAtDrive: 1700,
        createdAt: 1600,
      },
    ];
    const wrapper = mount(DriveLoadPage);
    await wrapper.find('[data-test="drive-card-load"]').trigger('click');
    expect(selectCharacter).toHaveBeenCalledWith('file-1');
    expect(pushMock).toHaveBeenCalledWith({ name: 'character-sheet' });
  });

  it('renders character info from file name with timestamps and warnings', () => {
    displayedItems.value = [
      {
        id: 'file-2',
        fileName: 'Shared File.zip',
        lastModifiedAtDrive: 2000,
        createdAt: 1900,
        shared: true,
        outOfSync: true,
      },
    ];

    const wrapper = mount(DriveLoadPage);
    expect(wrapper.find('[data-test="drive-card-title"]').text()).toContain('Shared File');
    const fields = wrapper.findAll('[data-test="drive-card-field"]');
    expect(fields[0].text()).toContain(messages.driveLoadPage.labels.created);
    expect(fields[1].text()).toContain(messages.driveLoadPage.labels.modified);
    expect(wrapper.find('[data-test="drive-card-warning"]').text()).toBe(messages.driveLoadPage.labels.hashWarning);
  });

  it('omits non-zip entries from the rendered list', () => {
    displayedItems.value = [
      { id: 'zip-1', fileName: 'Playable.zip', lastModifiedAtDrive: 1200, createdAt: 1000 },
      { id: 'legacy', fileName: 'legacy.json', lastModifiedAtDrive: 1300, createdAt: 900 },
    ];

    const wrapper = mount(DriveLoadPage);
    const cards = wrapper.findAll('[data-test="drive-card"]');
    expect(cards).toHaveLength(1);
    expect(cards[0].text()).toContain('Playable');
  });

  it('shares a file through the share button and copies the link', async () => {
    managerMock.ensureFilePublic.mockResolvedValue('https://example.com/share');
    displayedItems.value = [{ id: 'file-3', fileName: 'Shareable.zip', lastModifiedAtDrive: 1500, createdAt: 1400 }];

    const wrapper = mount(DriveLoadPage);
    await wrapper.find('[data-test="drive-card-share"]').trigger('click');
    await flushPromises();

    expect(managerMock.ensureFilePublic).toHaveBeenCalledWith('file-3');
    expect(copyTextMock).toHaveBeenCalledWith('https://example.com/share');
  });

  it('downloads a file with a readable filename', async () => {
    const content = new Uint8Array([1, 2, 3]).buffer;
    managerMock.loadFileContent.mockResolvedValue(content);
    const createObjectURLSpy = vi.fn(() => 'blob:url');
    const revokeSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = revokeSpy;

    displayedItems.value = [{ id: 'file-4', fileName: 'Archive.zip', lastModifiedAtDrive: 1600, createdAt: 1500 }];

    const wrapper = mount(DriveLoadPage);
    await wrapper.find('[data-test="drive-card-download"]').trigger('click');
    await flushPromises();

    expect(managerMock.loadFileContent).toHaveBeenCalledWith('file-4');
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeSpy).toHaveBeenCalledWith('blob:url');
  });

  it('deletes a file after confirmation', async () => {
    managerMock.deleteCharacterFile.mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    displayedItems.value = [{ id: 'file-5', fileName: 'ToRemove.zip', lastModifiedAtDrive: 1700, createdAt: 1600 }];

    const wrapper = mount(DriveLoadPage);
    await wrapper.find('[data-test="drive-card-delete"]').trigger('click');
    await flushPromises();

    expect(window.confirm).toHaveBeenCalled();
    expect(managerMock.deleteCharacterFile).toHaveBeenCalledWith('file-5');
  });
});
