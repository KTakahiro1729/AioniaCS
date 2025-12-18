import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';

/**
 * Manages interactions with Google Drive and Google Sign-In.
 */
let singletonInstance = null;

function uint8ArrayToBase64(bytes) {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function prepareMultipartPayload(fileContent) {
  if (typeof fileContent === 'string') {
    return { body: fileContent, transferEncoding: '' };
  }
  if (fileContent instanceof ArrayBuffer) {
    return prepareMultipartPayload(new Uint8Array(fileContent));
  }
  if (ArrayBuffer.isView(fileContent)) {
    const bytes = fileContent instanceof Uint8Array ? fileContent : new Uint8Array(fileContent.buffer);
    return { body: uint8ArrayToBase64(bytes), transferEncoding: 'Content-Transfer-Encoding: base64\r\n' };
  }
  throw new Error('Unsupported file content type for Drive upload');
}

function sanitizeFileName(name) {
  const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || '名もなき冒険者';
}

export class GoogleDriveManager {
  constructor(apiKey, clientId) {
    if (singletonInstance) {
      throw new Error('GoogleDriveManager has already been instantiated. Use getGoogleDriveManagerInstance().');
    }

    this.apiKey = apiKey;
    this.clientId = clientId;
    this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
    this.scope = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
    this.gapiLoadedCallback = null;
    this.pickerApiLoaded = false;
    this.aioniaFolderId = null;
    this.gapiLoadPromise = null;
    this.currentTokenInfo = null;
    this.tokenRefreshPromise = null;
    this.authStatusEndpoint = '/api/auth/status';
    this.loginEndpoint = '/api/auth/login';
    this.logoutEndpoint = '/api/auth/logout';
    this.configEndpoint = '/api/user/config';
    this.config = null;
    this.cachedFolderPath = null;

    // Bind methods
    this.handleSignIn = this.handleSignIn.bind(this);
    this.handleSignOut = this.handleSignOut.bind(this);

    singletonInstance = this;
  }

  getDefaultConfig() {
    return { characterFolderPath: '慈悲なきアイオニア', folderId: null, folderName: null };
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

  async buildFolderPathFromId(folderId) {
    if (!folderId) {
      return null;
    }
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for buildFolderPathFromId.');
      return null;
    }

    await this.ensureAccessToken();

    const segments = [];
    let currentId = folderId;
    const visited = new Set();
    let iterations = 0;
    const maxDepth = 50;

    while (currentId && currentId !== 'root' && iterations < maxDepth) {
      if (visited.has(currentId)) {
        break;
      }
      visited.add(currentId);
      iterations += 1;

      try {
        const response = await gapi.client.drive.files.get({
          fileId: currentId,
          fields: 'id, name, parents',
        });
        const file = response.result;
        if (!file) {
          break;
        }
        if (file.name) {
          segments.unshift(file.name);
        }
        const parents = Array.isArray(file.parents) ? file.parents : [];
        if (parents.length === 0) {
          break;
        }
        if (parents.includes('root')) {
          break;
        }
        [currentId] = parents;
      } catch (error) {
        console.log('Error resolving folder path:', error);
        break;
      }
    }

    if (segments.length === 0) {
      return null;
    }

    return this.normalizeFolderPath(segments.join('/'));
  }

  async loadConfig() {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await fetch(this.configEndpoint, { credentials: 'include' });
      if (response.ok) {
        const data = (await response.json()) || {};
        const normalizedPath = this.normalizeFolderPath(
          data.folder_path || data.characterFolderPath || this.getDefaultConfig().characterFolderPath,
        );
        this.config = {
          ...this.getDefaultConfig(),
          characterFolderPath: normalizedPath,
          folderId: data.folder_id ?? null,
          folderName: data.folder_name ?? null,
        };
        if (this.config.folderId) {
          this.aioniaFolderId = this.config.folderId;
          this.cachedFolderPath = normalizedPath;
        }
        return this.config;
      }
    } catch (error) {
      console.error('Error loading config from D1:', error);
    }

    this.config = this.getDefaultConfig();
    return this.config;
  }

  async saveConfig() {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }

    const payload = {
      folder_id: this.config.folderId || null,
      folder_name: this.config.folderName || null,
      folder_path: this.config.characterFolderPath || this.getDefaultConfig().characterFolderPath,
    };

    try {
      const response = await fetch(this.configEndpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to persist Drive config.');
      }
      return true;
    } catch (error) {
      console.error('Error saving config to D1:', error);
      return false;
    }
  }

  async setCharacterFolderPath(path) {
    const config = await this.loadConfig();
    const normalized = this.normalizeFolderPath(path);
    config.characterFolderPath = normalized;
    config.folderId = null;
    config.folderName = null;
    this.aioniaFolderId = null;
    this.cachedFolderPath = null;
    await this.saveConfig();
    return normalized;
  }

  /**
   * Called when the Google API script (api.js) is loaded.
   * Initializes the GAPI client.
   * @returns {Promise<void>}
   */
  onGapiLoad() {
    if (this.gapiLoadPromise) {
      return this.gapiLoadPromise;
    }

    this.gapiLoadPromise = new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined' || !gapi.load) {
        const err = new Error('GAPI core script not available for gapi.load.');
        console.error('GDM: ' + err.message);
        return reject(err);
      }
      gapi.load('client:picker', () => {
        if (typeof gapi.client === 'undefined' || !gapi.client.init) {
          const err = new Error('GAPI client script not available for gapi.client.init.');
          console.error('GDM: ' + err.message);
          return reject(err);
        }
        gapi.client
          .init({
            apiKey: this.apiKey,
            discoveryDocs: this.discoveryDocs,
            // scope: this.scope, // Scope is handled by GIS token client for Drive data access
          })
          .then(() => {
            this.pickerApiLoaded = true;
            console.log('GDM: GAPI client and Picker initialized.');
            resolve();
          })
          .catch((error) => {
            console.error('GDM: Error initializing GAPI client:', error);
            reject(error);
          });
      });
    });

    return this.gapiLoadPromise;
  }

  /**
   * Fetches an access token from the server and applies it to gapi.
   * @returns {Promise<string>}
   */
  getCachedAccessToken() {
    if (typeof gapi === 'undefined' || !gapi.client || typeof gapi.client.getToken !== 'function') {
      return null;
    }

    const now = Date.now();
    const existingToken = gapi.client.getToken();
    if (
      existingToken?.access_token &&
      this.currentTokenInfo?.accessToken === existingToken.access_token &&
      this.currentTokenInfo?.expiresAt > now
    ) {
      return existingToken.access_token;
    }

    return null;
  }

  async ensureAccessToken() {
    if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.setToken) {
      throw new Error('GAPI client is not initialized for token application.');
    }

    const now = Date.now();
    const existingToken = typeof gapi.client.getToken === 'function' ? gapi.client.getToken() : null;
    if (this.currentTokenInfo?.expiresAt > now && existingToken?.access_token === this.currentTokenInfo.accessToken) {
      return this.currentTokenInfo.accessToken;
    }

    if (this.currentTokenInfo?.expiresAt > now && this.currentTokenInfo.accessToken && !existingToken?.access_token) {
      gapi.client.setToken({ access_token: this.currentTokenInfo.accessToken });
      return this.currentTokenInfo.accessToken;
    }

    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      const response = await fetch(this.authStatusEndpoint, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Authentication required.');
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('Access token not available from server.');
      }

      const expiresAt = now + ((data.expires_in || 3600) * 1000 - 5000);
      this.currentTokenInfo = { accessToken: data.access_token, expiresAt };
      gapi.client.setToken({ access_token: data.access_token, expires_in: data.expires_in });
      return data.access_token;
    })();

    try {
      return await this.tokenRefreshPromise;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  async restoreSession() {
    try {
      await this.ensureAccessToken();
      return true;
    } catch (error) {
      console.error('Failed to restore session:', error);
      if (gapi.client && typeof gapi.client.setToken === 'function') {
        gapi.client.setToken('');
      }
      this.currentTokenInfo = null;
      return false;
    }
  }

  async handleSignIn() {
    if (typeof window === 'undefined') return false;

    return new Promise((resolve) => {
      // ポップアップを画面中央に配置するための計算
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      // 認証エンドポイントをポップアップで開く
      const popup = window.open(this.loginEndpoint, 'google_auth_popup', `width=${width},height=${height},top=${top},left=${left}`);

      if (!popup) {
        console.error('Popup blocked');
        alert('ポップアップがブロックされました。許可してください。');
        resolve(false);
        return;
      }

      // バックエンドからのメッセージ受信リスナー
      const receiveMessage = async (event) => {
        // セキュリティチェック: オリジンが一致しない場合は無視
        if (event.origin !== window.location.origin) return;

        // バックエンドから送信されるメッセージタイプを確認
        if (event.data && event.data.type === 'AIONIACS_AUTH_SUCCESS') {
          window.removeEventListener('message', receiveMessage);

          // ポップアップ認証成功後、セッションを復元してトークンを取得する
          const success = await this.restoreSession();
          resolve(success);
        }
      };

      window.addEventListener('message', receiveMessage);
    });
  }

  async handleSignOut(callback) {
    try {
      await fetch(this.logoutEndpoint, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Failed to logout:', error);
    }

    if (typeof gapi !== 'undefined' && gapi.client && typeof gapi.client.setToken === 'function') {
      gapi.client.setToken('');
    }

    this.currentTokenInfo = null;
    if (callback) callback();
  }

  // --- Placeholder methods for Drive functionality ---

  /**
   * Creates a new folder in Google Drive.
   * @param {string} folderName - The name for the new folder.
   * @returns {Promise<string|null>} The ID of the created folder, or null on error.
   */
  async createFolder(folderName, parentId = 'root') {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded.');
      return null;
    }
    await this.ensureAccessToken();
    try {
      const response = await gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined,
        },
        fields: 'id, name',
      });
      console.log('Folder created successfully:', response.result);
      return response.result;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  /**
   * Finds a folder by name in Google Drive.
   * @param {string} folderName - The name of the folder to find.
   * @returns {Promise<string|null>} The ID of the folder if found, otherwise null.
   */
  async findFolder(folderName, parentId = 'root') {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded.');
      return null;
    }
    await this.ensureAccessToken();
    try {
      const escapedName = folderName.replace(/'/g, "\\'");
      const response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and '${parentId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });
      const files = response.result.files;
      if (files && files.length > 0) {
        console.log('Folder found:', files[0]);
        return files[0];
      } else {
        console.log('Folder not found:', folderName);
        return null;
      }
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  /**
   * Gets an existing folder's ID or creates it if it doesn't exist.
   * @param {string} appFolderName - The name of the folder.
   * @returns {Promise<string|null>} The folder ID, or null on error.
   */
  async getOrCreateAppFolder(appFolderName) {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for getOrCreateAppFolder.');
      return null;
    }
    try {
      let folder = await this.findFolder(appFolderName, 'root');
      if (!folder) {
        console.log(`Folder "${appFolderName}" not found, creating it.`);
        folder = await this.createFolder(appFolderName, 'root');
      }
      return folder;
    } catch (error) {
      console.error(`Error in getOrCreateAppFolder for "${appFolderName}":`, error);
      return null;
    }
  }

  /**
   * Lists files in a given folder with a specific MIME type.
   * @param {string} folderId - The ID of the folder to list files from.
   * @param {string} mimeType - The MIME type of files to list.
   * @returns {Promise<Array<{id: string, name: string}>>} A list of files, or empty array on error.
   */
  async listFiles(folderId, mimeType = 'application/json') {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for listFiles.');
      return [];
    }
    await this.ensureAccessToken();
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='${mimeType}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });
      return response.result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Saves a file (creates or updates) to Google Drive.
   * @param {string} folderId - The ID of the parent folder (used if creating a new file).
   * @param {string} fileName - The name of the file.
   * @param {string} fileContent - The content of the file (JSON string).
   * @param {string|null} fileId - The ID of the file to update, or null to create a new file.
   * @returns {Promise<{id: string, name: string}|null>} File ID and name, or null on error.
   */
  async saveFile(folderId, fileName, fileContent, fileId = null, mimeType = 'application/json') {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for saveFile.');
      return null;
    }

    await this.ensureAccessToken();

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;
    const metadata = {
      name: fileName,
      mimeType,
    };
    let payload;
    try {
      payload = prepareMultipartPayload(fileContent);
    } catch (error) {
      console.error('Unsupported file content for Drive upload:', error);
      return null;
    }

    if (fileId) {
      try {
        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n${payload.transferEncoding}\r\n` +
          payload.body +
          closeDelim;

        const response = await gapi.client.request({
          path: `/upload/drive/v3/files/${fileId}`,
          method: 'PATCH',
          params: { uploadType: 'multipart' },
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });
        console.log('File updated successfully:', response.result);
        return { id: response.result.id, name: response.result.name };
      } catch (error) {
        // 404エラーの場合、ファイルが存在しないと判断し、新規作成フローに進む
        if (error.status === 404) {
          console.error('Error creating file: The parent folder was not found.', error);
          // UI側でハンドリングできるよう、具体的なエラーをスローする
          throw new Error('Parent folder not found. Please select a new folder.');
        } else {
          // その他の作成エラー
          console.error('Error creating new file:', error);
          if (error.result && error.result.error) {
            console.error('Detailed error:', error.result.error.message);
          }
          return null;
        }
      }
    }

    try {
      const createMetadata = { ...metadata };
      if (folderId) {
        createMetadata.parents = [folderId];
      }
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(createMetadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n${payload.transferEncoding}\r\n` +
        payload.body +
        closeDelim;

      const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart', fields: 'id,name' },
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
      });
      console.log('File created successfully:', response.result);
      return { id: response.result.id, name: response.result.name };
    } catch (error) {
      console.error('Error creating new file:', error);
      if (error.result && error.result.error) {
        console.error('Detailed error:', error.result.error.message);
      }
      return null;
    }
  }

  /**
   * Loads the content of a file from Google Drive.
   * @param {string} fileId - The ID of the file to load.
   * @returns {Promise<string|null>} The file content as a string, or null on error.
   */
  async loadFileContent(fileId) {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for loadFileContent.');
      return null;
    }
    await this.ensureAccessToken();
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });
      const { body } = response;
      if (body instanceof ArrayBuffer) {
        return body;
      }
      if (body && typeof body === 'object' && typeof body.byteLength === 'number') {
        return body;
      }
      if (typeof body === 'string') {
        return body;
      }
      if (typeof response.result === 'object') {
        return JSON.stringify(response.result);
      }
      return response.result || null;
    } catch (error) {
      console.error('Error loading file content:', error);
      if (error.result && error.result.error) {
        console.error('Detailed error:', error.result.error.message);
      }
      return null;
    }
  }

  /**
   * Finds or creates the configured character folder in the user's Drive root.
   * @returns {Promise<string|null>} The ID of the folder, or null if not available.
   */
  async findOrCreateConfiguredCharacterFolder() {
    const config = await this.loadConfig();
    if (!config) {
      return null;
    }

    const normalizedPath = this.normalizeFolderPath(config.characterFolderPath);
    if (config.folderId) {
      this.aioniaFolderId = config.folderId;
      this.cachedFolderPath = normalizedPath;
      return config.folderId;
    }

    if (this.aioniaFolderId && this.cachedFolderPath === normalizedPath) {
      return this.aioniaFolderId;
    }

    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for findOrCreateConfiguredCharacterFolder.');
      return config.folderId || null;
    }

    const segments = this.getFolderSegments(normalizedPath);
    let parentId = 'root';
    let currentId = config.folderId || null;

    if (currentId) {
      this.aioniaFolderId = currentId;
      this.cachedFolderPath = normalizedPath;
      return currentId;
    }

    for (const segment of segments) {
      const existing = await this.findFolder(segment, parentId);
      if (existing && existing.id) {
        currentId = existing.id;
      } else {
        const created = await this.createFolder(segment, parentId);
        currentId = created?.id || null;
      }

      if (!currentId) {
        console.error(`Failed to find or create folder segment: ${segment}`);
        return null;
      }
      parentId = currentId;
    }

    this.aioniaFolderId = currentId;
    this.cachedFolderPath = normalizedPath;
    config.folderId = currentId;
    config.folderName = segments.at(-1) || config.folderName;
    await this.saveConfig();
    return currentId;
  }

  async syncFolderMetadataFromFile(fileId) {
    if (!fileId || !gapi.client?.drive) {
      return;
    }

    try {
      await this.ensureAccessToken();
      const file = await gapi.client.drive.files.get({ fileId, fields: 'id, parents' });
      const parentId = file.result?.parents?.[0];
      if (!parentId) {
        return;
      }
      const folder = await gapi.client.drive.files.get({ fileId: parentId, fields: 'id, name' });
      const folderName = folder.result?.name || null;
      const normalizedPath = folderName
        ? this.normalizeFolderPath(folderName)
        : this.config?.characterFolderPath || this.getDefaultConfig().characterFolderPath;
      this.config = this.config || this.getDefaultConfig();
      this.config.folderId = parentId;
      this.config.folderName = folderName;
      this.config.characterFolderPath = normalizedPath;
      this.aioniaFolderId = parentId;
      this.cachedFolderPath = normalizedPath;
      await this.saveConfig();
    } catch (error) {
      console.error('Failed to sync folder metadata from file selection:', error);
    }
  }

  /**
   * Finds a file by name inside the configured character folder.
   * @param {string} fileName - The target file name.
   * @returns {Promise<{id: string, name: string}|null>} File info or null when not found.
   */
  async findFileByName(fileName) {
    if (!fileName) return null;

    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return null;

    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for findFileByName.');
      return null;
    }

    await this.ensureAccessToken();

    const escapedName = fileName.replace(/'/g, "\\'");

    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name='${escapedName}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const file = response.result.files?.[0];
      return file || null;
    } catch (error) {
      console.error('Error finding file by name:', error);
      return null;
    }
  }

  /**
   * Deprecated no-op: retained for backward compatibility.
   * @returns {Promise<Array>}
   */
  async readIndexFile() {
    console.warn('readIndexFile is deprecated. Configured Drive folder now stores files directly.');
    return [];
  }

  /**
   * Deprecated no-op: retained for backward compatibility.
   */
  async writeIndexFile() {
    console.warn('writeIndexFile is deprecated. Configured Drive folder now stores files directly.');
    return null;
  }

  /**
   * Deprecated no-op: retained for backward compatibility.
   */
  async addIndexEntry() {
    console.warn('addIndexEntry is deprecated. Index file handling has been removed.');
  }

  /**
   * Deprecated no-op: retained for backward compatibility.
   */
  async renameIndexEntry() {
    console.warn('renameIndexEntry is deprecated. Index file handling has been removed.');
  }

  /**
   * Deprecated no-op: retained for backward compatibility.
   */
  async removeIndexEntry() {
    console.warn('removeIndexEntry is deprecated. Index file handling has been removed.');
  }

  /**
   * Uploads a file and sets sharing permissions.
   * @param {string|ArrayBuffer} fileContent
   * @param {string} fileName
   * @param {string} mimeType
   * @returns {Promise<string|null>} Uploaded file ID
   */
  async uploadAndShareFile(fileContent, fileName, mimeType) {
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for uploadAndShareFile.');
      return null;
    }
    await this.ensureAccessToken();
    try {
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;
      const metadata = { name: fileName, mimeType };
      const payload = prepareMultipartPayload(fileContent);
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n${payload.transferEncoding}\r\n` +
        payload.body +
        closeDelim;

      const res = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart', fields: 'id' },
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
      });

      await gapi.client.drive.permissions.create({
        fileId: res.result.id,
        resource: { role: 'reader', type: 'anyone' },
      });
      return res.result.id;
    } catch (error) {
      console.error('Error uploading and sharing file:', error);
      return null;
    }
  }

  /**
   * Ensures that a file is publicly accessible and returns a shareable link.
   * @param {string} fileId - The Drive file ID to publish.
   * @returns {Promise<string|null>} The shareable URL or null on failure.
   */
  async ensureFilePublic(fileId) {
    if (!fileId) {
      console.error('No fileId provided to ensureFilePublic.');
      return null;
    }

    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for ensureFilePublic.');
      return null;
    }

    await this.ensureAccessToken();

    try {
      await gapi.client.drive.permissions.create({
        fileId,
        resource: { role: 'reader', type: 'anyone' },
      });
    } catch (error) {
      const reason = error?.result?.error?.errors?.[0]?.reason;
      if (error.status !== 409 && reason !== 'alreadyExists') {
        console.error('Failed to update file permissions for sharing:', error);
        return null;
      }
    }

    try {
      const response = await gapi.client.drive.files.get({
        fileId,
        fields: 'id, webViewLink, webContentLink',
      });
      const file = response.result;
      if (file?.webViewLink) {
        return file.webViewLink;
      }
      if (file?.webContentLink) {
        return file.webContentLink;
      }
      return `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;
    } catch (error) {
      console.error('Failed to fetch share link from Drive:', error);
      return null;
    }
  }

  /**
   * Shows the Google File Picker to select a file without awaiting token refresh.
   * @param {function} callback - Function to call with the result (error, {id, name}).
   * @param {string} accessToken - Access token prepared by the caller.
   * @param {string|null} parentFolderId - Optional ID of the folder to start in.
   * @param {Array<string>} mimeTypes - Array of MIME types to filter by.
   */
  showFilePickerSync(callback, accessToken, parentFolderId = null, mimeTypes = ['application/json']) {
    if (!this.pickerApiLoaded) {
      console.error('Picker API not loaded yet.');
      if (callback) callback(new Error('Picker API not loaded.'));
      return;
    }

    const token = accessToken || this.getCachedAccessToken();
    if (!token) {
      console.error('User not signed in or token not available for Picker.');
      if (callback) callback(new Error('Not signed in or token unavailable.'));
      return;
    }

    const pickerCallback = (data) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        if (callback) callback(null, { id: doc.id, name: doc.name });
        this.syncFolderMetadataFromFile(doc.id);
      } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
        console.log('Picker cancelled by user.');
        if (callback) callback(new Error('Picker cancelled by user.'));
      }
    };

    const view = new google.picker.View(google.picker.ViewId.DOCS);
    if (parentFolderId) {
      view.setParent(parentFolderId);
    }
    if (mimeTypes && mimeTypes.length > 0) {
      view.setMimeTypes(mimeTypes.join(','));
    }

    const pickerBuilder = new google.picker.PickerBuilder()
      .setOrigin(window.location.origin)
      .addView(view)
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setOAuthToken(token)
      .setCallback(pickerCallback);

    const picker = pickerBuilder.build();
    picker.setVisible(true);
  }

  /**
   * Backward-compatible wrapper that uses any cached token.
   * @param {function} callback - Function to call with the result (error, {id, name}).
   * @param {string|null} parentFolderId - Optional ID of the folder to start in.
   * @param {Array<string>} mimeTypes - Array of MIME types to filter by.
   */
  showFilePicker(callback, parentFolderId = null, mimeTypes = ['application/json']) {
    const token = this.getCachedAccessToken();
    this.showFilePickerSync(callback, token, parentFolderId, mimeTypes);
  }

  /**
   * Shows the Google Folder Picker to select a folder.
   * @param {function} callback - Function to call with the result (error, {id, name}).
   */
  async showFolderPicker(callback) {
    if (!this.pickerApiLoaded) {
      console.error('Picker API not loaded yet for folder picker.');
      if (callback) callback(new Error('Picker API not loaded.'));
      return;
    }

    const cachedToken = this.getCachedAccessToken();
    if (!cachedToken) {
      try {
        await this.ensureAccessToken();
      } catch (error) {
        console.error('Failed to prepare Folder Picker token:', error);
        if (callback) callback(new Error('Authentication required.'));
        return;
      }
    }

    const token = gapi.client.getToken();
    if (!token) {
      console.error('User not signed in or token not available for Folder Picker.');
      if (callback) callback(new Error('Not signed in or token unavailable.'));
      return;
    }

    const pickerCallback = async (data) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const folder = data[google.picker.Response.DOCUMENTS][0];
        try {
          const path = await this.buildFolderPathFromId(folder.id);
          if (callback) callback(null, { id: folder.id, name: folder.name, path: path || folder.name });
        } catch (error) {
          console.error('Error resolving selected folder path:', error);
          if (callback) callback(error);
        }
      } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
        console.log('Folder Picker cancelled by user.');
        if (callback) callback(new Error('Folder Picker cancelled by user.'));
      }
    };

    const view = new google.picker.DocsView();
    view.setIncludeFolders(true);
    view.setSelectFolderEnabled(true);
    view.setMimeTypes('application/vnd.google-apps.folder');

    const pickerBuilder = new google.picker.PickerBuilder()
      .setOrigin(window.location.origin)
      .addView(view)
      .setTitle('Select a folder')
      .setOAuthToken(token.access_token)
      .setCallback(pickerCallback);

    const picker = pickerBuilder.build();
    picker.setVisible(true);
  }

  async isFileInConfiguredFolder(fileId) {
    if (!fileId) {
      return false;
    }
    const targetFolderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!targetFolderId) {
      return false;
    }
    if (!gapi.client || !gapi.client.drive) {
      console.error('GAPI client or Drive API not loaded for isFileInConfiguredFolder.');
      return false;
    }

    await this.ensureAccessToken();

    try {
      const response = await gapi.client.drive.files.get({
        fileId,
        fields: 'id, parents',
      });
      const parents = response.result?.parents || response.body?.parents;
      if (!Array.isArray(parents)) {
        return false;
      }
      return parents.includes(targetFolderId);
    } catch (error) {
      console.error('Error checking file location:', error);
      return false;
    }
  }

  /**
   * Creates a character data file inside the configured Drive folder.
   * @param {{content: string|ArrayBuffer|ArrayBufferView, mimeType?: string, name?: string}} payload
   */
  async createCharacterFile(payload) {
    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return null;
    return this.saveFile(folderId, fileName, payload?.content || '', null, mimeType);
  }

  /**
   * Updates an existing character file inside the configured Drive folder.
   * @param {string} id file ID
   * @param {{content: string|ArrayBuffer|ArrayBufferView, mimeType?: string, name?: string}} payload
   */
  async updateCharacterFile(id, payload) {
    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;
    const folderId = await this.findOrCreateConfiguredCharacterFolder();
    if (!folderId) return null;
    return this.saveFile(folderId, fileName, payload?.content || '', id, mimeType);
  }

  async renameFile(fileId, newName) {
    if (!fileId || !newName) {
      throw new Error('File ID and new name are required to rename a file.');
    }
    if (!gapi.client || !gapi.client.drive) {
      throw new Error('GAPI client or Drive API not loaded for renameFile.');
    }

    await this.ensureAccessToken();

    try {
      const response = await gapi.client.drive.files.update({
        fileId,
        fields: 'id, name',
        resource: { name: newName },
      });
      return { id: response.result.id, name: response.result.name };
    } catch (error) {
      console.error('Error renaming Drive file:', error);
      throw error;
    }
  }

  async loadCharacterFile(id) {
    const content = await this.loadFileContent(id);
    return content ? await deserializeCharacterPayload(content) : null;
  }

  async deleteCharacterFile(id) {
    if (!gapi.client || !gapi.client.drive) return null;
    await this.ensureAccessToken();
    await gapi.client.drive.files.delete({ fileId: id });
  }
}

export function initializeGoogleDriveManager(apiKey, clientId) {
  if (singletonInstance) {
    return singletonInstance;
  }

  return new GoogleDriveManager(apiKey, clientId);
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
