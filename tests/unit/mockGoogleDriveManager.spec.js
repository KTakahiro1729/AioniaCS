import { MockGoogleDriveManager } from '../../src/services/mockGoogleDriveManager.js';

describe('MockGoogleDriveManager Specific Scenarios', () => {
  let manager;

  beforeEach(() => {
    manager = new MockGoogleDriveManager();
    manager.init && manager.init();
  });

  test('インデックスファイルが破損している状態で保存を試みると、回復処理が試みられる', async () => {
    manager._writeIndexFile('this is not a valid json');
    const newChar = { id: 'char-recover', name: '回復キャラ' };
    await expect(manager.saveCharacter(newChar, null)).resolves.not.toThrow();
    const list = await manager.listCharacters();
    expect(list).toHaveLength(1);
    expect(list[0].characterName).toBe('回復キャラ');
  });

  test('インデックスと実ファイルに不整合がある場合でも、deleteCharacterはエラーを投げない', async () => {
    const ghost = { fileId: 'ghost-id', characterName: '幽霊', lastModified: new Date().toISOString() };
    manager._writeIndexFile([ghost]);
    await expect(manager.deleteCharacter('ghost-id')).resolves.not.toThrow();
    const list = await manager.listCharacters();
    expect(list).toHaveLength(0);
  });
});
