import { DataManager } from "../../src/services/dataManager.js";
import { AioniaGameData } from "../../src/data/gameData.js";

describe("parseLoadedData edge cases", () => {
  const dm = new DataManager(AioniaGameData);

  test("keeps null and empty strings for numeric fields", () => {
    const raw = {
      character: { age: "", initialScar: "", currentScar: "" },
    };
    const parsed = dm.parseLoadedData(raw);
    expect(parsed.character.age).toBe("");
    expect(parsed.character.initialScar).toBe("");
    expect(parsed.character.currentScar).toBe("");
  });

  test("missing numeric fields use defaults without coercion", () => {
    const raw = { character: {} };
    const parsed = dm.parseLoadedData(raw);
    expect(parsed.character.age).toBeNull();
    expect(parsed.character.initialScar).toBe(0);
    expect(parsed.character.currentScar).toBe(0);
  });

  test("null numeric fields remain null", () => {
    const raw = {
      character: { age: null, initialScar: null, currentScar: null },
    };
    const parsed = dm.parseLoadedData(raw);
    expect(parsed.character.age).toBeNull();
    expect(parsed.character.initialScar).toBeNull();
    expect(parsed.character.currentScar).toBeNull();
  });
});
