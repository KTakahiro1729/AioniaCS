import { GoogleDriveManager } from "../../src/services/googleDriveManager.js";
import { vi } from "vitest";

describe("GoogleDriveManager appDataFolder", () => {
  let gdm;

  beforeEach(() => {
    global.gapi = {
      client: {
        drive: {
          files: {
            list: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
          },
        },
        request: vi.fn(),
      },
    };
    gdm = new GoogleDriveManager("k", "c");
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    vi.spyOn(gdm, "removeIndexEntry").mockResolvedValue();
    gapi.client.drive.files.delete.mockResolvedValue({});
    await gdm.deleteCharacterFile("d1");
    expect(gapi.client.drive.files.delete).toHaveBeenCalledWith({
      fileId: "d1",
    });
    expect(gdm.removeIndexEntry).toHaveBeenCalledWith("d1");
  });

  test("renameIndexEntry updates characterName and timestamp", async () => {
    const now = new Date("2024-01-01T00:00:00.000Z");
    vi.useFakeTimers().setSystemTime(now);
    vi.spyOn(gdm, "readIndexFile").mockResolvedValue([
      { id: "a", name: "a.json", characterName: "Old" },
    ]);
    vi.spyOn(gdm, "writeIndexFile").mockResolvedValue();
    await gdm.renameIndexEntry("a", "New");
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      {
        id: "a",
        name: "a.json",
        characterName: "New",
        updatedAt: now.toISOString(),
      },
    ]);
    vi.useRealTimers();
  });

  test("addIndexEntry sets updatedAt", async () => {
    const now = new Date("2024-01-02T00:00:00.000Z");
    vi.useFakeTimers().setSystemTime(now);
    vi.spyOn(gdm, "readIndexFile").mockResolvedValue([]);
    vi.spyOn(gdm, "writeIndexFile").mockResolvedValue();
    await gdm.addIndexEntry({ id: "b", name: "b.json", characterName: "Bob" });
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      {
        id: "b",
        name: "b.json",
        characterName: "Bob",
        updatedAt: now.toISOString(),
      },
    ]);
    vi.useRealTimers();
  });

  test("scanIntegrity detects orphan and broken entries", async () => {
    vi.spyOn(gdm, "listFiles").mockResolvedValue([
      { id: "i", name: "character_index.json" },
      { id: "a", name: "a.json" },
      { id: "b", name: "b.json" },
    ]);
    vi.spyOn(gdm, "readIndexFile").mockResolvedValue([
      { id: "a", name: "a.json" },
      { id: "c", name: "c.json" },
    ]);
    const res = await gdm.scanIntegrity();
    expect(res.orphanFiles).toEqual([{ id: "b", name: "b.json" }]);
    expect(res.brokenPointers).toEqual([{ id: "c", name: "c.json" }]);
  });

  test("repairIndex updates index and deletes files", async () => {
    vi.spyOn(gdm, "readIndexFile").mockResolvedValue([
      { id: "a", name: "a.json" },
    ]);
    vi.spyOn(gdm, "writeIndexFile").mockResolvedValue();
    vi.spyOn(gdm, "listFiles").mockResolvedValue([{ id: "b", name: "b.json" }]);
    vi.spyOn(gdm, "deleteFile").mockResolvedValue();
    await gdm.repairIndex({
      addIds: ["b"],
      removeIds: ["a"],
      deleteFileIds: ["x"],
    });
    expect(gdm.writeIndexFile).toHaveBeenCalledWith([
      expect.objectContaining({ id: "b", name: "b.json" }),
    ]);
    expect(gdm.deleteFile).toHaveBeenCalledWith("x");
  });

  test("onGapiLoad rejects when gapi.load is missing", async () => {
    delete gapi.load;
    await expect(gdm.onGapiLoad()).rejects.toThrow(
      "GAPI core script not available for gapi.load.",
    );
  });
});
