import { createShareLink } from '../libs/sabalessshare/src/index.js';
import { createDynamicLink } from '../libs/sabalessshare/src/dynamic.js';
import { arrayBufferToBase64 } from '../libs/sabalessshare/src/crypto.js';
import { DriveStorageAdapter } from '../services/driveStorageAdapter.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const { showToast } = useNotifications();

  function _collectData(includeFull) {
    const char = { ...characterStore.character };
    if (!includeFull) delete char.images;
    const payload = {
      character: char,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
    };
    return new TextEncoder().encode(JSON.stringify(payload)).buffer;
  }

  function isLongData() {
    const char = { ...characterStore.character };
    delete char.images;
    const payload = JSON.stringify({
      character: char,
      skills: characterStore.skills,
    });
    return payload.length > 7000; // rough threshold
  }

  async function _uploadHandler(data) {
    const payload = JSON.stringify({
      ciphertext: arrayBufferToBase64(data.ciphertext),
      iv: arrayBufferToBase64(data.iv),
    });
    const id = await dataManager.uploadAndShareFile(payload, 'share.enc', 'application/json');
    return id;
  }

  async function generateShare(options) {
    const { type, includeFull, password, expiresInDays } = options;
    const data = _collectData(includeFull);
    if (type === 'dynamic') {
      const adapter = new DriveStorageAdapter(dataManager);
      const { shareLink } = await createDynamicLink({
        data,
        adapter,
        password: password || undefined,
        expiresInDays,
      });
      return shareLink;
    }
    const mode = includeFull ? 'cloud' : 'simple';
    return createShareLink({
      data,
      mode,
      uploadHandler: _uploadHandler,
      shortenUrlHandler: async (longUrl) => {
        try {
          // TinyURLのAPIエンドポイントにリクエストを送信
          const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
          if (response.ok) {
            return await response.text();
          } else {
            console.error('TinyURL API request failed:', response.status, response.statusText);
            return longUrl;
          }
        } catch (error) {
          console.error('Failed to shorten URL with TinyURL:', error);
          return longUrl;
        }
      },
      password: password || undefined,
      expiresInDays,
    });
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showToast({ type: 'success', ...messages.share.copied(link) });
    } catch (err) {
      showToast({ type: 'error', ...messages.share.copyFailed(err) });
    }
  }

  return { generateShare, copyLink, isLongData };
}
