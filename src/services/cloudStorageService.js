import { ApiManager } from './apiManager.js';

const DEFAULT_CHARACTER_NAME = '名もなき冒険者';
const ID_PREFIX = 'cloud';

function generateId() {
  return `${ID_PREFIX}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveCharacterName(payload) {
  const name = payload?.character?.name;
  if (typeof name === 'string') {
    const trimmed = name.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return DEFAULT_CHARACTER_NAME;
}

function createApiManager(config) {
  if (config && typeof config === 'object') {
    const { apiManager, getAccessTokenSilently } = config;
    if (apiManager) {
      return apiManager;
    }
    if (typeof getAccessTokenSilently === 'function') {
      return new ApiManager(getAccessTokenSilently);
    }
  }

  if (typeof config === 'function') {
    return new ApiManager(config);
  }

  return new ApiManager();
}

export class CloudStorageService {
  constructor(config) {
    this.apiManager = createApiManager(config);
    this.metadataCache = new Map();
  }

  async listCharacters() {
    try {
      const response = await this.apiManager.listCharacters();
      const entries = Array.isArray(response?.characters) ? response.characters : [];

      if (entries.length === 0) {
        return [];
      }

      const results = await Promise.allSettled(
        entries.map(async (entry) => {
          const cached = this.metadataCache.get(entry.id);
          if (cached) {
            return {
              id: entry.id,
              characterName: cached.characterName,
              updatedAt: cached.updatedAt || entry.lastModified || null,
            };
          }

          const data = await this.apiManager.getCharacter(entry.id);
          const payload = data?.payload ?? data;
          const characterName = data?.characterName ?? resolveCharacterName(payload);
          const updatedAt = data?.updatedAt ?? entry.lastModified ?? null;

          this.metadataCache.set(entry.id, { characterName, updatedAt });

          return {
            id: data?.id ?? entry.id,
            characterName,
            updatedAt,
          };
        }),
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }

        console.error('Failed to load character metadata:', result.reason);
        const fallback = entries[index];
        return {
          id: fallback?.id,
          characterName: DEFAULT_CHARACTER_NAME,
          updatedAt: fallback?.lastModified ?? null,
        };
      });
    } catch (error) {
      console.error('Failed to list characters from cloud storage:', error);
      throw error;
    }
  }

  async saveCharacter(userId, payload, fileId) {
    const id = fileId || generateId();
    const updatedAt = new Date().toISOString();
    const characterName = resolveCharacterName(payload);

    const body = {
      id,
      updatedAt,
      characterName,
      payload,
    };

    try {
      await this.apiManager.saveCharacter(body);
      this.metadataCache.set(id, { characterName, updatedAt });
      return { id, characterName, updatedAt };
    } catch (error) {
      console.error('Failed to save character to cloud storage:', error);
      throw error;
    }
  }

  async loadCharacter(userId, fileId) {
    if (!fileId) {
      throw new Error('Character ID is required.');
    }

    try {
      const data = await this.apiManager.getCharacter(fileId);
      if (!data) {
        return null;
      }

      const payload = data.payload ?? data;
      const characterName = data?.characterName ?? resolveCharacterName(payload);
      const updatedAt = data?.updatedAt ?? null;
      this.metadataCache.set(fileId, { characterName, updatedAt });

      return payload;
    } catch (error) {
      console.error('Failed to load character from cloud storage:', error);
      throw error;
    }
  }

  async deleteCharacter(userId, fileId) {
    if (!fileId) {
      throw new Error('Character ID is required.');
    }

    try {
      await this.apiManager.deleteCharacter(fileId);
      this.metadataCache.delete(fileId);
    } catch (error) {
      console.error('Failed to delete character from cloud storage:', error);
      throw error;
    }
  }

  async uploadCharacterImage(file) {
    if (!(file instanceof File)) {
      throw new Error('有効な画像ファイルが必要です。');
    }

    const formData = new FormData();
    formData.append('image', file, file.name);

    try {
      return await this.apiManager.uploadCharacterImage(formData);
    } catch (error) {
      console.error('Failed to upload character image:', error);
      throw error;
    }
  }

  async deleteCharacterImage(imageKey) {
    if (!imageKey) {
      throw new Error('画像キーが必要です。');
    }

    try {
      return await this.apiManager.deleteCharacterImage(imageKey);
    } catch (error) {
      console.error('Failed to delete character image:', error);
      throw error;
    }
  }
}
