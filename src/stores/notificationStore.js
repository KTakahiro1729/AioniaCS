import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    toasts: [],
    modal: {
      isVisible: false,
      title: "",
      message: "",
      buttons: [],
      type: "",
      resolve: null,
    },
  }),
  actions: {
    addToast({ title = "", message = "", type = "info", duration = 5000 }) {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, title, message, type });
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
      return id;
    },
    removeToast(id) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },
    showModal({
      title = "",
      message = "",
      buttons = [{ label: "OK", value: "ok", variant: "primary" }],
      type = "",
    } = {}) {
      return new Promise((resolve) => {
        this.modal = {
          isVisible: true,
          title,
          message,
          buttons,
          type,
          resolve,
        };
      });
    },
    hideModal(result) {
      if (this.modal.resolve) {
        this.modal.resolve(result);
      }
      this.modal = {
        isVisible: false,
        title: "",
        message: "",
        buttons: [],
        type: "",
        resolve: null,
      };
    },
  },
});
