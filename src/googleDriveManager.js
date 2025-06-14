(function (global) {
  class GoogleDriveManager {
    constructor(accessToken) {
      this.accessToken = accessToken;
      this.baseUrl = "https://www.googleapis.com/drive/v3";
      this.uploadUrl = "https://www.googleapis.com/upload/drive/v3";
    }

    async _fetch(url, options = {}) {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        throw new Error(`Google API request failed: ${res.status}`);
      }
      return res;
    }

    async _fetchJSON(url, options = {}) {
      const res = await this._fetch(url, options);
      return res.json();
    }

    async _findIndexFile() {
      const q = "name = 'character_index.json' and trashed = false";
      const url = `${this.baseUrl}/files?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id%2Cname)`;
      const data = await this._fetchJSON(url);
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      return null;
    }

    async _createIndexFile() {
      const meta = {
        name: "character_index.json",
        parents: ["appDataFolder"],
        mimeType: "application/json",
      };
      const res = await this._fetchJSON(`${this.baseUrl}/files?fields=id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      const fileId = res.id;
      await this._fetch(`${this.uploadUrl}/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "[]",
      });
      return fileId;
    }

    async ensureIndexFile() {
      const found = await this._findIndexFile();
      if (found) return found;
      return this._createIndexFile();
    }

    async readIndex() {
      const id = await this.ensureIndexFile();
      const res = await this._fetch(`${this.baseUrl}/files/${id}?alt=media`);
      const text = await res.text();
      if (text) {
        return JSON.parse(text);
      }
      return [];
    }

    async _updateIndex(data) {
      const id = await this.ensureIndexFile();
      await this._fetch(`${this.uploadUrl}/files/${id}?uploadType=media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    async addOrUpdateIndexEntry(entry) {
      const list = await this.readIndex();
      const idx = list.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entry };
      } else {
        list.push(entry);
      }
      await this._updateIndex(list);
    }

    async removeIndexEntry(id) {
      const list = await this.readIndex();
      const updated = list.filter((e) => e.id !== id);
      await this._updateIndex(updated);
    }

    async createCharacterData(data) {
      const meta = {
        name: `${data.name || "character"}.json`,
        parents: ["appDataFolder"],
        mimeType: "application/json",
      };
      const createRes = await this._fetchJSON(
        `${this.baseUrl}/files?fields=id`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(meta),
        },
      );
      const fileId = createRes.id;
      await this._fetch(`${this.uploadUrl}/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await this.addOrUpdateIndexEntry({
        id: fileId,
        name: data.name || "",
        modifiedTime: new Date().toISOString(),
      });
      return fileId;
    }

    async readCharacterData(fileId) {
      const res = await this._fetch(
        `${this.baseUrl}/files/${fileId}?alt=media`,
      );
      const text = await res.text();
      return JSON.parse(text);
    }

    async deleteCharacterData(fileId) {
      await this._fetch(`${this.baseUrl}/files/${fileId}`, {
        method: "DELETE",
      });
      await this.removeIndexEntry(fileId);
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = GoogleDriveManager;
  } else {
    global.GoogleDriveManager = GoogleDriveManager;
  }
})(typeof window !== "undefined" ? window : global);
