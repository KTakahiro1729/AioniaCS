import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { base64ToArrayBuffer } from '../libs/sabalessshare/src/crypto.js';
import { receiveSharedData } from '../libs/sabalessshare/src/index.js';
import { receiveDynamicData } from '../libs/sabalessshare/src/dynamic.js';
import { parseShareUrl } from '../libs/sabalessshare/src/url.js';
import { DriveStorageAdapter } from '../services/driveStorageAdapter.js';
import { useNotifications } from './useNotifications.js';
import { useModal } from './useModal.js';
import PasswordPromptModal from '../components/modals/contents/PasswordPromptModal.vue';
import { messages } from '../locales/ja.js';

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();
  const { showModal } = useModal();

  async function initialize() {
    uiStore.setLoading(true);
    const params = parseShareUrl(window.location);
    if (!params) {
      uiStore.setLoading(false);
      return;
    }
    try {
      let buffer;
      if (params.mode === 'dynamic') {
        const adapter = new DriveStorageAdapter(dataManager.googleDriveManager);
        async function promptPassword() {
          const result = await showModal({
            component: PasswordPromptModal,
            title: messages.ui.prompts.sharedDataPassword,
            buttons: [
              { label: 'OK', value: 'ok', variant: 'primary' },
              {
                label: messages.ui.modal.cancel,
                value: 'cancel',
                variant: 'secondary',
              },
            ],
          });
          if (!result.component || result.value !== 'ok') return null;
          return result.component.password.value || null;
        }
        buffer = await receiveDynamicData({
          location: window.location,
          adapter,
          passwordPromptHandler: promptPassword,
        });
      } else {
        async function promptPassword() {
          const result = await showModal({
            component: PasswordPromptModal,
            title: messages.ui.prompts.sharedDataPassword,
            buttons: [
              { label: 'OK', value: 'ok', variant: 'primary' },
              {
                label: messages.ui.modal.cancel,
                value: 'cancel',
                variant: 'secondary',
              },
            ],
          });
          if (!result.component || result.value !== 'ok') return null;
          return result.component.password.value || null;
        }
        buffer = await receiveSharedData({
          location: window.location,
          downloadHandler: async (id) => {
            const text = await dataManager.googleDriveManager.loadFileContent(id);
            if (!text) throw new Error('no data');
            const { ciphertext, iv } = JSON.parse(text);
            return {
              ciphertext: base64ToArrayBuffer(ciphertext),
              iv: new Uint8Array(base64ToArrayBuffer(iv)),
            };
          },
          passwordPromptHandler: promptPassword,
        });
      }
      const parsed = JSON.parse(new TextDecoder().decode(buffer));
      const parsedCharacterImages = parsed.character?.images;
      if (parsed.character && 'images' in parsed.character) {
        delete parsed.character.images;
      }
      Object.assign(characterStore.character, parsed.character);
      if (Array.isArray(parsedCharacterImages)) {
        characterStore.character.images.splice(0, characterStore.character.images.length, ...parsedCharacterImages);
      } else {
        characterStore.character.images.splice(0, characterStore.character.images.length);
      }
      if (parsed.character) {
        parsed.character.images = parsedCharacterImages;
      }
      characterStore.skills.splice(0, characterStore.skills.length, ...parsed.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsed.specialSkills);
      Object.assign(characterStore.equipments, parsed.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsed.histories);
      uiStore.isViewingShared = true;
    } catch (err) {
      let key = 'general';
      if (err.name === 'InvalidLinkError') key = 'invalid';
      else if (err.name === 'ExpiredLinkError') key = 'expired';
      else if (err.name === 'PasswordRequiredError') key = 'passwordRequired';
      else if (err.name === 'DecryptionError') key = 'decryptionFailed';
      showToast({ type: 'error', ...messages.share.loadError.toast(key) });
      console.error('Error loading shared data:', err);
    } finally {
      uiStore.setLoading(false);
    }
  }

  return { initialize };
}
