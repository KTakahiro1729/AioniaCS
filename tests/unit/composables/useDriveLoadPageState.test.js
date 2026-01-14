import { describe, expect, it, vi, beforeEach } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useDriveLoadPageState } from '@/features/cloud-sync/composables/useDriveLoadPageState.js';

vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    logAndToastError: vi.fn(),
  }),
}));

describe('useDriveLoadPageState', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads drive entries and strips zip extension for character names', async () => {
    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        {
          id: '2',
          name: 'Drive.zip',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          createdTime: '2023-12-31T00:00:00.000Z',
          mimeType: 'application/zip',
          thumbnailLink: 'https://example.com/thumb',
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
      state = useDriveLoadPageState({ requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();

    expect(state.displayedItems.value[0].fileName).toBe('Drive.zip');
    expect(state.displayedItems.value[0].characterName).toBe('Drive');
    expect(state.displayedItems.value[0].thumbnailLink).toBe('https://example.com/thumb');
    expect(requestDrivePage).toHaveBeenCalledWith({ pageSize: 20, pageToken: null, abortSignal: expect.any(AbortSignal) });
    expect(requestDrivePage).toHaveBeenCalledWith({ pageSize: 10, pageToken: 'next', abortSignal: expect.any(AbortSignal) });

    scope.stop();
  });

  it('prefetches the next page when the visible buffer is low', async () => {
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
      state = useDriveLoadPageState({ requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await state.revealMore();
    expect(requestDrivePage).toHaveBeenCalledTimes(2);

    scope.stop();
  });

  it('ignores non-zip entries from drive responses', async () => {
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
      state = useDriveLoadPageState({ requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state.displayedItems.value).toHaveLength(1);
    expect(state.displayedItems.value[0].fileName).toBe('Valid.zip');

    scope.stop();
  });

  it('removes items from the cache and public list when removeItem is called', async () => {
    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        { id: 'remove-1', name: 'Keep.zip', mimeType: 'application/zip' },
        { id: 'remove-2', name: 'Delete.zip', mimeType: 'application/zip' },
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
      state = useDriveLoadPageState({ requestDrivePage, driveManager });
    });

    await state.initialize();
    await nextTick();

    expect(state.displayedItems.value).toHaveLength(2);

    state.removeItem('remove-2');
    await nextTick();

    expect(state.displayedItems.value).toHaveLength(1);
    expect(state.displayedItems.value[0].id).toBe('remove-1');

    state.removeItem('missing');
    await nextTick();

    expect(state.displayedItems.value).toHaveLength(1);

    scope.stop();
  });
});
