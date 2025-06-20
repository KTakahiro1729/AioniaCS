vi.mock("../../public/print-template.html?raw", () => "");
vi.mock("../../public/style/css/print-styles.css?raw", () => "");

import {
  formatSkills,
  formatAbilities,
} from "../../../src/composables/usePrint.js";

describe("usePrint utilities", () => {
  test("formatSkills builds skill string", () => {
    const skills = [
      {
        name: "運動",
        checked: true,
        canHaveExperts: true,
        experts: [{ value: "跳躍" }, { value: "" }],
      },
      { name: "射撃", checked: true, canHaveExperts: true, experts: [] },
      {
        name: "知識",
        checked: false,
        canHaveExperts: true,
        experts: [{ value: "歴史" }],
      },
    ];
    expect(formatSkills(skills)).toBe("〈運動：跳躍〉〈射撃〉");
  });

  test("formatAbilities builds ability string", () => {
    const data = {
      tactics: [{ value: "concealed_weapon", label: "暗器" }],
      features: [{ value: "beauty", label: "美貌" }],
    };
    const req = ["beauty"];
    const specialSkills = [
      { group: "tactics", name: "concealed_weapon", note: "", showNote: false },
      { group: "features", name: "beauty", note: "高貴", showNote: true },
      { group: "", name: "", note: "", showNote: false },
    ];
    expect(formatAbilities(specialSkills, data, req)).toBe(
      "《暗器》《美貌：高貴》",
    );
  });
});
