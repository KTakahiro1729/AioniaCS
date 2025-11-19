import { useNotificationStore } from '../stores/notificationStore.js';
import { messages } from '@/locales/ja.js';

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object') {
    const normalized = new Error(error.message || messages.errors.unexpected);
    Object.assign(normalized, error);
    return normalized;
  }

  return new Error(messages.errors.unexpected);
}

function resolveToastOptions(source, error) {
  if (typeof source === 'function') {
    return source(error);
  }

  if (source && typeof source === 'object') {
    if (!source.message && error?.message) {
      return { ...source, message: error.message };
    }
    return source;
  }

  return { message: error?.message || '' };
}

export function useNotifications() {
  const store = useNotificationStore();

  function showToast(options) {
    return store.addToast(options);
  }

  function logError(error, context = 'notification') {
    const normalized = normalizeError(error);
    const label = context ? `[${context}]` : '[notification]';
    console.error(label, normalized);
    return normalized;
  }

  function logAndToastError(error, toastOptions, context) {
    const normalized = logError(error, context);
    const resolved = resolveToastOptions(toastOptions, normalized);
    return showToast({ type: 'error', ...resolved });
  }

  function showAsyncToast(promise, messages, context = 'async-toast') {
    const id = showToast({
      duration: 0,
      type: 'info',
      ...(messages.loading || {}),
    });

    const finalize = (opts, type) => {
      const duration = opts.duration === undefined ? 1000 : opts.duration;
      store.updateToast(id, { duration, type, ...opts });
    };

    promise
      .then((res) => {
        finalize(messages.success || {}, 'success');
        return res;
      })
      .catch((err) => {
        const normalized = logError(err, context);
        const errorOpts = resolveToastOptions(messages.error, normalized);
        finalize(errorOpts, 'error');
      });

    return promise;
  }

  return { showToast, showAsyncToast, logAndToastError };
}
