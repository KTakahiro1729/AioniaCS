import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useModalStore = defineStore("modal", {
  state: () => ({
    isVisible: false,
    title: "",
    message: "",
    component: shallowRef(null),
    props: {},
    buttons: [],
    events: {},
    globalActions: null,
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
        this.props = options.props || {};
        this.buttons = options.buttons || [];
        this.events = options.on || {};
        this.globalActions = options.globalActions || null;
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
      });
    },
    hideModal() {
      this.isVisible = false;
      this.title = "";
      this.message = "";
      this.component = null;
      this.props = {};
      this.buttons = [];
      this.events = {};
      this.globalActions = null;
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
