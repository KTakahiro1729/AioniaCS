import { GoogleDriveManager } from "../../src/services/googleDriveManager.js";
import { jest } from "@jest/globals";

describe("GoogleDriveManager appDataFolder", () => {
  let gdm;

  beforeEach(() => {
    global.gapi = {
      client: {
        drive: {
          files: {
            list: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
          },
        },
        request: jest.fn(),
      },
    };
    gdm = new GoogleDriveManager("k", "c");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("ensureIndexFile creates new index when absent", async () => {
    gapi.client.drive.files.list.mockResolvedValue({ result: { files: [] } });
    gapi.client.request.mockResolvedValue({
      result: { id: "1", name: "character_index.json" },
    });
    const info = await gdm.ensureIndexFile();
    expect(info.id).toBe("1");
    expect(gapi.client.request).toHaveBeenCalled();
  });

  test("readIndexFile returns parsed data", async () => {
    gapi.client.drive.files.list.mockResolvedValue({
      result: { files: [{ id: "10", name: "character_index.json" }] },
    });
    gapi.client.drive.files.get.mockResolvedValue({
      body: '[{"id":"a","name":"Alice"}]',
    });
    const index = await gdm.readIndexFile();
    expect(index).toEqual([{ id: "a", name: "Alice" }]);
    expect(gapi.client.drive.files.get).toHaveBeenCalledWith({
      fileId: "10",
      alt: "media",
    });
  });

  test("createCharacterFile uploads JSON to appDataFolder", async () => {
    gapi.client.request.mockResolvedValue({
      result: { id: "c1", name: "char.json" },
    });
    const data = { foo: "bar" };
    const res = await gdm.createCharacterFile(data, "char.json");
    expect(res.id).toBe("c1");
    expect(gapi.client.request).toHaveBeenCalled();
  });

  test("deleteCharacterFile removes file and index entry", async () => {
    jest.spyOn(gdm, "removeIndexEntry").mockResolvedValue();
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile("d1");
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({
      fileId: "d1",
    });
    expect(gdm.removeIndexEntry).toHaveBeenCalledWith("d1");
  });

  test("renameIndexEntry updates characterName and timestamp", async () => {
    const now = new Date("2024-01-01T00:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    jest
      .spyOn(gdm, "readIndexFile")
      .mockResolvedValue([{ id: "a", name: "a.json", characterName: "Old" }]);
    jest.spyOn(gdm, "writeIndexFile").mockResolvedValue();
    await gdm.renameIndexEntry("a", "New");
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      {
        id: "a",
        name: "a.json",
        characterName: "New",
        updatedAt: now.toISOString(),
      },
    ]);
    jest.useRealTimers();
  });

  test("addIndexEntry sets updatedAt", async () => {
    const now = new Date("2024-01-02T00:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    jest.spyOn(gdm, "readIndexFile").mockResolvedValue([]);
    jest.spyOn(gdm, "writeIndexFile").mockResolvedValue();
    await gdm.addIndexEntry({ id: "b", name: "b.json", characterName: "Bob" });
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      {
        id: "b",
        name: "b.json",
        characterName: "Bob",
        updatedAt: now.toISOString(),
      },
    ]);
    jest.useRealTimers();
  });

  test("onGapiLoad rejects when gapi.load is missing", async () => {
    delete gapi.load;
    await expect(gdm.onGapiLoad()).rejects.toThrow(
      "GAPI core script not available for gapi.load.",
    );
  });
});
