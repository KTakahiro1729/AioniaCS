/**
 * Pure helpers that assemble the printable character sheet HTML.
 * Kept free of Vue/Vite dependencies so they can be unit tested directly.
 */

export const ADVENTURE_ROWS_FIRST_PAGE = 7;
export const ADVENTURE_ROWS_EXTRA_PAGE = 22;

const ADVENTURE_ROWS_MARKER = '<!-- @adventure-rows -->';
const EXTRA_PAGES_MARKER = '<!-- @extra-pages -->';
const EXTRA_PAGE_TEMPLATE_PATTERN = /<template id="adventure-extra-page">([\s\S]*?)<\/template>\s*/;

export function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function isEmptyAdventureEntry(entry) {
  return !entry || (!entry.scenario && !entry.memo && !entry.experience);
}

/**
 * Drops trailing blank rows so that empty editor rows do not generate
 * extra printed pages, while blanks between filled rows are preserved.
 */
export function trimTrailingEmptyEntries(entries) {
  const list = Array.isArray(entries) ? [...entries] : [];
  while (list.length > 0 && isEmptyAdventureEntry(list[list.length - 1])) {
    list.pop();
  }
  return list;
}

function buildAdventureRowHtml(entry = {}) {
  return [
    '<tr>',
    `<td class="col-scenario writein-area">${escapeHtml(entry.scenario || '')}</td>`,
    `<td class="col-memo writein-area">${escapeHtml(entry.memo || '')}</td>`,
    '<td class="col-spacer spacer writein-area"></td>',
    `<td class="col-experience writein-area">${escapeHtml(entry.experience || '')}</td>`,
    '</tr>',
  ].join('');
}

/**
 * Renders adventure log rows, padding with blank rows up to `padTo`
 * so the printed table keeps its ruled lines for handwriting.
 */
export function buildAdventureRowsHtml(entries, padTo) {
  const rows = [];
  const count = Math.max(Array.isArray(entries) ? entries.length : 0, padTo || 0);
  for (let i = 0; i < count; i++) {
    rows.push(buildAdventureRowHtml(entries?.[i]));
  }
  return rows.join('\n');
}

/**
 * Builds the final print HTML.
 * @param {object} params
 * @param {string} params.template - Raw print-template.html source.
 * @param {string} params.styles - Raw print-styles.css source.
 * @param {Object<string, string>} params.values - Placeholder values ({{key}}), escaped here.
 * @param {Array<{scenario?: string, memo?: string, experience?: string}>} params.adventureEntries
 *   Full adventure log. Rows beyond the first page flow into dynamically
 *   generated continuation pages.
 */
export function buildPrintHtml({ template, styles, values = {}, adventureEntries = [] }) {
  const extraPageMatch = template.match(EXTRA_PAGE_TEMPLATE_PATTERN);
  const extraPageTemplate = extraPageMatch ? extraPageMatch[1] : '';
  let html = extraPageMatch ? template.replace(extraPageMatch[0], '') : template;

  for (const [key, value] of Object.entries(values)) {
    const escaped = escapeHtml(value ?? '');
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), () => escaped);
  }
  html = html.replace(/{{[^}]+}}/g, '');

  const entries = trimTrailingEmptyEntries(adventureEntries);
  const firstPageRows = buildAdventureRowsHtml(entries.slice(0, ADVENTURE_ROWS_FIRST_PAGE), ADVENTURE_ROWS_FIRST_PAGE);
  html = html.replace(ADVENTURE_ROWS_MARKER, () => firstPageRows);

  let extraPages = '';
  if (extraPageTemplate) {
    for (let i = ADVENTURE_ROWS_FIRST_PAGE; i < entries.length; i += ADVENTURE_ROWS_EXTRA_PAGE) {
      const pageRows = buildAdventureRowsHtml(entries.slice(i, i + ADVENTURE_ROWS_EXTRA_PAGE), ADVENTURE_ROWS_EXTRA_PAGE);
      extraPages += extraPageTemplate.replace(ADVENTURE_ROWS_MARKER, () => pageRows);
    }
  }
  html = html.replace(EXTRA_PAGES_MARKER, () => extraPages);

  html = html.replace('</head>', `<style>${styles}</style></head>`);
  return html;
}
