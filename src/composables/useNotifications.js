import { useNotificationStore } from '../stores/notificationStore.js';

export function useNotifications() {
  const store = useNotificationStore();

  function showToast(options) {
    return store.addToast(options);
  }

  function showAsyncToast(promise, messages) {
    const id = showToast({
      duration: 0,
      type: 'info',
      ...(messages.loading || {}),
    });
    const finalize = (opts, type) => {
      store.updateToast(id, { duration: 5000, type, ...opts });
    };
    promise
      .then((res) => {
        finalize(messages.success || {}, 'success');
        return res;
      })
      .catch((err) => {
        const errorOpts =
          typeof messages.error === 'function'
            ? messages.error(err)
            : {
                ...(messages.error || {}),
                message: (messages.error && messages.error.message) || err.message,
              };
        finalize(errorOpts, 'error');
      });
    return promise;
  }

  return { showToast, showAsyncToast };
}
