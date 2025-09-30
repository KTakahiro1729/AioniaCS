import { DRIVE_FOLDER_NAME } from './googleDriveManager.js';

export class MockGoogleDriveManager {
  constructor(apiKey, clientId) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.storageKey = 'mockGoogleDriveData';
    console.log('MockGoogleDriveManager is active and uses localStorage.');
    this._loadState();
  }

  _loadState() {
    try {
      const storedState = localStorage.getItem(this.storageKey);
      if (storedState) {
        const state = JSON.parse(storedState);
        this.appData = state.appData;
        this.folders = state.folders;
        this.fileCounter = state.fileCounter;
        this.signedIn = state.signedIn;
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
      appData: this.appData,
      folders: this.folders,
      fileCounter: this.fileCounter,
      signedIn: this.signedIn,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
  }

  _initState() {
    this.appData = {};
    this.folders = {};
    this.fileCounter = 1;
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
    const id = `folder-${this.fileCounter++}`;
    const folder = { id, name: folderName };
    this.folders[id] = folder;
    this._saveState();
    return folder;
  }

  async findFolder(folderName) {
    return Object.values(this.folders).find((f) => f.name === folderName) || null;
  }

  async ensureAppFolder() {
    let folder = await this.findFolder(DRIVE_FOLDER_NAME);
    if (!folder) folder = await this.createFolder(DRIVE_FOLDER_NAME);
    return folder ? folder.id : null;
  }

  async listFiles(folderId = null, mimeType = 'application/json') {
    const targetFolderId = folderId || (await this.ensureAppFolder());
    if (!targetFolderId) return [];
    return Object.values(this.appData)
      .filter((f) => f.parentId === targetFolderId && f.mimeType === mimeType)
      .sort((a, b) => b.modifiedTime - a.modifiedTime)
      .map((f) => ({ id: f.id, name: f.name, modifiedTime: new Date(f.modifiedTime).toISOString() }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null) {
    const targetFolderId = fileId ? null : folderId || (await this.ensureAppFolder());
    const id = fileId || `file-${this.fileCounter++}`;
    const now = Date.now();
    this.appData[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId: fileId ? this.appData[fileId]?.parentId || targetFolderId : targetFolderId,
      mimeType: 'application/json',
      modifiedTime: now,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    const file = this.appData[fileId];
    return file ? file.content : null;
  }

  async uploadAndShareFile(fileContent, fileName, mimeType) {
    const info = await this.saveFile('drive', fileName, fileContent);
    return info.id;
  }

  showFilePicker(callback, parentFolderId = null, mimeTypes = ['application/json']) {
    const files = Object.values(this.appData).filter((f) => !parentFolderId || f.parentId === parentFolderId);
    const first = files[0];
    if (first) {
      if (callback) callback(null, { id: first.id, name: first.name });
    } else if (callback) {
      callback(new Error('No files available.'));
    }
  }

  showFolderPicker(callback) {
    const first = Object.values(this.folders)[0];
    if (first) {
      if (callback) callback(null, { id: first.id, name: first.name });
    } else if (callback) {
      callback(new Error('No folders available.'));
    }
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? JSON.parse(content) : null;
  }

  async deleteCharacterFile(id) {
    delete this.appData[id];
    this._saveState();
  }
}

window.MockGoogleDriveManager = MockGoogleDriveManager;
