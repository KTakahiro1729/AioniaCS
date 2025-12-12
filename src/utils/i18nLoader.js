const interpolate = (template, variables = {}) =>
  String(template).replace(/\{(\w+)\}/g, (match, varName) => {
    const value = variables[varName];
    return value === undefined || value === null ? match : value;
  });

const splitCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((value) => value.trim());
};

const parseCsv = (rawCsv) => {
  const lines = rawCsv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], records: {} };
  }

  const headers = splitCsvLine(lines[0]);
  const records = lines.slice(1).reduce((acc, line) => {
    const cells = splitCsvLine(line);
    if (!cells.length) return acc;

    const record = headers.reduce((row, header, index) => {
      const cell = cells[index] ?? '';
      return { ...row, [header]: cell };
    }, {});

    if (record.key) {
      acc[record.key] = record;
    }

    return acc;
  }, {});

  return { headers, records };
};

export const createI18nLoader = (rawCsv, locale = 'ja', fallbackLocale = 'ja') => {
  const { records } = parseCsv(rawCsv);

  const getText = (key, variables) => {
    const entry = records[key];
    const template = entry?.[locale] ?? entry?.[fallbackLocale] ?? key;
    return interpolate(template, variables);
  };

  const hasKey = (key) => Boolean(records[key]);

  const exportToCsv = () => {
    const headers = ['key', fallbackLocale, 'comment'];
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

export { interpolate, parseCsv };
