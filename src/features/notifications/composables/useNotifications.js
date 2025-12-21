import { useNotificationStore } from '../stores/notificationStore.js';
import { messages } from '@/i18n/index.js';

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
    const loadingOptions = resolveToastOptions(messages?.loading);
    const id = showToast({
      duration: 0,
      type: 'info',
      ...loadingOptions,
    });

    const finalize = (opts, type) => {
      const normalized = opts || {};
      const duration = normalized.duration === undefined ? 1000 : normalized.duration;
      store.updateToast(id, { duration, type, ...normalized });
    };

    const managedPromise = promise
      .then((res) => {
        const successOptions = resolveToastOptions(messages?.success, res);
        finalize(successOptions, 'success');
        return res;
      })
      .catch((err) => {
        const normalized = logError(err, context);
        const errorOpts = resolveToastOptions(messages?.error, normalized);
        finalize(errorOpts, 'error');
        throw normalized;
      });

    return managedPromise;
  }

  return { showToast, showAsyncToast, logAndToastError };
}
