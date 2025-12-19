import { describe, expect, it, vi, beforeEach } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useDriveLoadPageState } from '@/features/cloud-sync/composables/useDriveLoadPageState.js';

vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    logAndToastError: vi.fn(),
  }),
}));

function createResponse(body) {
  return {
    ok: true,
    json: async () => body,
  };
}

describe('useDriveLoadPageState', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads cached metadata immediately and starts drive sync', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({ items: [{ file_id: '1', file_name: 'Cached.zip', last_modified_at_drive: 1000, createdTime: 900 }] }),
      )
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        {
          id: '2',
          name: 'Drive.zip',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          createdTime: '2023-12-31T00:00:00.000Z',
          appProperties: { character_name: 'Drive', last_app_hash: 'hash' },
          mimeType: 'application/zip',
        },
      ],
      nextPageToken: 'next',
    });

    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    let state;
    scope.run(() => {
      state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
    });

    await state.initialize();
    expect(state.displayedItems.value[0].fileName).toBe('Cached.zip');
    expect(state.displayedItems.value[0].characterName).toBe('Cached');
    await nextTick();
    expect(requestDrivePage).toHaveBeenCalledWith({ pageSize: 20, pageToken: null, abortSignal: null });

    scope.stop();
  });

  it('prefetches the next page when the visible buffer is low', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ items: [{ file_id: '1', file_name: 'Cached.zip', last_modified_at_drive: 1000 }] }))
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi
      .fn()
      .mockResolvedValueOnce({
        files: Array.from({ length: 2 }).map((_, idx) => ({ id: `${idx + 1}`, name: `Drive-${idx + 1}.zip`, mimeType: 'application/zip' })),
        nextPageToken: 'next-token',
      })
      .mockResolvedValueOnce({
        files: [{ id: '3', name: 'More-Data.zip', mimeType: 'application/zip' }],
        nextPageToken: null,
      });

    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    let state;
    scope.run(() => {
      state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await state.revealMore();
    expect(requestDrivePage).toHaveBeenCalledTimes(2);

    scope.stop();
  });

  it('ignores non-zip entries from cache and drive responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ items: [{ file_id: '1', file_name: 'legacy.json', last_modified_at_drive: 800 }] }))
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        { id: '2', name: 'Valid.zip', mimeType: 'application/zip' },
        { id: '3', name: 'Ignore.me', mimeType: 'text/plain' },
      ],
      nextPageToken: null,
    });

    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    let state;
    scope.run(() => {
      state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state.displayedItems.value).toHaveLength(1);
    expect(state.displayedItems.value[0].fileName).toBe('Valid.zip');

    scope.stop();
  });

  it('cleans up missing files on 404 errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ items: [{ file_id: '1', file_name: 'Cached.zip', last_modified_at_drive: 1000 }] }))
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi.fn().mockRejectedValue({ status: 404, fileId: '1' });

    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    scope.run(() => {
      const state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
      state.initialize();
    });

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.files).toEqual([]);

    scope.stop();
  });

  it('marks entries as out of sync when hashes differ', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({ items: [{ file_id: '1', file_name: 'Cached.zip', content_hash: 'cache-hash', last_modified_at_drive: 1000 }] }),
      )
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        {
          id: '1',
          name: 'Drive.zip',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          appProperties: { last_app_hash: 'drive-hash', character_name: 'Drive' },
          shared: true,
          mimeType: 'application/zip',
        },
      ],
      nextPageToken: null,
    });

    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    let state;
    scope.run(() => {
      state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state.displayedItems.value[0].driveHash).toBe('drive-hash');
    expect(state.displayedItems.value[0].cachedHash).toBe('cache-hash');
    expect(state.displayedItems.value[0].outOfSync).toBe(true);
    expect(state.displayedItems.value[0].shared).toBe(true);

    scope.stop();
  });

  it('detects newer drive modifications even when hashes match', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({ items: [{ file_id: '1', file_name: 'Cached.zip', content_hash: 'match', last_modified_at_drive: 1000 }] }),
      )
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        {
          id: '1',
          name: 'Drive.zip',
          modifiedTime: '1970-01-01T00:20:00.000Z',
          appProperties: { last_app_hash: 'match', character_name: 'Drive' },
          mimeType: 'application/zip',
        },
      ],
      nextPageToken: null,
    });

    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    let state;
    scope.run(() => {
      state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state.displayedItems.value[0].outOfSync).toBe(true);
    expect(state.displayedItems.value[0].lastModifiedAtDrive).toBe(1200);

    scope.stop();
  });

  it('stores the selected file id in the ui store', () => {
    const fetchMock = vi.fn().mockResolvedValue(createResponse({ items: [] }));
    const requestDrivePage = vi.fn().mockResolvedValue({ files: [], nextPageToken: null });
    const driveManager = {
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder'),
      ensureAccessToken: vi.fn(),
    };

    const scope = effectScope();
    let state;
    scope.run(() => {
      state = useDriveLoadPageState({ fetchImpl: fetchMock, requestDrivePage, driveManager });
    });

    const uiStore = useUiStore();
    state.selectCharacter('abc');
    expect(uiStore.currentDriveFileId).toBe('abc');

    scope.stop();
  });
});
