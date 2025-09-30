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
        this.files = state.files || state.appData || {};
        this.folders = state.folders || {};
        this.fileCounter = state.fileCounter || 1;
        this.indexFileId = state.indexFileId || null;
        this.workspaceFolderId = state.workspaceFolderId || null;
        this.workspaceFolderName = state.workspaceFolderName || 'AioniaCS';
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
      indexFileId: this.indexFileId,
      workspaceFolderId: this.workspaceFolderId,
      workspaceFolderName: this.workspaceFolderName,
      signedIn: this.signedIn,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
  }

  _initState() {
    this.files = {};
    this.folders = {};
    this.fileCounter = 1;
    this.indexFileId = null;
    this.workspaceFolderId = null;
    this.workspaceFolderName = 'AioniaCS';
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

  setWorkspaceFolder(folder) {
    if (!folder || !folder.id) {
      throw new Error('Invalid workspace folder specified.');
    }
    this.workspaceFolderId = folder.id;
    this.workspaceFolderName = folder.name || this.workspaceFolderName;
    this.indexFileId = null;
    if (!this.folders[folder.id]) {
      this.folders[folder.id] = { id: folder.id, name: folder.name };
    }
    this._saveState();
  }

  clearWorkspaceFolder() {
    this.workspaceFolderId = null;
    this.indexFileId = null;
    this._saveState();
  }

  getWorkspaceFolderId() {
    return this.workspaceFolderId;
  }

  async ensureWorkspaceFolder(folderName = this.workspaceFolderName) {
    const folder = await this.getOrCreateAppFolder(folderName);
    if (folder) {
      this.setWorkspaceFolder(folder);
    }
    return folder;
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

  async getOrCreateAppFolder(appFolderName) {
    let folder = await this.findFolder(appFolderName);
    if (!folder) folder = await this.createFolder(appFolderName);
    return folder;
  }

  async listFiles(folderId, mimeType = 'application/json') {
    return Object.values(this.files)
      .filter((f) => f.parentId === folderId)
      .map((f) => ({ id: f.id, name: f.name }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null) {
    const id = fileId || `file-${this.fileCounter++}`;
    const parentId = fileId && this.files[fileId] ? this.files[fileId].parentId : folderId || this.workspaceFolderId;
    if (!parentId && !fileId) {
      throw new Error('Workspace folder not set.');
    }
    this.files[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    const file = this.files[fileId];
    return file ? file.content : null;
  }

  async uploadAndShareFile(fileContent, fileName, mimeType) {
    const info = await this.saveFile('drive', fileName, fileContent);
    return info.id;
  }

  showFilePicker(callback, parentFolderId = null, mimeTypes = ['application/json']) {
    const folderId = parentFolderId || this.workspaceFolderId;
    const files = Object.values(this.files).filter((f) => !folderId || f.parentId === folderId);
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

  async ensureIndexFile() {
    const folderId = this.getWorkspaceFolderId();
    if (!folderId) {
      throw new Error('Workspace folder is not set.');
    }

    if (this.indexFileId && this.files[this.indexFileId] && this.files[this.indexFileId].parentId === folderId) {
      return { id: this.indexFileId, name: 'character_index.json' };
    }

    const existing = Object.values(this.files).find((file) => file.parentId === folderId && file.name === 'character_index.json');
    if (existing) {
      this.indexFileId = existing.id;
      this._saveState();
      return { id: existing.id, name: existing.name };
    }

    const created = await this.saveFile(folderId, 'character_index.json', '[]');
    this.indexFileId = created?.id || null;
    this._saveState();
    return created;
  }

  async readIndexFile() {
    const info = await this.ensureIndexFile();
    const content = await this.loadFileContent(info.id);
    try {
      return JSON.parse(content || '[]');
    } catch {
      return [];
    }
  }

  async writeIndexFile(indexData) {
    const info = await this.ensureIndexFile();
    const folderId = this.getWorkspaceFolderId();
    return this.saveFile(folderId, 'character_index.json', JSON.stringify(indexData, null, 2), info.id);
  }

  async addIndexEntry(entry) {
    const index = await this.readIndexFile();
    index.push({ ...entry, updatedAt: new Date().toISOString() });
    await this.writeIndexFile(index);
  }

  async renameIndexEntry(id, newName) {
    const index = await this.readIndexFile();
    index.forEach((e) => {
      if (e.id === id) {
        e.characterName = newName;
        e.updatedAt = new Date().toISOString();
      }
    });
    await this.writeIndexFile(index);
  }

  async removeIndexEntry(id) {
    const index = await this.readIndexFile();
    const filtered = index.filter((e) => e.id !== id);
    await this.writeIndexFile(filtered);
  }

  async createCharacterFile(data) {
    const folderId = this.getWorkspaceFolderId();
    if (!folderId) {
      throw new Error('Workspace folder is not set.');
    }
    const fileName = `${(data.character?.name || '名もなき冒険者').replace(/[\\/:*?"<>|]/g, '_')}.json`;
    return this.saveFile(folderId, fileName, JSON.stringify(data, null, 2));
  }

  async updateCharacterFile(id, data) {
    const folderId = this.getWorkspaceFolderId();
    if (!folderId) {
      throw new Error('Workspace folder is not set.');
    }
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
    await this.removeIndexEntry(id);
  }
}

window.MockGoogleDriveManager = MockGoogleDriveManager;
