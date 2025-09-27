const STORAGE_PREFIX = 'aionia-cloud:';
const DEFAULT_DATA = { characters: {}, shares: {} };

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const memory = new Map();
  return {
    getItem(key) {
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      memory.set(key, value);
    },
    removeItem(key) {
      memory.delete(key);
    },
  };
}

const storage = getStorage();

function readUserData(userId) {
  if (!userId) {
    throw new Error('User ID is required for cloud operations.');
  }
  const raw = storage.getItem(STORAGE_PREFIX + userId);
  if (!raw) {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      characters: parsed.characters || {},
      shares: parsed.shares || {},
    };
  } catch (error) {
    console.error('Failed to parse stored cloud data. Resetting storage.', error);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeUserData(userId, data) {
  if (!userId) {
    throw new Error('User ID is required for cloud operations.');
  }
  storage.setItem(STORAGE_PREFIX + userId, JSON.stringify(data));
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CloudStorageService {
  async listCharacters(userId) {
    const data = readUserData(userId);
    return Object.values(data.characters).map(({ id, characterName, updatedAt }) => ({
      id,
      characterName,
      updatedAt,
    }));
  }

  async saveCharacter(userId, payload, fileId) {
    const data = readUserData(userId);
    const id = fileId || generateId('cloud');
    const updatedAt = new Date().toISOString();
    const characterName = payload?.character?.name || '名もなき冒険者';

    data.characters[id] = {
      id,
      characterName,
      updatedAt,
      payload,
    };

    writeUserData(userId, data);

    return { id, characterName, updatedAt };
  }

  async loadCharacter(userId, fileId) {
    const data = readUserData(userId);
    const entry = data.characters[fileId];
    return entry ? entry.payload : null;
  }

  async deleteCharacter(userId, fileId) {
    const data = readUserData(userId);
    if (data.characters[fileId]) {
      delete data.characters[fileId];
      writeUserData(userId, data);
    }
  }
}
