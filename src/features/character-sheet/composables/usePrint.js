import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { AioniaGameData } from '@/data/gameData.js';
import { buildPrintHtml } from '@/features/character-sheet/composables/printHtmlBuilder.js';
import printTemplate from '@/features/character-sheet/assets/print/print-template.html?raw';
import printStyles from '@/features/character-sheet/assets/print/print-styles.css?raw';

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

  function buildHtml() {
    const ch = characterStore.character;
    const values = {};

    // --- 基本情報 ---
    values['character-name'] = ch.name || '';
    values['player-name'] = ch.playerName || '';

    const speciesLabel = AioniaGameData.speciesLabelMap[ch.species] || ch.species || '';
    values['race'] = speciesLabel === '未選択' ? '' : speciesLabel;

    values['gender'] = ch.gender || '';
    values['age'] = ch.age != null ? String(ch.age) : '';
    values['build'] = ch.build || '';
    values['origin'] = ch.origin || '';
    values['occupation'] = ch.occupation || '';
    values['faith'] = ch.faith || '';
    values['current-scar-value'] = String(characterStore.calculatedScar ?? '');
    values['current-experience-value'] = String(characterStore.currentExperiencePoints + '/' + characterStore.maxExperiencePoints);

    // --- 弱点 ---
    for (let i = 0; i < 10; i++) {
      const w = ch.weaknesses[i] || {};
      values[`weakness-content-${i}`] = w.text || '';
      values[`weakness-acquired-${i}`] = w.acquired === '--' ? '' : w.acquired || '';
    }

    // --- 技能・特技 ---
    values['skills-content'] = formatSkills(characterStore.skills);
    values['abilities-content'] = formatAbilities(
      characterStore.specialSkills,
      AioniaGameData.specialSkillData,
      AioniaGameData.specialSkillsRequiringNote,
    );

    // --- 装備品 ---
    const eq = characterStore.equipments;
    const weapon1Label = AioniaGameData.equipmentGroupLabelMap[eq.weapon1.group] || '';
    values['weapon1-type'] = weapon1Label === 'なし' ? '' : weapon1Label;
    values['weapon1-detail'] = eq.weapon1.name || '';

    const weapon2Label = AioniaGameData.equipmentGroupLabelMap[eq.weapon2.group] || '';
    values['weapon2-type'] = weapon2Label === 'なし' ? '' : weapon2Label;
    values['weapon2-detail'] = eq.weapon2.name || '';

    const armorLabel = AioniaGameData.equipmentGroupLabelMap[eq.armor.group] || '';
    values['armor-type'] = armorLabel === 'なし' ? '' : armorLabel;
    values['armor-detail'] = eq.armor.name || '';
    values['equipment-weight-value'] = String(characterStore.currentWeight || '');

    // --- 2ページ目 ---
    values['inventory-content'] = ch.otherItems || '';
    values['background-content'] = ch.memo || '';

    // 冒険の記録は全件渡し、7件を超えた分は継続ページとして動的生成される
    const adventureEntries = characterStore.adventureLog.map((h) => ({
      scenario: h?.sessionName || '',
      memo: h?.memo || '',
      experience: h?.gotExperiments != null ? String(h.gotExperiments) : '',
    }));

    return buildPrintHtml({
      template: printTemplate,
      styles: printStyles,
      values,
      adventureEntries,
    });
  }

  function printCharacterSheet() {
    console.log('印刷プロセスを開始します。');

    try {
      const html = buildHtml();

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
        // Webフォント適用前に印刷すると字幅が変わり折返し位置がずれるため、
        // 読み込み完了を待つ（時間がかかる場合は2秒で打ち切り）
        const fontsReady = Promise.resolve(iframe.contentDocument?.fonts?.ready).catch(() => {});
        const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
        Promise.race([fontsReady, timeout]).then(() => {
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
        });
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
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      console.error('ポップアップがブロックされたため、プレビューページを開けませんでした。');
      alert('ポップアップがブロックされました。プレビュー機能を使用するには、このサイトのポップアップを許可してください。');
      return;
    }

    try {
      const html = buildHtml();
      newWindow.document.open();
      newWindow.document.write(html);
      newWindow.document.close();
      console.log('プレビューページを新しいタブで開きました。');
    } catch (e) {
      console.error('プレビューページの生成中にエラーが発生しました:', e);
      try {
        newWindow.close();
      } catch (closeError) {
        console.error('生成に失敗したプレビューウィンドウのクローズに失敗しました:', closeError);
      }
    }
  }

  return {
    printCharacterSheet,
    openPreviewPage,
  };
}
