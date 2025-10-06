import { buildZipFromCharacterData, parseCharacterZipData, separateCharacterImages } from './characterDataFileHelpers.js';

function uint8ArrayToBase64(uint8Array) {
  if (!(uint8Array instanceof Uint8Array)) {
    return uint8Array;
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function base64ToUint8Array(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const binary = atob(value);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
    this.pickerApiLoaded = true;
    this._loadState();
    singletonInstance = this;
  }

  _loadState() {
    const defaultState = {
      files: {},
      folders: {},
      fileCounter: 1,
      folderCounter: 1,
      signedIn: false,
      config: this.getDefaultConfig(),
      folderPickerQueue: [],
    };

    try {
      const stored = localStorage.getItem(this.storageKey);
      this.state = stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
    } catch (error) {
      console.error('Failed to load mock state from localStorage, resetting.', error);
      this.state = defaultState;
    }

    if (!Array.isArray(this.state.folderPickerQueue)) {
      this.state.folderPickerQueue = [];
    }

    this.configuredFolderId = null;
    this.cachedFolderPath = null;
    this._saveState();
  }

  _saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  reset() {
    this.state = {
      files: {},
      folders: {},
      fileCounter: 1,
      folderCounter: 1,
      signedIn: false,
      config: this.getDefaultConfig(),
      folderPickerQueue: [],
    };
    this.configuredFolderId = null;
    this.cachedFolderPath = null;
    this._saveState();
  }

  getDefaultConfig() {
    return { characterFolderPath: '慈悲なきアイオニア' };
  }

  normalizeFolderPath(rawPath) {
    const defaultPath = this.getDefaultConfig().characterFolderPath;
    if (typeof rawPath !== 'string') {
      return defaultPath;
    }
    const unified = rawPath.replace(/\\/g, '/');
    const segments = unified
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    if (segments.length === 0) {
      return defaultPath;
    }
    return segments.join('/');
  }

  getFolderSegments(path) {
    return this.normalizeFolderPath(path).split('/');
  }

  buildFolderPath(folderId) {
    const segments = [];
    let current = this.state.folders[folderId];
    while (current) {
      segments.unshift(current.name);
      current = this.state.folders[current.parentId];
    }
    return segments.join('/');
  }

  async ensureFolderPath(path) {
    const normalized = this.normalizeFolderPath(path);
    let parentId = 'root';
    let currentFolder = null;

    for (const segment of this.getFolderSegments(normalized)) {
      let folder = await this.findFolder(segment, parentId);
      if (!folder) {
        folder = await this.createFolder(segment, parentId);
      }
      if (!folder) {
        return { folder: null, normalized };
      }
      currentFolder = folder;
      parentId = folder.id;
    }

    return { folder: currentFolder, normalized };
  }

  async onGapiLoad() {
    return Promise.resolve();
  }

  async onGisLoad() {
    return Promise.resolve();
  }

  handleSignIn(callback) {
    this.state.signedIn = true;
    this._saveState();
    if (callback) callback(null, { signedIn: true });
  }

  handleSignOut(callback) {
    this.state.signedIn = false;
    this._saveState();
    if (callback) callback();
  }

  async loadConfig() {
    this.state.config.characterFolderPath = this.normalizeFolderPath(this.state.config.characterFolderPath);
    return this.state.config;
  }

  async saveConfig() {
    this._saveState();
    return { id: this.configFileId, name: 'aioniacs.cfg' };
  }

  async setCharacterFolderPath(path) {
    const normalized = this.normalizeFolderPath(path);
    this.state.config.characterFolderPath = normalized;
    this.configuredFolderId = null;
    this.cachedFolderPath = null;
    await this.saveConfig();
    return normalized;
  }

  async createFolder(name, parentId = 'root') {
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
    return Object.values(this.state.folders).find((folder) => folder.name === name && folder.parentId === parentId) || null;
  }

  async getOrCreateAppFolder() {
    return this.findOrCreateAioniaCSFolder();
  }

  async ensureConfiguredFolder() {
    const config = await this.loadConfig();
    const path = this.normalizeFolderPath(config.characterFolderPath);
    if (this.configuredFolderId && this.cachedFolderPath === path) {
      return this.configuredFolderId;
    }

    const { folder, normalized } = await this.ensureFolderPath(path);
    if (!folder) {
      return null;
    }
    this.configuredFolderId = folder.id;
    this.cachedFolderPath = normalized;
    this._saveState();
    return folder.id;
  }

  async findOrCreateAioniaCSFolder() {
    return this.ensureConfiguredFolder();
  }

  async listFiles(folderId) {
    return Object.values(this.state.files)
      .filter((file) => file.parentId === folderId)
      .map((file) => ({ id: file.id, name: file.name }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null, mimeType = 'application/json') {
    const id = fileId || `file-${this.state.fileCounter++}`;
    const isBinary =
      fileContent instanceof Uint8Array ||
      fileContent instanceof ArrayBuffer ||
      (typeof Blob !== 'undefined' && fileContent instanceof Blob) ||
      ArrayBuffer.isView(fileContent);

    let storedContent = fileContent;
    if (isBinary) {
      const uint8Array = fileContent instanceof Uint8Array ? fileContent : new Uint8Array(fileContent);
      storedContent = uint8ArrayToBase64(uint8Array);
    }

    this.state.files[id] = {
      id,
      name: fileName,
      content: storedContent,
      parentId: folderId,
      mimeType,
      isBinary,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    const file = this.state.files[fileId];
    if (!file) {
      return null;
    }
    const body = file.isBinary ? base64ToUint8Array(file.content) : file.content;
    return { body, mimeType: file.mimeType || 'application/json', name: file.name };
  }

  async uploadAndShareFile(fileContent, fileName) {
    const info = await this.saveFile('shared', fileName, fileContent);
    return info.id;
  }

  showFilePicker(callback, parentFolderId = null) {
    const files = Object.values(this.state.files).filter((file) => (parentFolderId ? file.parentId === parentFolderId : true));
    const first = files[0];
    if (first) {
      callback?.(null, { id: first.id, name: first.name });
    } else {
      callback?.(new Error('No files available.'));
    }
  }

  showFolderPicker(callback) {
    const queue = Array.isArray(this.state.folderPickerQueue) ? this.state.folderPickerQueue : [];
    if (queue.length > 0) {
      const targetPath = this.normalizeFolderPath(queue.shift());
      this.state.folderPickerQueue = queue;
      this._saveState();
      this.ensureFolderPath(targetPath)
        .then(({ folder, normalized }) => {
          if (!folder) {
            callback?.(new Error('No folders available.'));
            return;
          }
          callback?.(null, { id: folder.id, name: folder.name, path: normalized });
        })
        .catch((error) => {
          callback?.(error);
        });
      return;
    }

    const folderId = this.configuredFolderId;
    if (folderId) {
      const folder = this.state.folders[folderId];
      const path = this.cachedFolderPath || this.buildFolderPath(folderId);
      callback?.(null, { id: folder.id, name: folder.name, path: path || folder.name });
    } else {
      callback?.(new Error('No folders available.'));
    }
  }

  async findFileByName(fileName) {
    if (!fileName) return null;
    const folderId = await this.findOrCreateAioniaCSFolder();
    if (!folderId) return null;
    const file = Object.values(this.state.files).find((entry) => entry.parentId === folderId && entry.name === fileName);
    return file ? { id: file.id, name: file.name } : null;
  }

  async isFileInConfiguredFolder(fileId) {
    const folderId = await this.findOrCreateAioniaCSFolder();
    if (!folderId) return false;
    const file = this.state.files[fileId];
    return file ? file.parentId === folderId : false;
  }

  async createCharacterFile(data) {
    const folderId = await this.findOrCreateAioniaCSFolder();
    if (!folderId) return null;
    const sanitizedName = (data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_');
    const { characterWithoutImages, images } = separateCharacterImages(data.character);
    const payload = {
      ...data,
      character: characterWithoutImages,
    };
    const hasImages = images.length > 0;
    const jsonString = JSON.stringify(payload, null, 2);
    const fileName = `${sanitizedName}.${hasImages ? 'zip' : 'json'}`;
    const mimeType = hasImages ? 'application/zip' : 'application/json';
    const content = hasImages ? await buildZipFromCharacterData(jsonString, images) : jsonString;
    return this.saveFile(folderId, fileName, content, null, mimeType);
  }

  async updateCharacterFile(id, data) {
    const folderId = await this.findOrCreateAioniaCSFolder();
    if (!folderId) return null;
    const sanitizedName = (data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_');
    const { characterWithoutImages, images } = separateCharacterImages(data.character);
    const payload = {
      ...data,
      character: characterWithoutImages,
    };
    const hasImages = images.length > 0;
    const jsonString = JSON.stringify(payload, null, 2);
    const fileName = `${sanitizedName}.${hasImages ? 'zip' : 'json'}`;
    const mimeType = hasImages ? 'application/zip' : 'application/json';
    const content = hasImages ? await buildZipFromCharacterData(jsonString, images) : jsonString;
    return this.saveFile(folderId, fileName, content, id, mimeType);
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    if (!content || content.body === undefined || content.body === null) {
      return null;
    }
    if (content.mimeType === 'application/zip') {
      return parseCharacterZipData(content.body);
    }
    const text = typeof content.body === 'string' ? content.body : JSON.stringify(content.body);
    return JSON.parse(text);
  }

  async deleteCharacterFile(id) {
    delete this.state.files[id];
    this._saveState();
  }
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
