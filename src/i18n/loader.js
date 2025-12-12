const interpolate = (template, variables = {}) =>
  String(template).replace(/\{(\w+)\}/g, (match, varName) => {
    const value = variables[varName];
    return value === undefined || value === null ? match : value;
  });

const parseCsvRows = (rawCsv) => {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < rawCsv.length; i += 1) {
    const char = rawCsv[i];
    const nextChar = rawCsv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== '')) {
      rows.push(row);
    }
  }

  return rows;
};

const parseCsv = (rawCsv) => {
  const rows = parseCsvRows(rawCsv);
  if (!rows.length) {
    return { headers: [], records: {}, rows: [] };
  }

  const headers = rows[0];
  const bodyRows = rows.slice(1).map((cells) =>
    headers.reduce(
      (record, header, index) => ({
        ...record,
        [header]: cells[index] ?? '',
      }),
      {},
    ),
  );

  const records = bodyRows.reduce((acc, record) => {
    if (record.key) {
      acc[record.key] = record;
    }
    return acc;
  }, {});

  return { headers, records, rows: bodyRows };
};

const createI18nLoader = (rawCsv, locale = 'ja', fallbackLocale = 'ja') => {
  const parsed = parseCsv(rawCsv);
  const { records } = parsed;

  const getText = (key, variables) => {
    const entry = records[key];
    const template = entry?.[locale] ?? entry?.[fallbackLocale] ?? key;
    return interpolate(template, variables);
  };

  const hasKey = (key) => Boolean(records[key]);

  const exportToCsv = () => {
    const headers = parsed.headers.length ? parsed.headers : ['key', fallbackLocale, 'comment'];
    const escape = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = Object.values(records).map((record) => headers.map((header) => escape(record[header])).join(','));
    return [headers.map(escape).join(','), ...rows].join('\n');
  };

  return { t: getText, hasKey, exportToCsv };
};

export { interpolate, parseCsv, createI18nLoader };
