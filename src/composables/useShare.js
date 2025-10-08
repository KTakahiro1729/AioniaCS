import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { serializeCharacterForExport, toTimestampString } from '../utils/characterSerialization.js';

const SHARE_FILE_EXTENSION = '.json';

function sanitizeFileName(name) {
  const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || 'shared-character';
}

function buildShareFileName(characterName) {
  const timestamp = toTimestampString(new Date());
  return `${sanitizeFileName(characterName)}_share_${timestamp}${SHARE_FILE_EXTENSION}`;
}

function decodeBuffer(buffer) {
  if (typeof buffer === 'string') {
    return buffer;
  }
  if (buffer instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(buffer));
  }
  if (ArrayBuffer.isView(buffer)) {
    return new TextDecoder().decode(buffer);
  }
  return '';
}

function buildDriveShareUrl(fileId) {
  const { origin } = window.location;
  let { pathname } = window.location;
  if (pathname.endsWith('/index.html')) {
    pathname = pathname.slice(0, -'/index.html'.length);
  }
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }
  return `${origin}${pathname}#/share/drive/${encodeURIComponent(fileId)}`;
}

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const { showToast } = useNotifications();

  function _collectData(includeFull) {
    const { data, images } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: includeFull,
    });

    if (includeFull && images.length > 0) {
      data.character.images = images;
    }

    return new TextEncoder().encode(JSON.stringify(data)).buffer;
  }

  function isLongData() {
    const { data } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: false,
    });
    const payload = JSON.stringify({
      character: data.character,
      skills: data.skills,
    });
    return payload.length > 7000; // rough threshold
  }

  async function generateShare(options = {}) {
    const { includeFull = false } = options;
    const data = _collectData(includeFull);
    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.uploadAndShareFile !== 'function') {
      throw new Error(messages.share.needSignIn().message);
    }
    if (typeof manager.setPermissionToPublic !== 'function') {
      throw new Error(messages.share.errors.permissionUnsupported);
    }

    const fileName = buildShareFileName(characterStore.character.name);
    const payload = decodeBuffer(data);
    const fileId = await manager.uploadAndShareFile(payload, fileName, 'application/json');
    if (!fileId) {
      throw new Error(messages.share.errors.uploadFailed);
    }

    try {
      await manager.setPermissionToPublic(fileId);
    } catch (error) {
      console.error('Failed to set Drive permissions for shared file:', error);
      throw new Error(messages.share.errors.permissionFailed);
    }

    return buildDriveShareUrl(fileId);
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
