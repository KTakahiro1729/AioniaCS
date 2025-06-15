import { setActivePinia, createPinia } from "pinia";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("uiStore character cache", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("refreshDriveCharacters loads from manager", async () => {
    const store = useUiStore();
    const gdm = { readIndexFile: jest.fn().mockResolvedValue([{ id: "1" }]) };
    await store.refreshDriveCharacters(gdm);
    expect(store.driveCharacters).toEqual([{ id: "1" }]);
  });

  test("clearDriveCharacters empties cache", () => {
    const store = useUiStore();
    store.driveCharacters = [{ id: "1" }];
    store.clearDriveCharacters();
    expect(store.driveCharacters).toEqual([]);
  });
});
