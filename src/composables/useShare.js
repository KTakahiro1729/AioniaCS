import { createShareLink } from '../libs/sabalessshare/src/index.js';
import { createDynamicLink } from '../libs/sabalessshare/src/dynamic.js';
import { arrayBufferToBase64 } from '../libs/sabalessshare/src/crypto.js';
import { DriveStorageAdapter } from '../services/driveStorageAdapter.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { serializeCharacterForExport, buildCharacterArchive } from '../utils/characterSerialization.js';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const { showToast } = useNotifications();

  async function _collectArchiveBuffer() {
    const { data, images } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: true,
    });

    const { content } = await buildCharacterArchive({ data, images });
    const { buffer, byteOffset, byteLength } = content;
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  async function _uploadHandler(data) {
    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.uploadAndShareFile !== 'function') {
      throw new Error(messages.share.needSignIn().message);
    }
    const payload = JSON.stringify({
      ciphertext: arrayBufferToBase64(data.ciphertext),
      iv: arrayBufferToBase64(data.iv),
    });
    const id = await manager.uploadAndShareFile(payload, 'share.enc', 'application/json');
    if (!id) {
      throw new Error(messages.share.errors.uploadFailed);
    }
    return id;
  }

  async function generateShare(options) {
    const { type, password, expiresInDays } = options;
    const data = await _collectArchiveBuffer();
    if (type === 'dynamic') {
      const adapter = new DriveStorageAdapter(dataManager.googleDriveManager);
      const { shareLink } = await createDynamicLink({
        data,
        adapter,
        password: password || undefined,
        expiresInDays,
      });
      return shareLink;
    }
    return createShareLink({
      data,
      mode: 'cloud',
      uploadHandler: _uploadHandler,
      shortenUrlHandler: async (longUrl) => longUrl,
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

  return { generateShare, copyLink };
}
