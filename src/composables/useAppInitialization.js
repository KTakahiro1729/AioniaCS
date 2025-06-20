import { useCharacterStore } from "../stores/characterStore.js";
import { useUiStore } from "../stores/uiStore.js";
import { base64ToArrayBuffer } from "../libs/sabalessshare/src/crypto.js";
import { receiveSharedData } from "../libs/sabalessshare/src/index.js";
import { receiveDynamicData } from "../libs/sabalessshare/src/dynamic.js";
import { parseShareUrl } from "../libs/sabalessshare/src/url.js";
import { DriveStorageAdapter } from "../services/driveStorageAdapter.js";
import { useNotifications } from "./useNotifications.js";
import { messages } from "../locales/ja.js";

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function initialize() {
    uiStore.setLoading(true);
    const params = parseShareUrl(window.location);
    if (!params) {
      uiStore.setLoading(false);
      return;
    }
    try {
      let buffer;
      if (params.mode === "dynamic") {
        const adapter = new DriveStorageAdapter(dataManager.googleDriveManager);
        buffer = await receiveDynamicData({
          location: window.location,
          adapter,
          passwordPromptHandler: async () =>
            Promise.resolve(
              window.prompt(messages.ui.prompts.sharedDataPassword) || null,
            ),
        });
      } else {
        buffer = await receiveSharedData({
          location: window.location,
          downloadHandler: async (id) => {
            const text =
              await dataManager.googleDriveManager.loadFileContent(id);
            if (!text) throw new Error("no data");
            const { ciphertext, iv } = JSON.parse(text);
            return {
              ciphertext: base64ToArrayBuffer(ciphertext),
              iv: new Uint8Array(base64ToArrayBuffer(iv)),
            };
          },
          passwordPromptHandler: async () =>
            Promise.resolve(
              window.prompt(messages.ui.prompts.sharedDataPassword) || null,
            ),
        });
      }
      const parsed = JSON.parse(new TextDecoder().decode(buffer));
      Object.assign(characterStore.character, parsed.character);
      characterStore.skills.splice(
        0,
        characterStore.skills.length,
        ...parsed.skills,
      );
      characterStore.specialSkills.splice(
        0,
        characterStore.specialSkills.length,
        ...parsed.specialSkills,
      );
      Object.assign(characterStore.equipments, parsed.equipments);
      characterStore.histories.splice(
        0,
        characterStore.histories.length,
        ...parsed.histories,
      );
      uiStore.isViewingShared = true;
    } catch (err) {
      let key = "general";
      if (err.name === "InvalidLinkError") key = "invalid";
      else if (err.name === "ExpiredLinkError") key = "expired";
      else if (err.name === "PasswordRequiredError") key = "passwordRequired";
      else if (err.name === "DecryptionError") key = "decryptionFailed";
      showToast({ type: "error", ...messages.share.loadError.toast(key) });
      console.error("Error loading shared data:", err);
    } finally {
      uiStore.setLoading(false);
    }
  }

  return { initialize };
}
