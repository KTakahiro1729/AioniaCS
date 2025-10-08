import { setActivePinia, createPinia } from 'pinia';
import { GoogleDriveManager, resetGoogleDriveManagerForTests } from '@/infrastructure/google-drive/googleDriveManager.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

function createCredentialPayload(payload) {
  const base64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `header.${base64}.signature`;
}

describe('GoogleDriveManager authentication', () => {
  let tokenResponses;
  let promptCallback;
  let tokenClient;

  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    setActivePinia(createPinia());
    tokenResponses = [];
    promptCallback = null;
    tokenClient = {
      callback: null,
      requestAccessToken: vi.fn(() => {
        const response = tokenResponses.length > 0 ? tokenResponses.shift() : {};
        if (typeof tokenClient.callback === 'function') {
          tokenClient.callback(response);
        }
      }),
    };

    globalThis.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          prompt: vi.fn((cb) => {
            promptCallback = cb;
          }),
          disableAutoSelect: vi.fn(),
        },
        oauth2: {
          initTokenClient: vi.fn(() => tokenClient),
          revoke: vi.fn((token, cb) => cb && cb()),
        },
      },
    };

    globalThis.gapi = {
      client: {
        getToken: () => ({ access_token: 'token' }),
        setToken: vi.fn(),
      },
    };
  });

  afterEach(() => {
    delete globalThis.google;
    delete globalThis.gapi;
  });

  function createManager() {
    const manager = new GoogleDriveManager('api-key', 'client-id');
    const uiStore = useUiStore();
    manager.attachUiStore(uiStore);
    return { manager, uiStore };
  }

  test('handleCredentialResponse obtains Drive token and marks store as signed in', async () => {
    const { manager, uiStore } = createManager();
    await manager.onGisLoad();

    tokenResponses.push({ access_token: 'access-token' });

    manager.handleCredentialResponse({ credential: createCredentialPayload({ email: 'hero@example.com' }) });

    await Promise.resolve();

    expect(tokenClient.requestAccessToken).toHaveBeenCalled();
    expect(uiStore.isSignedIn).toBe(true);
  });

  test('handleCredentialResponse logs error when token acquisition fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { manager, uiStore } = createManager();
    await manager.onGisLoad();

    tokenResponses.push({ error: 'access_denied' });

    manager.handleCredentialResponse({ credential: createCredentialPayload({ email: 'rogue@example.com' }) });

    await Promise.resolve();

    expect(uiStore.isSignedIn).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('handleSignIn invokes callback error when One Tap prompt dismissed', async () => {
    const { manager } = createManager();
    await manager.onGisLoad();

    const errorSpy = vi.fn();
    manager.handleSignIn(errorSpy);

    promptCallback({
      isNotDisplayed: () => false,
      isSkippedMoment: () => false,
      isDismissedMoment: () => true,
      getDismissedReason: () => 'user_cancel',
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
  });
});
