import { setActivePinia, createPinia } from "pinia";
import { useGoogleDrive } from "../../../src/composables/useGoogleDrive.js";
import { useCharacterStore } from "../../../src/stores/characterStore.js";
import { useUiStore } from "../../../src/stores/uiStore.js";

describe("useGoogleDrive", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("handleSaveToDriveClick calls saveDataToDrive with store data", async () => {
    const dataManager = {
      saveDataToDrive: jest.fn().mockResolvedValue({ id: "1", name: "c.json" }),
      googleDriveManager: {},
    };

    const { handleSaveToDriveClick } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    uiStore.driveFolderId = "f1";
    uiStore.currentDriveFileId = null;
    uiStore.currentDriveFileName = "c.json";
    charStore.character.name = "Hero";

    await handleSaveToDriveClick();

    expect(dataManager.saveDataToDrive).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      "f1",
      null,
      "c.json",
    );
  });
});
