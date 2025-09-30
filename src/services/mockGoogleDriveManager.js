const APP_FOLDER_NAME = 'AioniaCS';

export class MockGoogleDriveManager {
  constructor(apiKey, clientId) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.storageKey = 'mockGoogleDriveData';
    this.pickerApiLoaded = true;
    this._loadState();
    console.log('MockGoogleDriveManager is active and uses localStorage.');
  }

  _initState() {
    this.files = {};
    this.folders = {};
    this.fileCounter = 1;
    this.appFolderId = null;
    this.signedIn = false;
    this._saveState();
  }

  _loadState() {
    try {
      const storedState = localStorage.getItem(this.storageKey);
      if (storedState) {
        const state = JSON.parse(storedState);
        this.files = state.files || {};
        this.folders = state.folders || {};
        this.fileCounter = state.fileCounter || 1;
        this.appFolderId = state.appFolderId || null;
        this.signedIn = state.signedIn || false;
      } else {
        this._initState();
      }
    } catch (error) {
      console.error('Failed to load mock state from localStorage, resetting.', error);
      this._initState();
    }
  }

  _saveState() {
    const stateToSave = {
      files: this.files,
      folders: this.folders,
      fileCounter: this.fileCounter,
      appFolderId: this.appFolderId,
      signedIn: this.signedIn,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
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

  async createFolder(folderName, parentId = 'root') {
    const existing = Object.values(this.folders).find((folder) => folder.name === folderName && folder.parentId === parentId);
    if (existing) return existing;
    const id = `folder-${this.fileCounter++}`;
    const folder = { id, name: folderName, parentId };
    this.folders[id] = folder;
    if (folderName === APP_FOLDER_NAME && parentId === 'root') {
      this.appFolderId = id;
    }
    this._saveState();
    return folder;
  }

  async findFolder(folderName, parentId = 'root') {
    return Object.values(this.folders).find((folder) => folder.name === folderName && folder.parentId === parentId) || null;
  }

  async getOrCreateAppFolder(appFolderName = APP_FOLDER_NAME) {
    if (this.appFolderId && this.folders[this.appFolderId]) {
      return this.appFolderId;
    }
    let folder = await this.findFolder(appFolderName, 'root');
    if (!folder) {
      folder = await this.createFolder(appFolderName, 'root');
    }
    this.appFolderId = folder ? folder.id : null;
    this._saveState();
    return this.appFolderId;
  }

  async listFiles(folderId = null, mimeType = 'application/json') {
    if (mimeType !== 'application/json') return [];
    const targetFolderId = folderId || (await this.getOrCreateAppFolder());
    if (!targetFolderId) return [];
    return Object.values(this.files)
      .filter((file) => file.parentId === targetFolderId)
      .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
      .map((file) => ({ id: file.id, name: file.name, modifiedTime: file.modifiedTime }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null) {
    let targetFolderId = folderId;
    const id = fileId || `file-${this.fileCounter++}`;
    if (!fileId) {
      targetFolderId = targetFolderId || (await this.getOrCreateAppFolder());
      if (!targetFolderId) return null;
    } else {
      targetFolderId = targetFolderId || (this.files[id]?.parentId ?? null);
    }
    const now = new Date().toISOString();
    this.files[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId: targetFolderId,
      modifiedTime: now,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    return this.files[fileId] ? this.files[fileId].content : null;
  }

  async uploadAndShareFile(fileContent, fileName, mimeType) {
    void mimeType;
    const info = await this.saveFile('shared', fileName, fileContent);
    return info ? info.id : null;
  }

  showFilePicker(callback, parentFolderId = null, mimeTypes = ['application/json']) {
    if (!this.signedIn) {
      if (callback) callback(new Error('Not signed in or token unavailable.'));
      return;
    }
    if (mimeTypes && !mimeTypes.includes('application/json')) {
      if (callback) callback(new Error('Unsupported mime type.'));
      return;
    }
    const targetFolderId = parentFolderId || this.appFolderId;
    const files = Object.values(this.files).filter((file) => !targetFolderId || file.parentId === targetFolderId);
    const first = files[0];
    if (first) {
      if (callback) callback(null, { id: first.id, name: first.name });
    } else if (callback) {
      callback(new Error('No files available.'));
    }
  }

  async ensureAppFolder() {
    return this.getOrCreateAppFolder();
  }

  async deleteCharacterFile(fileId) {
    delete this.files[fileId];
    this._saveState();
  }
}
