import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { receiveSharedData } from '../libs/sabalessshare/src/index.js';
import { parseShareUrl } from '../libs/sabalessshare/src/url.js';
import { useNotifications } from './useNotifications.js';
import { useModal } from './useModal.js';
import PasswordPromptModal from '../components/modals/contents/PasswordPromptModal.vue';
import { messages } from '../locales/ja.js';

export function useAppInitialization() {
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
      if (params.mode !== 'simple') {
        throw new Error('クラウド共有リンクは現在サポートされていません。');
      }

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

      const buffer = await receiveSharedData({
        location: window.location,
        passwordPromptHandler: promptPassword,
      });
      const parsed = JSON.parse(new TextDecoder().decode(buffer));
      Object.assign(characterStore.character, parsed.character);
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
