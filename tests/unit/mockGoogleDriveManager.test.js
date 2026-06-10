import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GoogleDriveManager } from '@/infrastructure/google-drive/googleDriveManager.js';
import {
  MockGoogleDriveManager,
  initializeMockGoogleDriveManager,
  resetMockGoogleDriveManagerForTests,
} from '@/infrastructure/google-drive/mockGoogleDriveManager.js';

function publicMethodNames(cls) {
  return Object.getOwnPropertyNames(cls.prototype).filter(
    (name) => name !== 'constructor' && !name.startsWith('_') && typeof cls.prototype[name] === 'function',
  );
}

describe('MockGoogleDriveManager', () => {
  let gdm;

  beforeEach(() => {
    resetMockGoogleDriveManagerForTests();
    gdm = initializeMockGoogleDriveManager('key', 'client');
  });

  afterEach(() => {
    resetMockGoogleDriveManagerForTests();
  });

  describe('API parity with GoogleDriveManager', () => {
    it('implements every public method of the real manager', () => {
      const realMethods = publicMethodNames(GoogleDriveManager);
      const mockMethods = new Set(publicMethodNames(MockGoogleDriveManager));
      const missing = realMethods.filter((name) => !mockMethods.has(name));
      expect(missing).toEqual([]);
    });

    it('uses the same default folder name', () => {
      expect(MockGoogleDriveManager.DEFAULT_FOLDER_NAME).toBe(GoogleDriveManager.DEFAULT_FOLDER_NAME);
    });
  });

  describe('character file lifecycle', () => {
    it('creates, renames, lists, and deletes character files', async () => {
      const created = await gdm.createCharacterFile({
        name: 'Hero',
        content: '{"character":{"name":"Hero"}}',
        mimeType: 'application/json',
      });
      expect(created.id).toBeTruthy();
      expect(created.name).toBe('Hero.json');

      const loaded = await gdm.loadCharacterFile(created.id);
      expect(loaded.character.name).toBe('Hero');

      await gdm.renameFile(created.id, 'Hero2.json');
      const folderId = await gdm.findOrCreateConfiguredCharacterFolder();
      const files = await gdm.listFiles(folderId);
      expect(files.map((file) => file.name)).toContain('Hero2.json');

      await gdm.deleteCharacterFile(created.id);
      expect(await gdm.loadCharacterFile(created.id)).toBeNull();
    });

    it('throws the same error as the real 404 path when updating a deleted file', async () => {
      const created = await gdm.createCharacterFile({ name: 'Ghost', content: '{}', mimeType: 'application/json' });
      await gdm.deleteCharacterFile(created.id);

      await expect(gdm.updateCharacterFile(created.id, { name: 'Ghost', content: '{}', mimeType: 'application/json' })).rejects.toThrow(
        'Parent folder not found',
      );
    });

    it('falls back to the default folder name in getOrCreateAppFolder', async () => {
      const folder = await gdm.getOrCreateAppFolder();
      expect(folder.name).toBe(MockGoogleDriveManager.DEFAULT_FOLDER_NAME);
    });
  });

  describe('configured folder resilience', () => {
    it('recreates the folder when it disappears from Drive', async () => {
      const firstId = await gdm.findOrCreateConfiguredCharacterFolder();
      delete gdm.state.folders[firstId];

      const secondId = await gdm.findOrCreateConfiguredCharacterFolder();
      expect(secondId).toBeTruthy();
      expect(secondId).not.toBe(firstId);
      expect(gdm.state.config.characterFolderId).toBe(secondId);
    });
  });

  describe('authentication gating', () => {
    it('rejects Drive operations after sign-out and recovers after sign-in', async () => {
      await gdm.handleSignOut();

      await expect(gdm.listFiles('folder-1')).rejects.toThrow('Authentication required.');
      await expect(gdm.loadConfig()).rejects.toThrow('Authentication required.');
      expect(await gdm.restoreSession()).toBe(false);

      await gdm.handleSignIn();
      expect(await gdm.restoreSession()).toBe(true);
      await expect(gdm.listFiles('folder-1')).resolves.toEqual(expect.any(Array));
    });
  });

  describe('sharing', () => {
    it('marks files shared/unshared and reports it in listings', async () => {
      const created = await gdm.createCharacterFile({ name: 'Shared', content: '{}', mimeType: 'application/json' });

      const link = await gdm.ensureFilePublic(created.id);
      expect(link).toContain(created.id);

      const folderId = await gdm.findOrCreateConfiguredCharacterFolder();
      let files = await gdm.listFiles(folderId);
      expect(files.find((file) => file.id === created.id).shared).toBe(true);

      expect(await gdm.unshareFile(created.id)).toBe(true);
      files = await gdm.listFiles(folderId);
      expect(files.find((file) => file.id === created.id).shared).toBe(false);
    });
  });

  describe('failure simulation', () => {
    it('fails the requested method the requested number of times', async () => {
      gdm.simulateFailure('saveFile', { times: 1 });

      await expect(gdm.createCharacterFile({ name: 'X', content: '{}' })).rejects.toThrow('Simulated Drive failure');

      const retried = await gdm.createCharacterFile({ name: 'X', content: '{}' });
      expect(retried.id).toBeTruthy();
    });

    it('supports wildcard failures with custom errors until cleared', async () => {
      gdm.simulateFailure('*', { error: 'network down' });

      await expect(gdm.listFiles('folder-1')).rejects.toThrow('network down');
      await expect(gdm.loadFileContent('file-1')).rejects.toThrow('network down');

      gdm.clearSimulatedFailures();
      await expect(gdm.listFiles('folder-1')).resolves.toEqual(expect.any(Array));
    });

    it('applies configured latency to operations', async () => {
      vi.useFakeTimers();
      try {
        gdm.setLatency(500);
        let resolved = false;
        const pending = gdm.listFiles('folder-1').then((files) => {
          resolved = true;
          return files;
        });

        await vi.advanceTimersByTimeAsync(499);
        expect(resolved).toBe(false);

        // 内部で呼ばれる ensureAccessToken にも遅延が適用されるため余分に進める
        await vi.advanceTimersByTimeAsync(1000);
        await pending;
        expect(resolved).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('reset clears failure rules and latency', async () => {
      gdm.simulateFailure('*');
      gdm.setLatency(10000);

      gdm.reset();

      await expect(gdm.listFiles('folder-1')).resolves.toEqual(expect.any(Array));
    });
  });
});
