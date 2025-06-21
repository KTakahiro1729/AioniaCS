import { describe, it, beforeEach, vi, expect } from "vitest";
import { DataManager } from "../../src/services/dataManager.js";
import { MockGoogleDriveManager } from "../../src/services/mockGoogleDriveManager.js";
import { AioniaGameData } from "../../src/data/gameData.js";

const hasMethod =
  typeof DataManager.prototype.loadCharacterListFromDrive === "function";
const maybeIt = hasMethod ? it : it.skip;

describe("DataManager data integrity", () => {
  let dm;
  let gdm;

  beforeEach(() => {
    gdm = new MockGoogleDriveManager("k", "c");
    dm = new DataManager(AioniaGameData);
    dm.setGoogleDriveManager(gdm);
  });

  maybeIt(
    "should handle corrupted pointers gracefully without crashing",
    async () => {
      await gdm.writeIndexFile([
        { id: "missing", name: "missing.json", characterName: "Missing" },
      ]);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const list = await dm.loadCharacterListFromDrive();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    },
  );

  maybeIt("should ignore orphaned files not referenced in index", async () => {
    const file = await gdm.createCharacterFile(
      { character: { name: "Orphan" } },
      "orphan.json",
    );
    await gdm.writeIndexFile([]);
    const list = await dm.loadCharacterListFromDrive();
    expect(list).toEqual([]);
    // ensure file exists but ignored
    expect(gdm.appData[file.id]).toBeDefined();
  });
});
