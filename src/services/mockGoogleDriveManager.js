export class MockGoogleDriveManager {
  constructor(apiKey, clientId) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.storageKey = "mockGoogleDriveData";
    console.log("MockGoogleDriveManager is active and uses localStorage.");
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
        this.indexFileId = state.indexFileId;
        this.signedIn = state.signedIn;
      } else {
        this._initState();
      }
    } catch (e) {
      console.error(
        "Failed to load mock state from localStorage, resetting.",
        e,
      );
      this._initState();
    }
    this.pickerApiLoaded = true;
  }

  _saveState() {
    const stateToSave = {
      appData: this.appData,
      folders: this.folders,
      fileCounter: this.fileCounter,
      indexFileId: this.indexFileId,
      signedIn: this.signedIn,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
  }

  _initState() {
    this.appData = {};
    this.folders = {};
    this.fileCounter = 1;
    this.indexFileId = null;
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
    const existing = Object.values(this.folders).find(
      (f) => f.name === folderName,
    );
    if (existing) return existing;
    const id = `folder-${this.fileCounter++}`;
    const folder = { id, name: folderName };
    this.folders[id] = folder;
    this._saveState();
    return folder;
  }

  async findFolder(folderName) {
    return (
      Object.values(this.folders).find((f) => f.name === folderName) || null
    );
  }

  async getOrCreateAppFolder(appFolderName) {
    let folder = await this.findFolder(appFolderName);
    if (!folder) folder = await this.createFolder(appFolderName);
    return folder;
  }

  async listFiles(folderId, mimeType = "application/json") {
    return Object.values(this.appData)
      .filter((f) => f.parentId === folderId)
      .map((f) => ({ id: f.id, name: f.name }));
  }

  async saveFile(folderId, fileName, fileContent, fileId = null) {
    const id = fileId || `file-${this.fileCounter++}`;
    this.appData[id] = {
      id,
      name: fileName,
      content: fileContent,
      parentId: folderId,
    };
    this._saveState();
    return { id, name: fileName };
  }

  async loadFileContent(fileId) {
    const file = this.appData[fileId];
    return file ? file.content : null;
  }

  async uploadAndShareFile(fileContent, fileName, mimeType) {
    const info = await this.saveFile("drive", fileName, fileContent);
    return info.id;
  }

  showFilePicker(
    callback,
    parentFolderId = null,
    mimeTypes = ["application/json"],
  ) {
    const files = Object.values(this.appData).filter(
      (f) => !parentFolderId || f.parentId === parentFolderId,
    );
    const first = files[0];
    if (first) {
      if (callback) callback(null, { id: first.id, name: first.name });
    } else if (callback) {
      callback(new Error("No files available."));
    }
  }

  showFolderPicker(callback) {
    const first = Object.values(this.folders)[0];
    if (first) {
      if (callback) callback(null, { id: first.id, name: first.name });
    } else if (callback) {
      callback(new Error("No folders available."));
    }
  }

  async ensureIndexFile() {
    if (this.indexFileId && this.appData[this.indexFileId]) {
      return { id: this.indexFileId, name: "character_index.json" };
    }
    const foundId = Object.keys(this.appData).find(
      (id) => this.appData[id].name === "character_index.json",
    );
    if (foundId) {
      this.indexFileId = foundId;
      this._saveState();
      return { id: foundId, name: "character_index.json" };
    }
    const created = await this.saveFile(
      "appDataFolder",
      "character_index.json",
      "[]",
    );
    this.indexFileId = created.id;
    this._saveState();
    return created;
  }

  async readIndexFile() {
    const info = await this.ensureIndexFile();
    const content = await this.loadFileContent(info.id);
    try {
      return JSON.parse(content || "[]");
    } catch {
      return [];
    }
  }

  async writeIndexFile(indexData) {
    const info = await this.ensureIndexFile();
    return this.saveFile(
      "appDataFolder",
      "character_index.json",
      JSON.stringify(indexData, null, 2),
      info.id,
    );
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

  async createCharacterFile(data, name) {
    return this.saveFile("appDataFolder", name, JSON.stringify(data, null, 2));
  }

  async updateCharacterFile(id, data, name) {
    return this.saveFile(
      "appDataFolder",
      name,
      JSON.stringify(data, null, 2),
      id,
    );
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? JSON.parse(content) : null;
  }

  async deleteCharacterFile(id) {
    delete this.appData[id];
    this._saveState();
    await this.removeIndexEntry(id);
  }
}

window.MockGoogleDriveManager = MockGoogleDriveManager;
