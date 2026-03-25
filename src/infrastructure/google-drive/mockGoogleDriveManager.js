import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';

function toUrlSafeBase64(input) {
  return input.replace(/\+/g, '-').replace(/\//g, '_');
}

function buildThumbnailContentHints(thumbnail, mimeType = 'image/png') {
  if (typeof thumbnail !== 'string' || thumbnail.length === 0) {
    return null;
  }
  const commaIndex = thumbnail.indexOf(',');
  const base64 = commaIndex >= 0 ? thumbnail.slice(commaIndex + 1) : thumbnail;
  const safeBase64 = toUrlSafeBase64(base64);
  return {
    thumbnail: {
      image: safeBase64,
      mimeType,
    },
  };
}

function sanitizeFileName(name) {
  const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || '名もなき冒険者';
}

let singletonInstance = null;

export class MockGoogleDriveManager {
  constructor(apiKey, clientId) {
    if (singletonInstance) {
      throw new Error('MockGoogleDriveManager has already been instantiated. Use getMockGoogleDriveManagerInstance().');
    }
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.storageKey = 'mockGoogleDriveData';
    this.configFileId = 'mock-config';
    this.currentTokenInfo = null;
    this._loadState();
    singletonInstance = this;
    if (typeof window !== 'undefined') {
      window.__DRIVE_DEV__ = this;
    }
  }

  static get DEFAULT_FOLDER_NAME() {
    return 'Aionia TRPG Character Sheet';
  }

  _getDefaultState() {
    return {
      files: {},
      folders: {},
      fileCounter: 1,
      folderCounter: 1,
      signedIn: true,
      config: this.getDefaultConfig(),
    };
  }

  _loadState() {
    const defaultState = this._getDefaultState();
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.state = { ...defaultState, ...JSON.parse(stored) };
      } else {
        this.state = defaultState;
        this._seedSampleData();
      }
    } catch (error) {
      console.error('Failed to load mock state from localStorage, resetting.', error);
      this.state = { ...defaultState };
      this._seedSampleData();
    }
    this.configuredFolderId = null;
    this._saveState();
  }

  _saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  _ensureDefaultFolder() {
    const name = MockGoogleDriveManager.DEFAULT_FOLDER_NAME;
    const existing = Object.values(this.state.folders).find((folder) => folder.name === name && folder.parentId === 'root');
    if (existing) {
      return existing.id;
    }
    const id = `folder-${this.state.folderCounter++}`;
    this.state.folders[id] = { id, name, parentId: 'root' };
    return id;
  }

  _seedSampleData() {
    const folderId = this._ensureDefaultFolder();
    this.configuredFolderId = folderId;
    this.state.config.characterFolderId = folderId;
  }

  reset() {
    this.state = this._getDefaultState();
    this.configuredFolderId = null;
    this.currentTokenInfo = null;
    this._seedSampleData();
    this._saveState();
  }

  getDefaultConfig() {
    return { characterFolderId: null };
  }

  async onGapiLoad() {
    return Promise.resolve();
  }

  async ensureAccessToken() {
    if (!this.state.signedIn) {
      throw new Error('Authentication required.');
    }
    const now = Date.now();
    if (this.currentTokenInfo?.expiresAt > now) {
      return this.currentTokenInfo.accessToken;
    }
    const accessToken = 'mock-access-token';
    this.currentTokenInfo = { accessToken, expiresAt: now + 55 * 60 * 1000 };
    return accessToken;
  }

  async restoreSession() {
    try {
      await this.ensureAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  async handleSignIn() {
    this.state.signedIn = true;
    this._saveState();
    await this.ensureAccessToken();
    return true;
  }

  async handleSignOut(callback) {
    this.state.signedIn = false;
    this.currentTokenInfo = null;
    this._saveState();
    if (callback) callback();
  }

  async loadConfig() {
    return this.state.config;
  }

  async saveConfig() {
    this._saveState();
    return { id: this.configFileId, name: 'aioniacs.cfg' };
  }

  async createFolder(name, parentId = 'root') {
    await this.ensureAccessToken();
    const existing = await this.findFolder(name, parentId);
    if (existing) {
      return existing;
    }
    const id = `folder-${this.state.folderCounter++}`;
    const folder = { id, name, parentId };
    this.state.folders[id] = folder;
    this._saveState();
    return folder;
  }

  async findFolder(name, parentId = 'root') {
    await this.ensureAccessToken();
    if (parentId === 'root' && name === 'root') {
      return { id: 'root', name: 'root', parentId: null };
    }
    return Object.values(this.state.folders).find((folder) => folder.name === name && folder.parentId === parentId) || null;
  }

  async getOrCreateAppFolder(appFolderName) {
    await this.ensureAccessToken();
    const targetName = appFolderName || this.getDefaultConfig().characterFolderPath;
    let folder = await this.findFolder(targetName, 'root');
    if (!folder) {
      folder = await this.createFolder(targetName, 'root');
    }
    return folder;
  }

  async findOrCreateConfiguredCharacterFolder() {
    if (this.configuredFolderId) {
      return this.configuredFolderId;
    }

    const config = await this.loadConfig();

    // Try to use stored folder ID
    if (config?.characterFolderId && this.state.folders[config.characterFolderId]) {
      this.configuredFolderId = config.characterFolderId;
      return this.configuredFolderId;
    }

    // Create a new folder with the fixed name
    const folder = await this.createFolder(MockGoogleDriveManager.DEFAULT_FOLDER_NAME, 'root');
    if (!folder?.id) {
      return null;
    }

    this.configuredFolderId = folder.id;
    this.state.config.characterFolderId = folder.id;
    this._saveState();
    return this.configuredFolderId;
  }

  async listFiles(folderId, mimeType = 'application/json') {
    await this.ensureAccessToken();
    return Object.values(this.state.files)
      .filter((file) => file.parentId === folderId && (!mimeType || file.mimeType === mimeType || file.mimeType === 'application/zip'))
      .map((file) => ({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        createdTime: file.createdTime,
        shared: Boolean(file.shared),
        hasThumbnail: Boolean(file.thumbnailLink),
        thumbnailLink: file.thumbnailLink || null,
      }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null, mimeType = 'application/json', contentHints = null) {
    await this.ensureAccessToken();
    const now = new Date().toISOString();
    const id = fileId || `file-${this.state.fileCounter++}`;
    const existing = this.state.files[id];
    this.state.files[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId: folderId,
      mimeType,
      modifiedTime: now,
      createdTime: existing?.createdTime || now,
      shared: existing?.shared || false,
      thumbnailLink: contentHints?.thumbnail?.image ? `mock-thumbnail-${id}` : existing?.thumbnailLink || null,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    await this.ensureAccessToken();
    const file = this.state.files[fileId];
    return file ? file.content : null;
  }

  async uploadAndShareFile(fileContent, fileName, mimeType = 'application/json') {
    await this.ensureAccessToken();
    const info = await this.saveFile('shared', fileName, fileContent, null, mimeType);
    await this.ensureFilePublic(info.id);
    return info.id;
  }

  async ensureFilePublic(fileId) {
    await this.ensureAccessToken();
    if (!fileId) {
      return null;
    }
    const file = this.state.files[fileId];
    if (!file) {
      return null;
    }
    file.shared = true;
    this._saveState();
    return `https://drive.mock/${fileId}`;
  }

  async unshareFile(fileId) {
    await this.ensureAccessToken();
    const file = this.state.files[fileId];
    if (!file) return false;
    file.shared = false;
    this._saveState();
    return true;
  }

  async findFileByName(fileName) {
    await this.ensureAccessToken();
    if (!fileName) return null;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return null;
    const file = Object.values(this.state.files).find((entry) => entry.parentId === folderId && entry.name === fileName);
    return file ? { id: file.id, name: file.name } : null;
  }

  async isFileInConfiguredFolder(fileId) {
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return false;
    const file = this.state.files[fileId];
    return file ? file.parentId === folderId : false;
  }

  buildContentHintsFromThumbnail(thumbnail, mimeType = 'image/png') {
    try {
      return buildThumbnailContentHints(thumbnail, mimeType);
    } catch (error) {
      console.error('Failed to build thumbnail content hints:', error);
      return null;
    }
  }

  async _buildCharacterFileParams(payload) {
    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return null;
    const contentHints = payload?.thumbnail
      ? this.buildContentHintsFromThumbnail(payload.thumbnail, payload.thumbnailMimeType)
      : payload?.contentHints;
    return { mimeType, fileName, folderId, contentHints };
  }

  async createCharacterFile(payload) {
    const params = await this._buildCharacterFileParams(payload);
    if (!params) return null;
    const { mimeType, fileName, folderId, contentHints } = params;
    return this.saveFile(folderId, fileName, payload?.content || '', null, mimeType, contentHints);
  }

  async updateCharacterFile(id, payload) {
    const params = await this._buildCharacterFileParams(payload);
    if (!params) return null;
    const { mimeType, fileName, folderId, contentHints } = params;
    return this.saveFile(folderId, fileName, payload?.content || '', id, mimeType, contentHints);
  }

  async renameFile(id, newName) {
    await this.ensureAccessToken();
    if (!id || !newName) {
      throw new Error('File ID and new name are required to rename a file.');
    }
    const file = this.state.files[id];
    if (!file) {
      throw new Error('File not found');
    }
    file.name = newName;
    this._saveState();
    return { id, name: newName };
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? await deserializeCharacterPayload(content) : null;
  }

  async deleteCharacterFile(id) {
    await this.ensureAccessToken();
    delete this.state.files[id];
    this._saveState();
  }

  async readIndexFile() {
    return [];
  }

  async writeIndexFile() {
    return null;
  }

  async addIndexEntry() {}

  async renameIndexEntry() {}

  async removeIndexEntry() {}
}

export function initializeMockGoogleDriveManager(apiKey, clientId) {
  if (singletonInstance) {
    return singletonInstance;
  }
  return new MockGoogleDriveManager(apiKey, clientId);
}

export function getMockGoogleDriveManagerInstance() {
  if (!singletonInstance) {
    throw new Error('MockGoogleDriveManager has not been initialized. Call initializeMockGoogleDriveManager() first.');
  }
  return singletonInstance;
}

export function resetMockGoogleDriveManagerForTests() {
  if (singletonInstance) {
    singletonInstance.reset();
    singletonInstance = null;
  }
  localStorage.removeItem('mockGoogleDriveData');
}
