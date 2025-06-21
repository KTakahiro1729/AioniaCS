import { setActivePinia, createPinia } from "pinia";
import { useAppInitialization } from "../../../src/composables/useAppInitialization.js";
import { useUiStore } from "../../../src/stores/uiStore.js";
import { vi } from "vitest";

describe("useAppInitialization", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  test("runs integrity check once on sign in", async () => {
    const uiStore = useUiStore();
    const fn = vi.fn();
    useAppInitialization({}, fn); // watchers registered
    uiStore.isSignedIn = true;
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
    uiStore.isSignedIn = false;
    uiStore.isSignedIn = true;
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
