import { DriveStorageAdapter } from '../../src/services/driveStorageAdapter.js';
import { arrayBufferToBase64 } from '../../src/libs/sabalessshare/src/crypto.js';
vi.mock('../../src/libs/sabalessshare/src/crypto.js', async () => await import('./__mocks__/sabalessshare.js'));

describe('DriveStorageAdapter', () => {
  let adapter;
  let gdm;
  beforeEach(() => {
    gdm = {
      saveFile: vi.fn().mockResolvedValue({ id: '1' }),
      loadFileContent: vi.fn().mockResolvedValue(''),
      getWorkspaceFolderId: vi.fn().mockReturnValue('folder-1'),
    };
    adapter = new DriveStorageAdapter(gdm);
  });

  test('create calls saveFile', async () => {
    const buf = new ArrayBuffer(8);
    const id = await adapter.create({ ciphertext: buf, iv: new Uint8Array(8) });
    expect(id).toBe('1');
    expect(gdm.saveFile).toHaveBeenCalled();
  });

  test('read parses saved content', async () => {
    const payload = JSON.stringify({
      ciphertext: arrayBufferToBase64(new ArrayBuffer(2)),
      iv: arrayBufferToBase64(new Uint8Array(2)),
    });
    gdm.loadFileContent.mockResolvedValue(payload);
    const data = await adapter.read('x');
    expect(data.ciphertext.byteLength).toBe(2);
  });

  test('update calls saveFile with id', async () => {
    await adapter.update('u1', new Uint8Array(4));
    expect(gdm.saveFile).toHaveBeenCalledWith('folder-1', expect.any(String), expect.any(String), 'u1');
  });
});
