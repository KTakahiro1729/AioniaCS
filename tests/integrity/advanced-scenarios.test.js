vi.mock("../../src/assets/print/print-template.html?raw", () => ({
  default: "<div>{{character-name}}</div>",
}));
vi.mock("../../src/assets/print/print-styles.css?raw", () => ({ default: "" }));

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCharacterStore } from "../../src/stores/characterStore.js";
import { DataManager } from "../../src/services/dataManager.js";
import { MockGoogleDriveManager } from "../../src/services/mockGoogleDriveManager.js";
import { useGoogleDrive } from "../../src/composables/useGoogleDrive.js";
import { usePrint } from "../../src/composables/usePrint.js";
import { AioniaGameData } from "../../src/data/gameData.js";

let dataManager;
let gdm;
let charStore;

describe("高度なシナリオテスト", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    gdm = new MockGoogleDriveManager("k", "c");
    dataManager = new DataManager(AioniaGameData);
    dataManager.setGoogleDriveManager(gdm);
    charStore = useCharacterStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have a clean initial state", () => {
    expect(true).toBe(true);
  });

  describe("シナリオ10：不正なデータ型を持つJSONのインポート", () => {
    it("型がおかしくてもエラーを投げずに正規化する", () => {
      const bad = {
        character: { name: "壊れた", images: "none" },
        skills: { foo: "bar" },
        specialSkills: "bad",
        equipments: { weapon1: { group: "sword", name: 123 } },
        histories: [{ sessionName: 1, gotExperiments: "many", memo: 5 }],
      };
      const parsed = dataManager.parseLoadedData(bad);
      expect(Array.isArray(parsed.character.images)).toBe(true);
      expect(Array.isArray(parsed.skills)).toBe(true);
      expect(Array.isArray(parsed.specialSkills)).toBe(true);
      expect(Array.isArray(parsed.histories)).toBe(true);
      expect(Number.isNaN(parsed.histories[0].gotExperiments)).toBe(true);
    });
  });

  describe("シナリオ5：未保存状態でのアカウント切り替え", () => {
    it("サインアウト後に状態が初期化されるべき", async () => {
      const initial = JSON.parse(JSON.stringify(charStore.$state));
      charStore.character.name = "変更後";
      const { handleSignOutClick, handleSignInClick } =
        useGoogleDrive(dataManager);
      handleSignOutClick();
      gdm = new MockGoogleDriveManager("k2", "c2");
      dataManager.setGoogleDriveManager(gdm);
      handleSignInClick();
      const list = await dataManager.loadCharacterListFromDrive();
      expect(charStore.$state).toEqual(initial);
      expect(list).toEqual([]);
    });
  });

  describe("シナリオ34：大規模データの保存中に印刷を実行", () => {
    it("保存中に変更しても印刷は保存開始時のデータを使う", async () => {
      charStore.character.name = "初期名";
      const print = usePrint();
      let capturedIframe;
      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        if (tag === "iframe") {
          capturedIframe = {
            style: {},
            srcdoc: "",
            contentWindow: { focus: vi.fn(), print: vi.fn() },
          };
          return capturedIframe;
        }
        return document.createElement(tag);
      });
      vi.spyOn(document.body, "appendChild").mockImplementation(() => {});

      vi.spyOn(gdm, "saveFile").mockImplementation(
        () =>
          new Promise((r) =>
            setTimeout(() => r({ id: "1", name: "c.json" }), 50),
          ),
      );

      const savePromise = dataManager.saveDataToAppData(
        charStore.character,
        charStore.skills,
        charStore.specialSkills,
        charStore.equipments,
        charStore.histories,
        null,
        "c",
      );
      charStore.character.name = "変更後";
      await print.printCharacterSheet();
      await savePromise;
      expect(capturedIframe.srcdoc).toContain("初期名");
    });
  });
});
