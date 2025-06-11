import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
  }),
  actions: {
    addNotification(notification) {
      const id = Date.now() + Math.random();
      const duration = notification.duration || 5000;
      const timeoutId = setTimeout(() => {
        this.removeNotification(id);
      }, duration);
      this.notifications.push({ id, timeoutId, ...notification });
      return id;
    },
    removeNotification(id) {
      const index = this.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        clearTimeout(this.notifications[index].timeoutId);
        this.notifications.splice(index, 1);
      }
    },
  },
});
