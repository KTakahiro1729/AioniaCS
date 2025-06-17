import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useModalStore = defineStore("modal", {
  state: () => ({
    isVisible: false,
    title: "",
    message: "",
    component: shallowRef(null),
    buttons: [],
    resolvePromise: null,
    rejectPromise: null,
  }),
  actions: {
    showModal(options) {
      return new Promise((resolve, reject) => {
        this.isVisible = true;
        this.title = options.title || "";
        this.message = options.message || "";
        this.component = options.component || null;
        this.buttons = options.buttons || [];
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
      });
    },
    hideModal() {
      this.isVisible = false;
      this.title = "";
      this.message = "";
      this.component = null;
      this.buttons = [];
      this.resolvePromise = null;
      this.rejectPromise = null;
    },
    resolveModal(value) {
      if (this.resolvePromise) {
        this.resolvePromise(value);
      }
      this.hideModal();
    },
  },
});
