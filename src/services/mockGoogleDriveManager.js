export class MockGoogleDriveManager {
  constructor() {
    this.files = new Map();
    this.indexContent = null; // if null, index file doesn't exist
    this._idCounter = 1;
  }

  async _ensureIndexFile() {
    if (this.indexContent === null) {
      this.indexContent = '[]';
      this.files.set('index', this.indexContent);
    }
    return { id: 'index', name: 'character_index.json' };
  }

  async _readIndexFile() {
    await this._ensureIndexFile();
    try {
      return JSON.parse(this.indexContent || '[]');
    } catch {
      throw new SyntaxError('Invalid JSON');
    }
  }

  async _writeIndexFile(data) {
    await this._ensureIndexFile();
    this.indexContent = JSON.stringify(data);
    this.files.set('index', this.indexContent);
    return { id: 'index', name: 'character_index.json' };
  }

  async _addIndexEntry(entry) {
    const idx = await this._readIndexFile();
    idx.push({ ...entry, updatedAt: new Date().toISOString() });
    await this._writeIndexFile(idx);
  }

  async _renameIndexEntry(id, newName) {
    const idx = await this._readIndexFile();
    idx.forEach((e) => {
      if (e.id === id) {
        e.characterName = newName;
        e.updatedAt = new Date().toISOString();
      }
    });
    await this._writeIndexFile(idx);
  }

  async _removeIndexEntry(id) {
    const idx = await this._readIndexFile();
    await this._writeIndexFile(idx.filter((e) => e.id !== id));
  }

  async _saveFile(folderId, name, content, fileId = null) {
    const id = fileId || `mock-${this._idCounter++}`;
    this.files.set(id, content);
    return { id, name };
  }

  async loadFileContent(id) {
    return this.files.has(id) ? this.files.get(id) : null;
  }

  async _createCharacterFile(data, name) {
    return this._saveFile('mock', name, JSON.stringify(data));
  }

  async _updateCharacterFile(id, data, name) {
    return this._saveFile('mock', name, JSON.stringify(data), id);
  }

  async _loadCharacterFile(id) {
    const text = await this.loadFileContent(id);
    if (text === null) return null;
    return JSON.parse(text);
  }

  async _deleteCharacterFile(id) {
    this.files.delete(id);
    await this._removeIndexEntry(id);
  }

  async listCharacters() {
    try {
      const info = await this._ensureIndexFile();
      if (!info) return [];
      const arr = await this._readIndexFile();
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((e) => e.id && e.characterName)
        .map((e) => ({ fileId: e.id, characterName: e.characterName, lastModified: e.updatedAt }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getCharacter(fileId) {
    return this._loadCharacterFile(fileId);
  }

  async saveCharacter(characterData, fileId) {
    const fileName = `${(characterData.name || 'character').replace(/[^\w.-]/g, '_')}.json`;
    if (fileId) {
      await this._updateCharacterFile(fileId, characterData, fileName);
      await this._renameIndexEntry(fileId, characterData.name || '');
    } else {
      const created = await this._createCharacterFile(characterData, fileName);
      fileId = created.id;
      await this._addIndexEntry({ id: created.id, name: created.name, characterName: characterData.name || '' });
    }
    const index = await this._readIndexFile();
    const entry = index.find((e) => e.id === fileId);
    return { fileId, characterName: entry.characterName, lastModified: entry.updatedAt };
  }

  async deleteCharacter(fileId) {
    await this._deleteCharacterFile(fileId);
  }
}
