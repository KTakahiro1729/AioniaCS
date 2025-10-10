const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const CONFIG_FILE_NAME = 'aionia-config.json';
const DEFAULT_FOLDER_PATH = '慈悲なきアイオニア';

let singletonInstance = null;

function encodeQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function toUint8Array(content) {
  if (content instanceof Uint8Array) {
    return content;
  }
  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content);
  }
  if (typeof content === 'string') {
    return new TextEncoder().encode(content);
  }
  if (content == null) {
    return new Uint8Array();
  }
  return new Uint8Array(content);
}

function sanitizeFileName(name) {
  const sanitized = (name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || '名もなき冒険者';
}

function createMultipartBody(metadata, fileContent, fileMimeType) {
  const boundary = `aionia_${Math.random().toString(16).slice(2)}`;
  const encoder = new TextEncoder();

  const preamble = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: ${fileMimeType}\r\n\r\n`,
  );

  const closing = encoder.encode(`\r\n--${boundary}--`);

  const body = new Blob([preamble, toUint8Array(fileContent), closing], {
    type: `multipart/related; boundary=${boundary}`,
  });

  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

export function createGoogleDriveManager({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation must be provided.');
  }

  async function driveFetch(
    accessToken,
    endpoint,
    { base = DRIVE_API_BASE, method = 'GET', headers = {}, body, responseType = 'json', supportsAllDrives = false } = {},
  ) {
    if (!accessToken) {
      throw new Error('アクセストークンが必要です');
    }

    const requestHeaders = { ...headers, Authorization: `Bearer ${accessToken}` };

    if (supportsAllDrives) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint = `${endpoint}${separator}supportsAllDrives=true&includeItemsFromAllDrives=true`;
    }

    const response = await fetchImpl(`${base}${endpoint}`, { method, headers: requestHeaders, body });
    if (!response.ok) {
      let errorMessage = `Drive API request failed (${response.status})`;
      try {
        const errorPayload = await response.json();
        errorMessage = errorPayload?.error?.message || errorMessage;
      } catch {
        // ignore JSON parse failures
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    if (responseType === 'arrayBuffer') {
      return response.arrayBuffer();
    }
    if (responseType === 'text') {
      return response.text();
    }
    return response.json();
  }

  async function findConfigFile(accessToken) {
    const params = {
      spaces: 'appDataFolder',
      q: `name = '${CONFIG_FILE_NAME}' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: 1,
    };

    const data = await driveFetch(accessToken, `/files?${encodeQuery(params)}`);
    if (!Array.isArray(data.files) || data.files.length === 0) {
      return null;
    }
    return data.files[0];
  }

  async function loadConfig(accessToken) {
    const file = await findConfigFile(accessToken);
    if (!file) {
      return getDefaultConfig();
    }

    try {
      const raw = await driveFetch(accessToken, `/files/${file.id}?alt=media`, { responseType: 'text' });
      const parsed = JSON.parse(raw);
      return {
        characterFolderPath: normalizeFolderPath(parsed?.characterFolderPath),
      };
    } catch (error) {
      console.warn('Failed to parse Drive config. Falling back to defaults.', error);
      return getDefaultConfig();
    }
  }

  async function saveConfig(accessToken, config) {
    const normalized = {
      characterFolderPath: normalizeFolderPath(config?.characterFolderPath),
    };

    const metadata = {
      name: CONFIG_FILE_NAME,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    };

    const bodyContent = new TextEncoder().encode(JSON.stringify(normalized));
    const { body, contentType } = createMultipartBody(metadata, bodyContent, 'application/json');

    const existing = await findConfigFile(accessToken);
    const endpoint = existing
      ? `/files/${encodeURIComponent(existing.id)}?uploadType=multipart&fields=id,name`
      : '/files?uploadType=multipart&fields=id,name';

    await driveFetch(accessToken, endpoint, {
      base: DRIVE_UPLOAD_BASE,
      method: existing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': contentType },
      body,
    });

    return normalized;
  }

  async function setCharacterFolderPath(accessToken, rawPath) {
    const normalized = normalizeFolderPath(rawPath);
    await ensureFolderPath(accessToken, normalized);
    await saveConfig(accessToken, { characterFolderPath: normalized });
    return normalized;
  }

  async function ensureConfiguredFolder(accessToken) {
    const config = await loadConfig(accessToken);
    return ensureFolderPath(accessToken, config.characterFolderPath);
  }

  async function ensureFolderPath(accessToken, path) {
    const segments = getFolderSegments(path);
    let parentId = 'root';
    let currentFolderId = null;

    for (const segment of segments) {
      const existing = await findFolder(accessToken, segment, parentId);
      if (existing) {
        currentFolderId = existing.id;
      } else {
        const created = await createFolder(accessToken, segment, parentId);
        currentFolderId = created?.id || null;
      }
      if (!currentFolderId) {
        break;
      }
      parentId = currentFolderId;
    }

    return currentFolderId;
  }

  async function findFolder(accessToken, name, parentId = 'root') {
    const safeName = name.replace(/'/g, "\\'");
    const parentsClause = parentId === 'root' ? "'root' in parents" : `'${parentId}' in parents`;
    const query = ["mimeType = 'application/vnd.google-apps.folder'", `name = '${safeName}'`, parentsClause, 'trashed = false'].join(
      ' and ',
    );

    const params = {
      q: query,
      spaces: 'drive',
      fields: 'files(id,name,parents)',
      pageSize: 1,
    };

    const data = await driveFetch(accessToken, `/files?${encodeQuery(params)}`, { supportsAllDrives: true });
    if (!Array.isArray(data.files) || data.files.length === 0) {
      return null;
    }
    return data.files[0];
  }

  async function createFolder(accessToken, name, parentId = 'root') {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : ['root'],
    };

    return driveFetch(accessToken, '/files?supportsAllDrives=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
  }

  async function listFiles(accessToken, folderId, { pageSize = 100 } = {}) {
    if (!folderId) {
      return [];
    }

    const parentsClause = folderId === 'root' ? "'root' in parents" : `'${folderId}' in parents`;
    const query = [`trashed = false`, parentsClause].join(' and ');

    const params = {
      q: query,
      orderBy: 'modifiedTime desc',
      spaces: 'drive',
      fields: 'files(id,name,mimeType,modifiedTime,parents)',
      pageSize,
    };

    const data = await driveFetch(accessToken, `/files?${encodeQuery(params)}`, { supportsAllDrives: true });
    return Array.isArray(data.files) ? data.files : [];
  }

  async function saveFile(accessToken, folderId, fileName, fileContent, fileId = null, mimeType = 'application/octet-stream') {
    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    };

    const contentBuffer = toUint8Array(fileContent);
    const { body, contentType } = createMultipartBody(metadata, contentBuffer, mimeType);

    const endpoint = fileId
      ? `/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,name,parents`
      : '/files?uploadType=multipart&fields=id,name,parents';

    return driveFetch(accessToken, endpoint, {
      base: DRIVE_UPLOAD_BASE,
      method: fileId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': contentType },
      body,
    });
  }

  async function createCharacterFile(accessToken, payload) {
    const folderId = await ensureConfiguredFolder(accessToken);
    if (!folderId) {
      throw new Error('保存先フォルダが見つかりませんでした');
    }

    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;

    return saveFile(accessToken, folderId, fileName, payload?.content || '', null, mimeType);
  }

  async function updateCharacterFile(accessToken, fileId, payload) {
    const mimeType = payload?.mimeType || 'application/zip';
    const extension = mimeType === 'application/zip' ? 'zip' : 'json';
    const fileName = `${sanitizeFileName(payload?.name)}.${extension}`;

    return saveFile(accessToken, null, fileName, payload?.content || '', fileId, mimeType);
  }

  async function isFileInConfiguredFolder(accessToken, fileId) {
    const folderId = await ensureConfiguredFolder(accessToken);
    if (!folderId) {
      return false;
    }

    const data = await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}?fields=parents`, {
      supportsAllDrives: true,
    });
    if (!data?.parents || !Array.isArray(data.parents)) {
      return false;
    }
    return data.parents.includes(folderId);
  }

  async function findFileByName(accessToken, fileName) {
    if (!fileName) {
      return null;
    }
    const folderId = await ensureConfiguredFolder(accessToken);
    if (!folderId) {
      return null;
    }

    const safeName = fileName.replace(/'/g, "\\'");
    const parentsClause = folderId === 'root' ? "'root' in parents" : `'${folderId}' in parents`;
    const query = [`name = '${safeName}'`, parentsClause, 'trashed = false'].join(' and ');

    const params = {
      q: query,
      spaces: 'drive',
      fields: 'files(id,name)',
      pageSize: 1,
    };

    const data = await driveFetch(accessToken, `/files?${encodeQuery(params)}`, { supportsAllDrives: true });
    if (!Array.isArray(data.files) || data.files.length === 0) {
      return null;
    }
    return data.files[0];
  }

  async function loadFileContent(accessToken, fileId) {
    return driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}?alt=media`, {
      responseType: 'arrayBuffer',
      supportsAllDrives: true,
    });
  }

  async function ensureFilePublic(accessToken, fileId) {
    if (!fileId) {
      return null;
    }

    try {
      await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'anyone', role: 'reader' }),
      });
    } catch (error) {
      const message = error?.message || '';
      const alreadyShared = message.includes('already exists') || message.includes('cannotAddOwner');
      if (!alreadyShared) {
        throw error;
      }
    }

    const metadata = await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}?fields=webViewLink,webContentLink`, {
      supportsAllDrives: true,
    });
    return metadata?.webViewLink || metadata?.webContentLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  function getDefaultConfig() {
    return { characterFolderPath: DEFAULT_FOLDER_PATH };
  }

  function normalizeFolderPath(rawPath) {
    const defaultPath = getDefaultConfig().characterFolderPath;
    if (typeof rawPath !== 'string' || rawPath.trim().length === 0) {
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

  function getFolderSegments(path) {
    return normalizeFolderPath(path).split('/');
  }

  return {
    getDefaultConfig,
    normalizeFolderPath,
    getFolderSegments,
    loadConfig,
    saveConfig,
    setCharacterFolderPath,
    ensureConfiguredFolder,
    ensureFolderPath,
    findFolder,
    createFolder,
    listFiles,
    saveFile,
    createCharacterFile,
    updateCharacterFile,
    isFileInConfiguredFolder,
    findFileByName,
    loadFileContent,
    ensureFilePublic,
  };
}

export function initializeGoogleDriveManager(options = {}) {
  if (singletonInstance) {
    return singletonInstance;
  }
  singletonInstance = createGoogleDriveManager(options);
  return singletonInstance;
}

export function getGoogleDriveManagerInstance() {
  if (!singletonInstance) {
    throw new Error('GoogleDriveManager has not been initialized. Call initializeGoogleDriveManager() first.');
  }
  return singletonInstance;
}

export function resetGoogleDriveManagerForTests() {
  singletonInstance = null;
}
