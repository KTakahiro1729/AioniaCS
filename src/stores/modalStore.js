import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export const useModalStore = defineStore('modal', {
  state: () => ({
    isVisible: false,
    currentModal: null,
    modalStyles: {},
    resolvePromise: null,
  }),
  actions: {
    showModal(options = {}) {
      return new Promise((resolve) => {
        const { component, headerActions, styles, buttons = [], props = {}, on = {}, ...rest } = options;

        const componentRef = shallowRef(component ?? null);
        const headerActionsRef = headerActions !== undefined && headerActions !== null ? shallowRef(headerActions) : null;

        this.currentModal = {
          ...rest,
          component: componentRef,
          headerActions: headerActionsRef,
          buttons,
          props,
          on,
        };

        this.modalStyles = styles || {};
        this.isVisible = true;
        this.resolvePromise = resolve;
      });
    },
    hideModal() {
      if (this.resolvePromise) {
        this.resolvePromise({ value: 'close' });
        this.resolvePromise = null;
      }
      this.isVisible = false;
      this.currentModal = null;
      this.modalStyles = {};
    },
    resolveModal(value) {
      if (this.resolvePromise) {
        this.resolvePromise(value);
        this.resolvePromise = null;
      }
      this.isVisible = false;
      this.currentModal = null;
      this.modalStyles = {};
    },
  },
});
