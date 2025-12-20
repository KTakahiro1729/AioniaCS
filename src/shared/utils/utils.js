export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function createWeaknessArray(max) {
  return Array(max)
    .fill(null)
    .map(() => ({ text: '', acquired: '--' }));
}

export function formatRelativeDateTime(timestampSeconds, { locale = 'ja-JP', timeZone = 'Asia/Tokyo' } = {}) {
  if (timestampSeconds == null) return null;
  const milliseconds = Number(timestampSeconds) * 1000;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return null;

  const zonedDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  function toZoned(dateTime) {
    const parts = zonedDateFormatter.formatToParts(dateTime).reduce((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

    if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute || !parts.second) {
      return null;
    }

    const isoString = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`;
    return { parts, zonedDate: new Date(isoString) };
  }

  const now = new Date();
  const zonedNow = toZoned(now);
  const zonedTarget = toZoned(date);

  if (!zonedNow || !zonedTarget) return null;

  const startOfToday = new Date(`${zonedNow.parts.year}-${zonedNow.parts.month}-${zonedNow.parts.day}T00:00:00Z`);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setUTCDate(startOfToday.getUTCDate() - 1);

  const timeFormatter = new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' });
  if (zonedTarget.zonedDate >= startOfToday) {
    return `本日 ${timeFormatter.format(date)}`;
  }
  if (zonedTarget.zonedDate >= startOfYesterday) {
    return `昨日 ${timeFormatter.format(date)}`;
  }

  return new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
