(function (global) {
  function useDataExport() {
    return global.CocofoliaExporter ? new global.CocofoliaExporter() : null;
  }
  global.useDataExport = useDataExport;
})(typeof window !== "undefined" ? window : globalThis);
