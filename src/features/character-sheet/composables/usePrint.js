import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { AioniaGameData } from '@/data/gameData.js';

export function formatSkills(skills) {
  return skills
    .filter((s) => s.checked)
    .map((s) => {
      let txt = `〈${s.name}〉`;
      if (s.canHaveExperts) {
        const experts = s.experts.filter((e) => e.value && e.value.trim() !== '').map((e) => e.value);
        if (experts.length > 0) {
          txt = `〈${s.name}：${experts.join('/')}〉`;
        }
      }
      return txt;
    })
    .join('');
}

export function formatAbilities(specialSkills, specialSkillData, specialSkillsRequiringNote) {
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
    .join('');
}

export function usePrint() {
  const characterStore = useCharacterStore();

  async function buildHtml() {
    const { default: printTemplate } = await import('@/features/character-sheet/assets/print/print-template.html?raw');
    const { default: printStyles } = await import('@/features/character-sheet/assets/print/print-styles.css?raw');
    const ch = characterStore.character;
    let html = printTemplate;

    const replace = (key, val = '') => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), val);
    };

    // --- 基本情報の置換 ---
    replace('character-name', ch.name || '');
    replace('player-name', ch.playerName || '');

    const speciesLabel = AioniaGameData.speciesLabelMap[ch.species] || ch.species || '';
    replace('race', speciesLabel === '未選択' ? '' : speciesLabel);

    replace('gender', ch.gender || '');
    replace('age', ch.age != null ? String(ch.age) : '');
    replace('height', ch.height || '');
    replace('weight', ch.weight || '');
    replace('origin', ch.origin || '');
    replace('occupation', ch.occupation || '');
    replace('faith', ch.faith || '');
    replace('current-scar-value', String(characterStore.calculatedScar ?? ''));
    replace('current-experience-value', String(characterStore.currentExperiencePoints + '/' + characterStore.maxExperiencePoints));

    // --- 弱点の置換 ---
    for (let i = 0; i < 10; i++) {
      const w = ch.weaknesses[i] || {};
      replace(`weakness-content-${i}`, w.text || '');
      replace(`weakness-acquired-${i}`, w.acquired === '--' ? '' : w.acquired || '');
    }

    // --- 技能・特技の置換 ---
    replace('skills-content', formatSkills(characterStore.skills));
    replace(
      'abilities-content',
      formatAbilities(characterStore.specialSkills, AioniaGameData.specialSkillData, AioniaGameData.specialSkillsRequiringNote),
    );

    // --- 装備品の置換 ---
    const eq = characterStore.equipments;
    const weapon1Label = AioniaGameData.equipmentGroupLabelMap[eq.weapon1.group] || '';
    replace('weapon1-type', weapon1Label === 'なし' ? '' : weapon1Label);
    replace('weapon1-detail', eq.weapon1.name || '');

    const weapon2Label = AioniaGameData.equipmentGroupLabelMap[eq.weapon2.group] || '';
    replace('weapon2-type', weapon2Label === 'なし' ? '' : weapon2Label);
    replace('weapon2-detail', eq.weapon2.name || '');

    const armorLabel = AioniaGameData.equipmentGroupLabelMap[eq.armor.group] || '';
    replace('armor-type', armorLabel === 'なし' ? '' : armorLabel);
    replace('armor-detail', eq.armor.name || '');
    replace('equipment-weight-value', String(characterStore.currentWeight || ''));

    // --- 2ページ目の置換 ---
    replace('inventory-content', ch.otherItems || '');
    replace('background-content', ch.memo || '');

    for (let i = 0; i < 7; i++) {
      const h = characterStore.adventureLog[i] || {};
      replace(`adventure-scenario-${i}`, h.sessionName || '');
      replace(`adventure-memo-${i}`, h.memo || '');
      replace(`adventure-experience-${i}`, h.gotExperiments != null ? String(h.gotExperiments) : '');
    }

    // --- 残りのプレースホルダをクリア & CSSを注入 ---
    html = html.replace(/{{[^}]+}}/g, '');
    html = html.replace('</head>', `<style>${printStyles}</style></head>`);

    return html;
  }

  async function printCharacterSheet() {
    console.log('印刷プロセスを開始します。');

    try {
      const html = await buildHtml();

      if (!html) {
        console.error('HTMLの構築に失敗しました。処理を中断します。');
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('印刷実行中にエラーが発生しました:', e);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 500);
        }
      };
      iframe.onerror = (e) => {
        console.error('iframeの読み込み中にエラーが発生しました:', e);
      };

      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    } catch (e) {
      console.error('印刷プロセスの準備中にエラーが発生しました:', e);
    }
  }

  async function openPreviewPage() {
    console.log('プレビューページを生成します。');
    try {
      const html = await buildHtml();
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(html);
        newWindow.document.close();
        console.log('プレビューページを新しいタブで開きました。');
      } else {
        console.error('ポップアップがブロックされたため、プレビューページを開けませんでした。');
        alert('ポップアップがブロックされました。プレビュー機能を使用するには、このサイトのポップアップを許可してください。');
      }
    } catch (e) {
      console.error('プレビューページの生成中にエラーが発生しました:', e);
    }
  }

  return {
    printCharacterSheet,
    openPreviewPage,
  };
}
