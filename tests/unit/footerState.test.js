import { getFooterState } from "../../src/composables/useFooterState.js";

describe("getFooterState", () => {
  test("not signed in returns local actions", () => {
    const state = getFooterState(false, false);
    expect(state).toEqual({
      saveMain: "localSave",
      saveAlt: null,
      loadMain: "localLoad",
      loadAlt: null,
    });
  });

  test("cloud default when signed in", () => {
    const state = getFooterState(true, true);
    expect(state).toEqual({
      saveMain: "cloudSave",
      saveAlt: "localSave",
      loadMain: "openHub",
      loadAlt: "localLoad",
    });
  });

  test("local default when signed in", () => {
    const state = getFooterState(true, false);
    expect(state).toEqual({
      saveMain: "localSave",
      saveAlt: "cloudSave",
      loadMain: "localLoad",
      loadAlt: "openHub",
    });
  });
});
