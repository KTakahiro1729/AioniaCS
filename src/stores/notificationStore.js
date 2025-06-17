import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    toasts: [],
  }),
  actions: {
    addToast(options) {
      const id = Date.now() + Math.random();
      const toast = { id, duration: 5000, type: "info", ...options };
      this.toasts.push(toast);
      if (toast.duration > 0) {
        setTimeout(() => {
          this.removeToast(id);
        }, toast.duration);
      }
      return id;
    },
    updateToast(id, options) {
      const idx = this.toasts.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const toast = this.toasts[idx];
      Object.assign(toast, options);
      if (options.duration > 0) {
        setTimeout(() => {
          this.removeToast(id);
        }, options.duration);
      }
    },
    removeToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
  },
});
