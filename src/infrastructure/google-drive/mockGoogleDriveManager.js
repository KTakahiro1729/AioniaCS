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
    // 障害シミュレーション設定(localStorageには永続化しない)
    this._failureRules = new Map();
    this._latencyMs = 0;
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
    this._failureRules.clear();
    this._latencyMs = 0;
    this._seedSampleData();
    this._saveState();
  }

  // --- 障害シミュレーション ---
  // 開発時は window.__DRIVE_DEV__.simulateFailure('saveFile') のように使う。
  // methodName に '*' を指定すると全メソッドが対象になる。

  simulateFailure(methodName, { times = Infinity, error } = {}) {
    if (!methodName) {
      throw new Error('simulateFailure requires a method name (or "*" for all methods).');
    }
    this._failureRules.set(methodName, { remaining: times, error });
  }

  clearSimulatedFailures() {
    this._failureRules.clear();
  }

  setLatency(ms) {
    this._latencyMs = Number(ms) > 0 ? Number(ms) : 0;
  }

  async _simulate(methodName) {
    if (this._latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._latencyMs));
    }
    const key = this._failureRules.has(methodName) ? methodName : this._failureRules.has('*') ? '*' : null;
    if (!key) {
      return;
    }
    const rule = this._failureRules.get(key);
    rule.remaining -= 1;
    if (rule.remaining <= 0) {
      this._failureRules.delete(key);
    }
    const error = rule.error;
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(typeof error === 'string' ? error : `Simulated Drive failure in ${methodName}.`);
  }

  getDefaultConfig() {
    return { characterFolderId: null };
  }

  async onGapiLoad() {
    await this._simulate('onGapiLoad');
    return Promise.resolve();
  }

  async ensureAccessToken() {
    await this._simulate('ensureAccessToken');
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
      // 実装と同様、復元失敗時はトークンを破棄してゲスト扱いにする
      this.currentTokenInfo = null;
      return false;
    }
  }

  async handleSignIn() {
    await this._simulate('handleSignIn');
    this.state.signedIn = true;
    this._saveState();
    await this.ensureAccessToken();
    return true;
  }

  async handleSignOut(callback) {
    await this._simulate('handleSignOut');
    this.state.signedIn = false;
    this.currentTokenInfo = null;
    this._saveState();
    if (callback) callback();
  }

  async loadConfig() {
    await this._simulate('loadConfig');
    await this.ensureAccessToken();
    return this.state.config;
  }

  async saveConfig() {
    await this._simulate('saveConfig');
    await this.ensureAccessToken();
    this._saveState();
    return { id: this.configFileId, name: 'aioniacs.cfg' };
  }

  async createFolder(name, parentId = 'root') {
    await this._simulate('createFolder');
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
    await this._simulate('findFolder');
    await this.ensureAccessToken();
    if (parentId === 'root' && name === 'root') {
      return { id: 'root', name: 'root', parentId: null };
    }
    return Object.values(this.state.folders).find((folder) => folder.name === name && folder.parentId === parentId) || null;
  }

  async getOrCreateAppFolder(appFolderName) {
    await this._simulate('getOrCreateAppFolder');
    await this.ensureAccessToken();
    const targetName = appFolderName || MockGoogleDriveManager.DEFAULT_FOLDER_NAME;
    let folder = await this.findFolder(targetName, 'root');
    if (!folder) {
      folder = await this.createFolder(targetName, 'root');
    }
    return folder;
  }

  async findOrCreateConfiguredCharacterFolder() {
    await this._simulate('findOrCreateConfiguredCharacterFolder');
    const config = await this.loadConfig();

    // 実装と同様、キャッシュ済みIDも毎回存在確認する。Drive上(モックでは
    // state上)からフォルダが消えた場合に、消えたIDを親にした保存が成功して
    // しまわないようにするため。
    const candidateId = this.configuredFolderId || config?.characterFolderId;
    if (candidateId && this.state.folders[candidateId]) {
      this.configuredFolderId = candidateId;
      return this.configuredFolderId;
    }
    this.configuredFolderId = null;

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
    await this._simulate('listFiles');
    await this.ensureAccessToken();
    // キャラクターファイルはzipで保存されるため、本番の一覧クエリ
    // (useDriveLoadPageState)と同様にzipも常に含める
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
    await this._simulate('saveFile');
    await this.ensureAccessToken();
    if (fileId && !this.state.files[fileId]) {
      // 実装ではDrive APIが404を返し、このメッセージのエラーがスローされる
      throw new Error('Parent folder not found. Please select a new folder.');
    }
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
    await this._simulate('loadFileContent');
    await this.ensureAccessToken();
    const file = this.state.files[fileId];
    return file ? file.content : null;
  }

  async uploadAndShareFile(fileContent, fileName, mimeType = 'application/json') {
    await this._simulate('uploadAndShareFile');
    await this.ensureAccessToken();
    const info = await this.saveFile('shared', fileName, fileContent, null, mimeType);
    await this.ensureFilePublic(info.id);
    return info.id;
  }

  async ensureFilePublic(fileId) {
    await this._simulate('ensureFilePublic');
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
    await this._simulate('unshareFile');
    await this.ensureAccessToken();
    const file = this.state.files[fileId];
    if (!file) return false;
    file.shared = false;
    this._saveState();
    return true;
  }

  async findFileByName(fileName) {
    await this._simulate('findFileByName');
    await this.ensureAccessToken();
    if (!fileName) return null;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return null;
    const file = Object.values(this.state.files).find((entry) => entry.parentId === folderId && entry.name === fileName);
    return file ? { id: file.id, name: file.name } : null;
  }

  async isFileInConfiguredFolder(fileId) {
    await this._simulate('isFileInConfiguredFolder');
    if (!fileId) return false;
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
    await this._simulate('createCharacterFile');
    const params = await this._buildCharacterFileParams(payload);
    if (!params) return null;
    const { mimeType, fileName, folderId, contentHints } = params;
    return this.saveFile(folderId, fileName, payload?.content || '', null, mimeType, contentHints);
  }

  async updateCharacterFile(id, payload) {
    await this._simulate('updateCharacterFile');
    const params = await this._buildCharacterFileParams(payload);
    if (!params) return null;
    const { mimeType, fileName, folderId, contentHints } = params;
    return this.saveFile(folderId, fileName, payload?.content || '', id, mimeType, contentHints);
  }

  async renameFile(id, newName) {
    await this._simulate('renameFile');
    await this.ensureAccessToken();
    if (!id || !newName) {
      throw new Error('File ID and new name are required to rename a file.');
    }
    const file = this.state.files[id];
    if (!file) {
      throw new Error('File not found');
    }
    file.name = newName;
    file.modifiedTime = new Date().toISOString();
    this._saveState();
    return { id, name: newName };
  }

  async loadCharacterFile(id) {
    await this._simulate('loadCharacterFile');
    const content = await this.loadFileContent(id);
    return content ? await deserializeCharacterPayload(content) : null;
  }

  async deleteCharacterFile(id) {
    await this._simulate('deleteCharacterFile');
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
