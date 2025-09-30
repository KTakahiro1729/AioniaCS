let singletonInstance = null;

export class MockGoogleDriveManager {
  constructor(apiKey, clientId) {
    if (singletonInstance) {
      throw new Error('MockGoogleDriveManager has already been instantiated. Use getMockGoogleDriveManagerInstance().');
    }
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.storageKey = 'mockGoogleDriveData';
    console.log('MockGoogleDriveManager is active and uses localStorage.');
    this._loadState();

    singletonInstance = this;
  }

  _loadState() {
    try {
      const storedState = localStorage.getItem(this.storageKey);
      if (storedState) {
        const state = JSON.parse(storedState);
        this.files = state.files || {};
        this.folders = state.folders || {};
        this.fileCounter = state.fileCounter || 1;
        this.folderId = state.folderId || null;
        this.signedIn = state.signedIn || false;
      } else {
        this._initState();
      }
    } catch (e) {
      console.error('Failed to load mock state from localStorage, resetting.', e);
      this._initState();
    }
    this.pickerApiLoaded = true;
  }

  _saveState() {
    const stateToSave = {
      files: this.files,
      folders: this.folders,
      fileCounter: this.fileCounter,
      folderId: this.folderId,
      signedIn: this.signedIn,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
  }

  _initState() {
    this.files = {};
    this.folders = {};
    this.fileCounter = 1;
    this.folderId = null;
    this.signedIn = false;
    this._saveState();
  }

  onGapiLoad() {
    return Promise.resolve();
  }

  onGisLoad() {
    return Promise.resolve();
  }

  handleSignIn(callback) {
    this.signedIn = true;
    this._saveState();
    if (callback) callback(null, { signedIn: true });
  }

  handleSignOut(callback) {
    this.signedIn = false;
    this._saveState();
    if (callback) callback();
  }

  async createFolder(folderName) {
    const existing = Object.values(this.folders).find((f) => f.name === folderName);
    if (existing) return existing;
    const id = folderName === '.AioniaCS' ? this.folderId || 'mock-folder-id' : `folder-${this.fileCounter++}`;
    const folder = { id, name: folderName };
    this.folders[id] = folder;
    if (folderName === '.AioniaCS') {
      this.folderId = id;
    }
    this._saveState();
    return folder;
  }

  async findFolder(folderName) {
    if (folderName === '.AioniaCS' && this.folderId) {
      return this.folders[this.folderId] || { id: this.folderId, name: folderName };
    }
    return Object.values(this.folders).find((f) => f.name === folderName) || null;
  }

  async getOrCreateAppFolder() {
    return this.findOrCreateAioniaCSFolder();
  }

  async listFiles(folderId) {
    return Object.values(this.files)
      .filter((f) => f.parentId === folderId)
      .map((f) => ({ id: f.id, name: f.name }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null) {
    const id = fileId || `file-${this.fileCounter++}`;
    this.files[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId: folderId,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    const file = this.files[fileId];
    return file ? file.content : null;
  }

  async uploadAndShareFile(fileContent, fileName) {
    const info = await this.saveFile('drive', fileName, fileContent);
    return info.id;
  }

  showFilePicker(callback, parentFolderId = null) {
    const files = Object.values(this.files).filter((f) => !parentFolderId || f.parentId === parentFolderId);
    const first = files[0];
    if (first) {
      if (callback) callback(null, { id: first.id, name: first.name });
    } else if (callback) {
      callback(new Error('No files available.'));
    }
  }

  showFolderPicker(callback) {
    if (this.folderId) {
      if (callback) callback(null, { id: this.folderId, name: '.AioniaCS' });
    } else if (callback) {
      callback(new Error('No folders available.'));
    }
  }

  async findOrCreateAioniaCSFolder() {
    if (this.folderId) return this.folderId;
    const existing = await this.findFolder('.AioniaCS');
    if (existing) {
      this.folderId = existing.id;
      this._saveState();
      return this.folderId;
    }
    const created = await this.createFolder('.AioniaCS');
    this.folderId = created.id || 'mock-folder-id';
    if (!this.folders[this.folderId]) {
      this.folders[this.folderId] = { id: this.folderId, name: '.AioniaCS' };
    }
    this._saveState();
    return this.folderId;
  }

  async findFileByName(fileName) {
    if (!fileName) return null;
    const folderId = await this.findOrCreateAioniaCSFolder();
    const match = Object.values(this.files).find((f) => f.parentId === folderId && f.name === fileName);
    return match ? { id: match.id, name: match.name } : null;
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

  async createCharacterFile(data) {
    const folderId = await this.findOrCreateAioniaCSFolder();
    const fileName = `${(data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_')}.json`;
    return this.saveFile(folderId, fileName, JSON.stringify(data, null, 2));
  }

  async updateCharacterFile(id, data) {
    const folderId = await this.findOrCreateAioniaCSFolder();
    const fileName = `${(data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_')}.json`;
    return this.saveFile(folderId, fileName, JSON.stringify(data, null, 2), id);
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? JSON.parse(content) : null;
  }

  async deleteCharacterFile(id) {
    delete this.files[id];
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
  singletonInstance = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('mockGoogleDriveData');
  }
}
