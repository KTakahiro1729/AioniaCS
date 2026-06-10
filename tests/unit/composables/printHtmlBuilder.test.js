import {
  ADVENTURE_ROWS_EXTRA_PAGE,
  ADVENTURE_ROWS_FIRST_PAGE,
  buildAdventureRowsHtml,
  buildPrintHtml,
  escapeHtml,
  trimTrailingEmptyEntries,
} from '@/features/character-sheet/composables/printHtmlBuilder.js';

const TEMPLATE = [
  '<html><head></head><body>',
  '<div class="page page-1">{{character-name}}</div>',
  '<div class="page page-2"><table><tbody>',
  '<!-- @adventure-rows -->',
  '</tbody></table></div>',
  '<!-- @extra-pages -->',
  '<template id="adventure-extra-page">',
  '<div class="page page-extra"><table><tbody>',
  '<!-- @adventure-rows -->',
  '</tbody></table></div>',
  '</template>',
  '</body></html>',
].join('\n');

function entries(count) {
  return Array.from({ length: count }, (_, i) => ({
    scenario: `シナリオ${i + 1}`,
    memo: `メモ${i + 1}`,
    experience: String(i + 1),
  }));
}

function countOccurrences(text, pattern) {
  return (text.match(new RegExp(pattern, 'g')) || []).length;
}

describe('printHtmlBuilder', () => {
  test('escapeHtml escapes special characters', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });

  test('trimTrailingEmptyEntries drops trailing blanks but keeps gaps', () => {
    const list = [
      { scenario: 'a', memo: '', experience: '' },
      { scenario: '', memo: '', experience: '' },
      { scenario: 'b', memo: '', experience: '' },
      { scenario: '', memo: '', experience: '' },
      { scenario: '', memo: '', experience: '' },
    ];
    expect(trimTrailingEmptyEntries(list)).toHaveLength(3);
    expect(trimTrailingEmptyEntries([])).toEqual([]);
    expect(trimTrailingEmptyEntries(null)).toEqual([]);
  });

  test('buildAdventureRowsHtml pads to the requested row count and escapes values', () => {
    const html = buildAdventureRowsHtml([{ scenario: '<x>', memo: 'm', experience: '1' }], 3);
    expect(countOccurrences(html, '<tr>')).toBe(3);
    expect(html).toContain('&lt;x&gt;');
    expect(html).not.toContain('<x>');
  });

  test('buildPrintHtml renders placeholders, injects styles, and removes the page template', () => {
    const html = buildPrintHtml({
      template: TEMPLATE,
      styles: '.page{}',
      values: { 'character-name': 'ぞら&' },
      adventureEntries: [],
    });
    expect(html).toContain('ぞら&amp;');
    expect(html).toContain('<style>.page{}</style>');
    expect(html).not.toContain('<template id="adventure-extra-page">');
    expect(html).not.toContain('{{');
  });

  test('buildPrintHtml keeps a single page with up to 7 adventure entries', () => {
    const html = buildPrintHtml({ template: TEMPLATE, styles: '', values: {}, adventureEntries: entries(7) });
    expect(countOccurrences(html, 'class="page page-extra"')).toBe(0);
    expect(countOccurrences(html, '<tr>')).toBe(ADVENTURE_ROWS_FIRST_PAGE);
  });

  test('buildPrintHtml generates continuation pages beyond 7 entries', () => {
    const html = buildPrintHtml({ template: TEMPLATE, styles: '', values: {}, adventureEntries: entries(8) });
    expect(countOccurrences(html, 'class="page page-extra"')).toBe(1);
    expect(countOccurrences(html, '<tr>')).toBe(ADVENTURE_ROWS_FIRST_PAGE + ADVENTURE_ROWS_EXTRA_PAGE);
    expect(html).toContain('シナリオ8');
  });

  test('buildPrintHtml splits long logs across multiple continuation pages', () => {
    const count = ADVENTURE_ROWS_FIRST_PAGE + ADVENTURE_ROWS_EXTRA_PAGE + 1;
    const html = buildPrintHtml({ template: TEMPLATE, styles: '', values: {}, adventureEntries: entries(count) });
    expect(countOccurrences(html, 'class="page page-extra"')).toBe(2);
    expect(html).toContain(`シナリオ${count}`);
  });

  test('buildPrintHtml ignores trailing empty entries for pagination', () => {
    const padded = [...entries(7), { scenario: '', memo: '', experience: '' }];
    const html = buildPrintHtml({ template: TEMPLATE, styles: '', values: {}, adventureEntries: padded });
    expect(countOccurrences(html, 'class="page page-extra"')).toBe(0);
  });
});
