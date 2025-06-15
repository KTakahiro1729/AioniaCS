import { setActivePinia, createPinia } from "pinia";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("uiStore hub visibility", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("openHub sets visibility true", () => {
    const store = useUiStore();
    store.openHub();
    expect(store.isHubVisible).toBe(true);
  });

  test("closeHub sets visibility false", () => {
    const store = useUiStore();
    store.isHubVisible = true;
    store.closeHub();
    expect(store.isHubVisible).toBe(false);
  });
});
