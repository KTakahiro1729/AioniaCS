// tests/unit/googleDriveManager.test.js

global.fetch = jest.fn();
const GoogleDriveManager = require("../../src/googleDriveManager.js");

describe("GoogleDriveManager", () => {
  let gdm;
  beforeEach(() => {
    gdm = new GoogleDriveManager("token");
    fetch.mockClear();
  });

  test("ensureIndexFile returns existing id", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ files: [{ id: "idx" }] }),
    });
    const id = await gdm.ensureIndexFile();
    expect(id).toBe("idx");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("ensureIndexFile creates new index when missing", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "newidx" }),
      })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("") });
    const id = await gdm.ensureIndexFile();
    expect(id).toBe("newidx");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test("createCharacterData uploads file", async () => {
    gdm.addOrUpdateIndexEntry = jest.fn().mockResolvedValue();
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "cid" }),
      })
      .mockResolvedValueOnce({ ok: true });
    const id = await gdm.createCharacterData({ name: "Hero" });
    expect(id).toBe("cid");
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/drive/v3/files?fields=id"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/upload/drive/v3/files/cid"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(gdm.addOrUpdateIndexEntry).toHaveBeenCalled();
  });

  test("readCharacterData parses JSON", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{"a":1}'),
    });
    const data = await gdm.readCharacterData("file1");
    expect(data).toEqual({ a: 1 });
  });

  test("deleteCharacterData removes index entry", async () => {
    gdm.removeIndexEntry = jest.fn().mockResolvedValue();
    fetch.mockResolvedValueOnce({ ok: true });
    await gdm.deleteCharacterData("id1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/files/id1"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(gdm.removeIndexEntry).toHaveBeenCalledWith("id1");
  });
});
