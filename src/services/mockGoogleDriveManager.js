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
    };

    try {
      const stored = localStorage.getItem(this.storageKey);
      this.state = stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
    } catch (error) {
      console.error('Failed to load mock state from localStorage, resetting.', error);
      this.state = defaultState;
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

    let parentId = 'root';
    let currentId = null;
    for (const segment of this.getFolderSegments(path)) {
      let folder = await this.findFolder(segment, parentId);
      if (!folder) {
        folder = await this.createFolder(segment, parentId);
      }
      if (!folder) {
        return null;
      }
      currentId = folder.id;
      parentId = currentId;
    }
    this.configuredFolderId = currentId;
    this.cachedFolderPath = path;
    this._saveState();
    return currentId;
  }

  async findOrCreateAioniaCSFolder() {
    return this.ensureConfiguredFolder();
  }

  async listFiles(folderId) {
    return Object.values(this.state.files)
      .filter((file) => file.parentId === folderId)
      .map((file) => ({ id: file.id, name: file.name }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null) {
    const id = fileId || `file-${this.state.fileCounter++}`;
    this.state.files[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId: folderId,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    const file = this.state.files[fileId];
    return file ? file.content : null;
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
    const folderId = this.configuredFolderId;
    if (folderId) {
      const folder = this.state.folders[folderId];
      callback?.(null, { id: folder.id, name: folder.name });
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
    const fileName = `${(data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_')}.json`;
    return this.saveFile(folderId, fileName, JSON.stringify(data, null, 2));
  }

  async updateCharacterFile(id, data) {
    const folderId = await this.findOrCreateAioniaCSFolder();
    if (!folderId) return null;
    const fileName = `${(data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_')}.json`;
    return this.saveFile(folderId, fileName, JSON.stringify(data, null, 2), id);
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? JSON.parse(content) : null;
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
