import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';

const addToast = vi.fn();
const updateToast = vi.fn();

vi.mock('@/features/notifications/stores/notificationStore.js', () => ({
  useNotificationStore: () => ({
    addToast,
    updateToast,
  }),
}));

vi.mock('@/i18n/index.js', () => ({
  messages: {
    errors: { unexpected: 'Unexpected error' },
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    let counter = 0;
    addToast.mockClear();
    addToast.mockImplementation(() => `toast-${++counter}`);
    updateToast.mockReset();
  });

  it('resolves function-based toast messages for loading and success states', async () => {
    const { showAsyncToast } = useNotifications();
    const asyncTask = Promise.resolve('done');

    await showAsyncToast(asyncTask, {
      loading: () => ({ title: 'Loading', message: 'Working…' }),
      success: (res) => ({ title: 'Success', message: `Result: ${res}` }),
    });

    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info', message: 'Working…' }));
    expect(updateToast).toHaveBeenCalledWith(
      'toast-1',
      expect.objectContaining({ type: 'success', message: 'Result: done', duration: 1000 }),
    );
  });

  it('logs and updates error toasts when the task fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { showAsyncToast } = useNotifications();
    const failingTask = Promise.reject(new Error('toast boom'));

    await expect(
      showAsyncToast(failingTask, { error: (err) => ({ title: 'Failed', message: err.message }) }, 'toast-context'),
    ).rejects.toThrow('toast boom');

    expect(consoleSpy).toHaveBeenCalledWith('[toast-context]', expect.any(Error));
    expect(updateToast).toHaveBeenCalledWith('toast-1', expect.objectContaining({ type: 'error', message: 'toast boom', duration: 1000 }));

    consoleSpy.mockRestore();
  });
});
