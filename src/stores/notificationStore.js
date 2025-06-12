import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    toasts: [],
    modal: {
      isVisible: false,
      title: "",
      message: "",
      component: shallowRef(null),
      buttons: [],
      resolvePromise: null,
      rejectPromise: null,
    },
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
    removeToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
    showModal(options) {
      return new Promise((resolve, reject) => {
        this.modal.isVisible = true;
        this.modal.title = options.title || "";
        this.modal.message = options.message || "";
        this.modal.component = options.component || null;
        this.modal.buttons = options.buttons || [];
        this.modal.resolvePromise = resolve;
        this.modal.rejectPromise = reject;
      });
    },
    hideModal() {
      this.modal.isVisible = false;
      this.modal.title = "";
      this.modal.message = "";
      this.modal.component = null;
      this.modal.buttons = [];
      this.modal.resolvePromise = null;
      this.modal.rejectPromise = null;
    },
    resolveModal(value) {
      if (this.modal.resolvePromise) {
        this.modal.resolvePromise(value);
      }
      this.hideModal();
    },
  },
});
