import { createShareLink } from '../libs/sabalessshare/src/index.js';
import { createDynamicLink, updateDynamicLink } from '../libs/sabalessshare/src/dynamic.js';
import { arrayBufferToBase64 } from '../libs/sabalessshare/src/crypto.js';
import { DriveStorageAdapter } from '../services/driveStorageAdapter.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
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
    const id = await dataManager.googleDriveManager.uploadAndShareFile(payload, 'share.enc', 'application/json');
    return id;
  }

  async function _updateDynamicLinkWithMetadata({ data, includeFull, passwordOverride } = {}) {
    const metadata = uiStore.dynamicShareMetadata;
    if (!metadata || !metadata.pointerFileId || !metadata.key || !metadata.shareLink) {
      throw new Error(messages.share.dynamicMetadataMissing);
    }

    const adapter = new DriveStorageAdapter(dataManager.googleDriveManager);
    const normalizedPassword = typeof passwordOverride === 'string' && passwordOverride.length > 0 ? passwordOverride : null;
    const storedPassword = metadata.password && metadata.password.length > 0 ? metadata.password : null;

    if (metadata.salt && !storedPassword && !normalizedPassword) {
      throw new Error(messages.share.dynamicPasswordRequired);
    }

    if (!metadata.salt && normalizedPassword && !storedPassword) {
      throw new Error(messages.share.dynamicPasswordChangeUnsupported);
    }

    if (storedPassword && normalizedPassword && storedPassword !== normalizedPassword) {
      throw new Error(messages.share.dynamicPasswordMismatch);
    }

    const passwordToUse = storedPassword || normalizedPassword || null;

    try {
      await updateDynamicLink({
        pointerFileId: metadata.pointerFileId,
        newData: data,
        key: metadata.key,
        salt: metadata.salt,
        password: passwordToUse || undefined,
        adapter,
      });
    } catch (err) {
      throw new Error(messages.share.dynamicUpdateFailed + (err?.message ? `: ${err.message}` : ''));
    }

    uiStore.setDynamicShareMetadata({
      pointerFileId: metadata.pointerFileId,
      key: metadata.key,
      salt: metadata.salt,
      shareLink: metadata.shareLink,
      includeFull: typeof includeFull === 'boolean' ? includeFull : metadata.includeFull,
      password: passwordToUse,
    });

    return metadata.shareLink;
  }

  async function refreshDynamicShare() {
    const metadata = uiStore.dynamicShareMetadata;
    if (!metadata || !metadata.pointerFileId || !metadata.key || !metadata.shareLink) {
      return false;
    }
    if (!dataManager.googleDriveManager) {
      return false;
    }

    const data = _collectData(metadata.includeFull);
    try {
      await _updateDynamicLinkWithMetadata({ data, includeFull: metadata.includeFull });
      return true;
    } catch (err) {
      uiStore.clearDynamicShareMetadata();
      showToast({ type: 'error', ...messages.share.dynamicAutoUpdateFailed(err) });
      return false;
    }
  }

  async function generateShare(options) {
    const { type, includeFull, password, expiresInDays } = options;
    const data = _collectData(includeFull);
    if (type === 'dynamic') {
      const adapter = new DriveStorageAdapter(dataManager.googleDriveManager);
      const existingMetadata = uiStore.dynamicShareMetadata;
      if (existingMetadata && existingMetadata.pointerFileId && existingMetadata.key && existingMetadata.shareLink) {
        try {
          return await _updateDynamicLinkWithMetadata({ data, includeFull, passwordOverride: password });
        } catch (err) {
          uiStore.clearDynamicShareMetadata();
          throw err;
        }
      }
      const { shareLink, pointerFileId, key, salt } = await createDynamicLink({
        data,
        adapter,
        password: password || undefined,
        expiresInDays,
      });
      uiStore.setDynamicShareMetadata({
        pointerFileId,
        key,
        salt,
        shareLink,
        includeFull,
        password: password || null,
      });
      return shareLink;
    }
    const mode = includeFull ? 'cloud' : 'simple';
    return createShareLink({
      data,
      mode,
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

  return { generateShare, copyLink, isLongData, refreshDynamicShare };
}
