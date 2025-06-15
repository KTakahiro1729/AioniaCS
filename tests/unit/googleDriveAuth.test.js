import { GoogleDriveManager } from "../../src/services/googleDriveManager.js";
import { jest } from "@jest/globals";

describe("GoogleDriveManager auth", () => {
  beforeEach(() => {
    global.google = {
      accounts: {
        oauth2: {
          initTokenClient: jest.fn().mockReturnValue({
            requestAccessToken: jest.fn(),
          }),
          revoke: jest.fn((token, cb) => cb()),
        },
      },
    };
    global.gapi = {
      client: {
        getToken: jest.fn(() => null),
        setToken: jest.fn(),
      },
    };
  });

  test("onGisLoad initializes token client with minimal scopes", async () => {
    const gdm = new GoogleDriveManager("k", "c");
    await gdm.onGisLoad();
    expect(google.accounts.oauth2.initTokenClient).toHaveBeenCalledWith({
      client_id: "c",
      scope:
        "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file",
      callback: "",
    });
  });

  test("handleSignOut revokes token and clears gapi token", () => {
    const gdm = new GoogleDriveManager("k", "c");
    gdm.tokenClient = { requestAccessToken: jest.fn() };
    gapi.client.getToken.mockReturnValue({ access_token: "t" });
    const cb = jest.fn();
    gdm.handleSignOut(cb);
    expect(google.accounts.oauth2.revoke).toHaveBeenCalledWith(
      "t",
      expect.any(Function),
    );
    expect(gapi.client.setToken).toHaveBeenCalledWith("");
    expect(cb).toHaveBeenCalled();
  });
});
