import { setActivePinia, createPinia } from "pinia";
import { useUiStore } from "../../../src/stores/uiStore.js";
import { useCharacterStore } from "../../../src/stores/characterStore.js";
import { jest } from "@jest/globals";

jest.mock("../../../src/stores/characterStore.js");

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("uiStore getters", () => {
  test("experienceStatusClass indicates over limit", () => {
    useCharacterStore.mockReturnValue({
      currentExperiencePoints: 150,
      maxExperiencePoints: 100,
    });
    const store = useUiStore();
    expect(store.experienceStatusClass).toBe("status-display--experience-over");
  });

  test("experienceStatusClass indicates within limit", () => {
    useCharacterStore.mockReturnValue({
      currentExperiencePoints: 50,
      maxExperiencePoints: 100,
    });
    const store = useUiStore();
    expect(store.experienceStatusClass).toBe("status-display--experience-ok");
  });

  test("canSignInToGoogle checks initialization and sign-in", () => {
    useCharacterStore.mockReturnValue({});
    const store = useUiStore();
    store.isGapiInitialized = true;
    store.isGisInitialized = true;
    store.isSignedIn = false;
    expect(store.canSignInToGoogle).toBe(true);
    store.isSignedIn = true;
    expect(store.canSignInToGoogle).toBe(false);
  });

  test("canOperateDrive checks drive readiness", () => {
    useCharacterStore.mockReturnValue({});
    const store = useUiStore();
    store.isSignedIn = true;
    store.driveFolderId = "foo";
    expect(store.canOperateDrive).toBe("foo");
    store.driveFolderId = null;
    expect(store.canOperateDrive).toBe(null);
  });
});
