import { setActivePinia, createPinia } from "pinia";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("uiStore settings", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  test("setDefaultSaveToCloud persists value", () => {
    const store = useUiStore();
    store.setDefaultSaveToCloud(true);
    expect(store.defaultSaveToCloud).toBe(true);
    expect(localStorage.getItem("aioniaDefaultSaveToCloud")).toBe("true");
  });

  test("initializes defaultSaveToCloud from storage", () => {
    localStorage.setItem("aioniaDefaultSaveToCloud", "true");
    const store = useUiStore();
    expect(store.defaultSaveToCloud).toBe(true);
  });
});
