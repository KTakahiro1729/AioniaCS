import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';

let singletonInstance = null;

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/';

function sanitizeFileName(name) {
  const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || '名もなき冒険者';
}

function toBlob(content, mimeType) {
  if (content instanceof Blob) {
    return content;
  }
  if (typeof content === 'string') {
    return new Blob([content], { type: mimeType });
  }
  if (content instanceof ArrayBuffer) {
    return new Blob([content], { type: mimeType });
  }
  if (ArrayBuffer.isView(content)) {
    const view = content;
    const slice = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    return new Blob([slice], { type: mimeType });
  }
  throw new Error('Unsupported file content type for Drive upload');
}

function createJsonResponse(body) {
  return JSON.stringify(body ?? {});
}

export class GoogleDriveManager {
  constructor() {
    if (singletonInstance) {
      throw new Error('GoogleDriveManager has already been instantiated. Use getGoogleDriveManagerInstance().');
    }

    this.accessTokenProvider = null;
    this.cachedToken = null;
    this.configFileName = 'aioniacs.cfg';
    this.configFileId = null;
    this.config = null;
    this.cachedFolderPath = null;
    this.configuredFolderId = null;
    this.defaultFolderPath = '慈悲なきアイオニア';

    singletonInstance = this;
  }

  setAccessTokenProvider(provider) {
    this.accessTokenProvider = provider;
  }

  setAccessToken(token) {
    this.cachedToken = token || null;
  }

  clearAccessToken() {
    this.cachedToken = null;
  }

  async ensureAccessToken() {
    if (this.accessTokenProvider) {
      const token = await this.accessTokenProvider();
      if (!token) {
        throw new Error('Access token provider did not return a token');
      }
      return token;
    }
    if (this.cachedToken) {
      return this.cachedToken;
    }
    throw new Error('No access token provider configured');
  }

  async request({ path, method = 'GET', params, headers = {}, body, base = 'api', responseType = 'json' }) {
    const token = await this.ensureAccessToken();
    const baseUrl = base === 'upload' ? DRIVE_UPLOAD_BASE : DRIVE_API_BASE;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(normalizedPath, baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        url.searchParams.append(key, value);
      });
    }

    const requestHeaders = new Headers({ Authorization: `Bearer ${token}` });
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        requestHeaders.set(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let details = null;
      try {
        details = JSON.parse(errorText);
      } catch (error) {
        details = errorText;
      }
      const error = new Error(`Drive API request failed with status ${response.status}`);
      error.status = response.status;
      error.details = details;
      throw error;
    }

    if (responseType === 'json') {
      if (response.status === 204) {
        return null;
      }
      return response.json();
    }
    if (responseType === 'arrayBuffer') {
      return response.arrayBuffer();
    }
    if (responseType === 'blob') {
      return response.blob();
    }
    if (responseType === 'text') {
      return response.text();
    }
    return null;
  }

  getDefaultConfig() {
    return { characterFolderPath: this.defaultFolderPath };
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

  async loadConfig() {
    if (this.config) {
      return this.config;
    }

    const escapedName = this.configFileName.replace(/'/g, "\\'");
    const listResponse = await this.request({
      path: '/files',
      params: {
        q: `name='${escapedName}' and 'root' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      },
    });

    const file = listResponse?.files?.[0];
    if (file?.id) {
      this.configFileId = file.id;
      const content = await this.request({
        path: `/files/${file.id}`,
        params: { alt: 'media' },
        responseType: 'text',
      });
      try {
        const parsed = JSON.parse(content || '{}');
        this.config = {
          ...this.getDefaultConfig(),
          ...parsed,
          characterFolderPath: this.normalizeFolderPath(parsed.characterFolderPath),
        };
        return this.config;
      } catch (error) {
        console.error('Failed to parse config file. Using default config.', error);
      }
    }

    this.config = this.getDefaultConfig();
    await this.saveConfig();
    return this.config;
  }

  async saveConfig() {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }

    const payload = createJsonResponse(this.config);
    const result = await this.saveFile('root', this.configFileName, payload, this.configFileId, 'application/json');
    if (result?.id) {
      this.configFileId = result.id;
    }
    return result;
  }

  async setCharacterFolderPath(path) {
    const config = await this.loadConfig();
    const normalized = this.normalizeFolderPath(path);
    config.characterFolderPath = normalized;
    this.cachedFolderPath = null;
    this.configuredFolderId = null;
    await this.saveConfig();
    return normalized;
  }

  async findFolder(name, parentId = 'root') {
    const escapedName = name.replace(/'/g, "\\'");
    const response = await this.request({
      path: '/files',
      params: {
        q: `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and '${parentId}' in parents and trashed=false`,
        fields: 'files(id, name, parents)',
        spaces: 'drive',
      },
    });
    return response?.files?.[0] || null;
  }

  async createFolder(name, parentId = 'root') {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };
    const response = await this.request({
      path: '/files',
      method: 'POST',
      params: { fields: 'id, name, parents' },
      headers: { 'Content-Type': 'application/json' },
      body: createJsonResponse(metadata),
    });
    return response;
  }

  async ensureFolderPath(path) {
    const segments = this.getFolderSegments(path);
    let parentId = 'root';
    let currentId = null;

    for (const segment of segments) {
      const existing = await this.findFolder(segment, parentId);
      if (existing?.id) {
        currentId = existing.id;
      } else {
        const created = await this.createFolder(segment, parentId);
        currentId = created?.id || null;
      }

      if (!currentId) {
        throw new Error(`Failed to create or locate folder segment: ${segment}`);
      }
      parentId = currentId;
    }

    return currentId;
  }

  async findOrCreateConfiguredCharacterFolder() {
    const config = await this.loadConfig();
    const normalizedPath = this.normalizeFolderPath(config.characterFolderPath);

    if (this.configuredFolderId && this.cachedFolderPath === normalizedPath) {
      return this.configuredFolderId;
    }

    const folderId = await this.ensureFolderPath(normalizedPath);
    this.configuredFolderId = folderId;
    this.cachedFolderPath = normalizedPath;
    return folderId;
  }

  async listFiles(folderId, mimeTypes = []) {
    const mimeQuery =
      Array.isArray(mimeTypes) && mimeTypes.length > 0 ? ` and (${mimeTypes.map((type) => `mimeType='${type}'`).join(' or ')})` : '';
    const response = await this.request({
      path: '/files',
      params: {
        q: `'${folderId}' in parents and trashed=false${mimeQuery}`,
        fields: 'files(id, name, mimeType)',
        orderBy: 'modifiedTime desc',
        pageSize: 1000,
      },
    });
    return response?.files || [];
  }

  async saveFile(folderId, fileName, fileContent, fileId = null, mimeType = 'application/json') {
    const metadata = {
      name: fileName,
      mimeType,
    };
    if (!fileId && folderId) {
      metadata.parents = [folderId];
    }

    const fileBlob = toBlob(fileContent, mimeType);
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const method = fileId ? 'PATCH' : 'POST';
    const path = fileId ? `/files/${fileId}` : '/files';
    const params = { uploadType: 'multipart', fields: 'id, name, parents' };

    try {
      const response = await this.request({
        path,
        method,
        params,
        base: 'upload',
        body: form,
        responseType: 'json',
      });
      if (response?.id) {
        return { id: response.id, name: response.name || fileName };
      }
      return null;
    } catch (error) {
      if (error.status === 404) {
        throw new Error('Parent folder not found. Please select a new folder.');
      }
      throw error;
    }
  }

  async loadFileContent(fileId) {
    return this.request({
      path: `/files/${fileId}`,
      params: { alt: 'media' },
      responseType: 'arrayBuffer',
    });
  }

  async findFileByName(fileName) {
    if (!fileName) {
      return null;
    }
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) {
      return null;
    }
    const response = await this.listFiles(folderId, []);
    return response.find((file) => file.name === fileName) || null;
  }

  async isFileInConfiguredFolder(fileId) {
    if (!fileId) {
      return false;
    }
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) {
      return false;
    }
    const response = await this.request({
      path: `/files/${fileId}`,
      params: { fields: 'id, parents' },
    });
    const parents = response?.parents;
    return Array.isArray(parents) ? parents.includes(folderId) : false;
  }

  async createCharacterFile(payload) {
    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) {
      return null;
    }
    return this.saveFile(folderId, fileName, payload?.content || '', null, mimeType);
  }

  async updateCharacterFile(id, payload) {
    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) {
      return null;
    }
    return this.saveFile(folderId, fileName, payload?.content || '', id, mimeType);
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? deserializeCharacterPayload(content) : null;
  }

  async deleteCharacterFile(id) {
    if (!id) {
      return;
    }
    await this.request({ path: `/files/${id}`, method: 'DELETE' });
  }

  async uploadAndShareFile(fileContent, fileName, mimeType = 'application/json') {
    const saved = await this.saveFile('root', fileName, fileContent, null, mimeType);
    if (!saved?.id) {
      return null;
    }
    const link = await this.ensureFilePublic(saved.id);
    return link ? saved.id : null;
  }

  async ensureFilePublic(fileId) {
    if (!fileId) {
      console.error('No fileId provided to ensureFilePublic.');
      return null;
    }
    try {
      await this.request({
        path: `/files/${fileId}/permissions`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: createJsonResponse({ role: 'reader', type: 'anyone' }),
      });
    } catch (error) {
      const reason = error?.details?.error?.errors?.[0]?.reason;
      if (error.status !== 409 && reason !== 'alreadyExists') {
        console.error('Failed to update file permissions for sharing:', error);
        return null;
      }
    }

    const file = await this.request({
      path: `/files/${fileId}`,
      params: { fields: 'id, webViewLink, webContentLink' },
    });
    if (file?.webViewLink) {
      return file.webViewLink;
    }
    if (file?.webContentLink) {
      return file.webContentLink;
    }
    return `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;
  }
}

export function initializeGoogleDriveManager() {
  if (singletonInstance) {
    return singletonInstance;
  }
  return new GoogleDriveManager();
}

export function getGoogleDriveManagerInstance() {
  if (!singletonInstance) {
    throw new Error('GoogleDriveManager has not been initialized. Call initializeGoogleDriveManager() first.');
  }
  return singletonInstance;
}

export function isGoogleDriveManagerInitialized() {
  return Boolean(singletonInstance);
}

export function resetGoogleDriveManagerForTests() {
  singletonInstance = null;
}
