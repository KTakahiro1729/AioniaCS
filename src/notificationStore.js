(function (global) {
  const notificationStore = {
    showSuccess(message) {
      const toast = document.createElement("div");
      toast.className = "toast toast--success";
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    },
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = notificationStore;
  } else {
    global.notificationStore = notificationStore;
  }
})(typeof window !== "undefined" ? window : global);
