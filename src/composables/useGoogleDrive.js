(function (global) {
  function useGoogleDrive() {
    return global.GoogleDriveManager ? new global.GoogleDriveManager() : null;
  }
  global.useGoogleDrive = useGoogleDrive;
})(typeof window !== "undefined" ? window : globalThis);
