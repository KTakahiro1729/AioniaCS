import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { serializeCharacterForExport } from '../utils/characterSerialization.js';

const SHARE_STATE_KEY = 'aioniacs.share.records';

function sanitizeFileName(name) {
  const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || '名もなき冒険者';
}

function getStoredShareRecords() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(SHARE_STATE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch (error) {
    console.warn('Failed to parse stored share records:', error);
    return {};
  }
}

function saveShareRecords(records) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(SHARE_STATE_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn('Failed to persist share records:', error);
  }
}

function buildShareFileName(characterName) {
  return `AioniaCS Share - ${sanitizeFileName(characterName)}.json`;
}

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const { showToast } = useNotifications();

  function collectSharePayload() {
    const { data, images } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: true,
    });

    if (images.length > 0) {
      data.character.images = images;
    }

    return JSON.stringify(data);
  }

  function isLongData() {
    const { data, images } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: true,
    });
    if (Array.isArray(images) && images.length > 0) {
      return true;
    }
    const payload = JSON.stringify(data);
    return payload.length > 7000;
  }

  async function generateShare() {
    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.saveFile !== 'function' || typeof manager.setPermissionToPublic !== 'function') {
      throw new Error(messages.share.needSignIn().message);
    }

    const shareContent = collectSharePayload();
    const fileName = buildShareFileName(characterStore.character.name);

    const records = getStoredShareRecords();
    const existingEntry = records[fileName];
    const existingId = typeof existingEntry === 'string' ? existingEntry : existingEntry?.id || null;

    let targetFolderId = null;
    if (typeof manager.findOrCreateConfiguredCharacterFolder === 'function') {
      try {
        targetFolderId = await manager.findOrCreateConfiguredCharacterFolder();
      } catch (error) {
        console.warn('Failed to resolve configured Drive folder for share:', error);
      }
    }

    let saveResult;
    try {
      saveResult = await manager.saveFile(targetFolderId, fileName, shareContent, existingId, 'application/json');
    } catch (error) {
      console.error('Error saving share payload to Drive:', error);
      throw new Error(messages.share.errors.uploadFailed);
    }

    if (!saveResult || !saveResult.id) {
      throw new Error(messages.share.errors.uploadFailed);
    }

    try {
      await manager.setPermissionToPublic(saveResult.id);
    } catch (error) {
      console.error('Error updating share permissions:', error);
      throw new Error(messages.share.errors.permissionFailed);
    }

    records[fileName] = { id: saveResult.id, updatedAt: Date.now() };
    saveShareRecords(records);

    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('shareId', saveResult.id);
    shareUrl.hash = '';
    return shareUrl.toString();
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
