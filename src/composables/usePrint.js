import { useCharacterStore } from "../stores/characterStore.js";
import { AioniaGameData } from "../data/gameData.js";

export function formatSkills(skills) {
  return skills
    .filter((s) => s.checked)
    .map((s) => {
      let txt = `〈${s.name}〉`;
      if (s.canHaveExperts) {
        const experts = s.experts
          .filter((e) => e.value && e.value.trim() !== "")
          .map((e) => e.value);
        if (experts.length > 0) {
          txt = `〈${s.name}：${experts.join("/")}〉`;
        }
      }
      return txt;
    })
    .join(" ");
}

export function formatAbilities(
  specialSkills,
  specialSkillData,
  specialSkillsRequiringNote,
) {
  return specialSkills
    .filter((ss) => ss.group && ss.name)
    .map((ss) => {
      const options = specialSkillData[ss.group] || [];
      const opt = options.find((o) => o.value === ss.name);
      const label = opt ? opt.label : ss.name;
      if (specialSkillsRequiringNote.includes(ss.name) && ss.note) {
        return `《${label}：${ss.note}》`;
      }
      return `《${label}》`;
    })
    .join("");
}

export function usePrint() {
  const characterStore = useCharacterStore();

  async function buildHtml() {
    const { default: printTemplate } = await import(
      "../../public/print-template.html?raw"
    );
    const { default: printStyles } = await import(
      "../../public/style/css/print-styles.css?raw"
    );
    const ch = characterStore.character;
    let html = printTemplate;

    const replace = (key, val = "") => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), val);
    };

    replace("character-name", ch.name || "");
    replace("player-name", ch.playerName || "");
    replace(
      "race",
      AioniaGameData.speciesLabelMap[ch.species] || ch.species || "",
    );
    replace("gender", ch.gender || "");
    replace("age", ch.age != null ? String(ch.age) : "");
    replace("height", ch.height || "");
    replace("weight", ch.weight || "");
    replace("origin", ch.origin || "");
    replace("occupation", ch.occupation || "");
    replace("faith", ch.faith || "");
    replace("current-scar-value", String(ch.currentScar ?? ""));
    replace(
      "current-experience-value",
      String(characterStore.currentExperiencePoints ?? ""),
    );

    for (let i = 0; i < AioniaGameData.config.maxWeaknesses; i++) {
      const w = ch.weaknesses[i] || {};
      replace(`weakness-content[${i}]`, w.text || "");
      replace(`weakness-acquired[${i}]`, w.acquired || "");
    }

    replace("skills-content", formatSkills(characterStore.skills));
    replace(
      "abilities-content",
      formatAbilities(
        characterStore.specialSkills,
        AioniaGameData.specialSkillData,
        AioniaGameData.specialSkillsRequiringNote,
      ),
    );

    const eq = characterStore.equipments;
    replace(
      "weapon1-type",
      AioniaGameData.equipmentGroupLabelMap[eq.weapon1.group] || "",
    );
    replace("weapon1-detail", eq.weapon1.name || "");
    replace(
      "weapon2-type",
      AioniaGameData.equipmentGroupLabelMap[eq.weapon2.group] || "",
    );
    replace("weapon2-detail", eq.weapon2.name || "");
    replace(
      "armor-type",
      AioniaGameData.equipmentGroupLabelMap[eq.armor.group] || "",
    );
    replace("armor-detail", eq.armor.name || "");
    replace(
      "equipment-weight-value",
      String(characterStore.currentWeight || ""),
    );

    replace("inventory-content", ch.otherItems || "");
    replace("background-content", ch.memo || "");

    for (let i = 0; i < 7; i++) {
      const h = characterStore.histories[i] || {};
      replace(`adventure-scenario[${i}]`, h.sessionName || "");
      replace(`adventure-memo[${i}]`, h.memo || "");
      replace(
        `adventure-experience[${i}]`,
        h.gotExperiments != null ? String(h.gotExperiments) : "",
      );
    }

    html = html.replace("</head>", `<style>${printStyles}</style></head>`);
    return html;
  }

  async function printCharacterSheet() {
    const html = await buildHtml();
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    };
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
  }

  return { printCharacterSheet };
}
