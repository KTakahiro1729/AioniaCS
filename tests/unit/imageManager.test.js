require("../../src/utils.js");

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }
  readAsDataURL(file) {
    if (file && file.name === "error.png") {
      if (this.onerror) this.onerror(new Error("Simulated FileReader error"));
    } else if (file) {
      if (this.onload)
        this.onload({
          target: { result: `data:image/png;base64,mock_${file.name}` },
        });
    } else {
      if (this.onerror) this.onerror(new Error("No file provided"));
    }
  }
};

global.URL = {
  createObjectURL: jest.fn(() => "blob:mock"),
  revokeObjectURL: jest.fn(),
};

delete require.cache[require.resolve("../../src/imageManager.js")];
require("../../src/imageManager.js");
const ImageManager = window.ImageManager;

describe("ImageManager", () => {
  beforeEach(() => {
    URL.createObjectURL.mockClear();
    URL.revokeObjectURL.mockClear();
  });

  test("loadImage returns dataUrl and key", async () => {
    const file = {
      name: "a.png",
      type: "image/png",
      size: 10,
      lastModified: 1,
    };
    const result = await ImageManager.loadImage(file);
    expect(result.dataUrl).toContain("mock_a.png");
    expect(result.key).toContain("a.png-");
  });

  test("cache invalidates with new timestamp", async () => {
    URL.createObjectURL.mockReturnValueOnce("blob:url1");
    const f1 = {
      name: "same.png",
      type: "image/png",
      size: 10,
      lastModified: 1,
    };
    const r1 = await ImageManager.loadImage(f1);
    expect(ImageManager.getUrl(r1.key)).toBe("blob:url1");

    URL.createObjectURL.mockReturnValueOnce("blob:url2");
    const f2 = {
      name: "same.png",
      type: "image/png",
      size: 10,
      lastModified: 2,
    };
    const r2 = await ImageManager.loadImage(f2);
    expect(ImageManager.getUrl(r2.key)).toBe("blob:url2");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:url1");
  });

  test("revoke releases object URL", async () => {
    URL.createObjectURL.mockReturnValueOnce("blob:url3");
    const f = { name: "x.png", type: "image/png", size: 10, lastModified: 3 };
    const r = await ImageManager.loadImage(f);
    ImageManager.revoke(r.key);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:url3");
  });
});
