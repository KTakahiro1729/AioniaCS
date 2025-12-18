import { describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';
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
  it('loads cached metadata immediately and starts drive sync', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ items: [{ file_id: '1', file_name: 'Cached', last_modified_at_drive: 1000 }] }))
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi.fn().mockResolvedValue({
      files: [
        {
          id: '2',
          name: 'Drive',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          appProperties: { character_name: 'Drive', last_app_hash: 'hash' },
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
    expect(state.displayedItems.value[0].fileName).toBe('Cached');
    await nextTick();
    expect(requestDrivePage).toHaveBeenCalledWith({ pageSize: 20, pageToken: null, abortSignal: null });

    scope.stop();
  });

  it('prefetches the next page when the visible buffer is low', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ items: [{ file_id: '1', file_name: 'Cached', last_modified_at_drive: 1000 }] }))
      .mockResolvedValue(createResponse({ items: [] }));

    const requestDrivePage = vi
      .fn()
      .mockResolvedValueOnce({
        files: Array.from({ length: 2 }).map((_, idx) => ({ id: `${idx + 1}`, name: `Drive ${idx + 1}` })),
        nextPageToken: 'next-token',
      })
      .mockResolvedValueOnce({
        files: [{ id: '3', name: 'More Data' }],
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
});
