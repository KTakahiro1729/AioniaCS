import { setActivePinia, createPinia } from "pinia";
import { useGoogleDrive } from "../../../src/composables/useGoogleDrive.js";
import { useCharacterStore } from "../../../src/stores/characterStore.js";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("useGoogleDrive", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("handleSaveToDriveClick calls saveDataToAppData with store data", async () => {
    const dataManager = {
      saveDataToAppData: jest
        .fn()
        .mockResolvedValue({ id: "1", name: "c.json" }),
      googleDriveManager: {},
    };

    const { handleSaveToDriveClick } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    uiStore.currentDriveFileId = null;
    uiStore.currentDriveFileName = "c";
    charStore.character.name = "Hero";

    await handleSaveToDriveClick();

    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      null,
      "c",
    );
  });
});
