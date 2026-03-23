// tests/unit/utils.test.js
import { deepClone, createWeaknessArray, formatRelativeDateTime } from '@/shared/utils/utils.js';

describe('deepClone', () => {
  test('returns a deep copy of objects', () => {
    const original = { a: 1, b: { c: 2 } };
    const clone = deepClone(original);
    clone.b.c = 3;
    expect(original.b.c).toBe(2);
    expect(clone).not.toBe(original);
  });
});

describe('createWeaknessArray', () => {
  test('creates array of specified length with default objects', () => {
    const arr = createWeaknessArray(3);
    expect(arr).toHaveLength(3);
    arr.forEach((item) => {
      expect(item).toEqual({ text: '', acquired: '--' });
    });
  });
});

describe('formatRelativeDateTime', () => {
  const fixedNow = new Date('2024-05-10T12:00:00+09:00');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns formatted time for today', () => {
    const timestampSeconds = Math.floor(new Date('2024-05-10T09:30:00+09:00').getTime() / 1000);
    const result = formatRelativeDateTime(timestampSeconds);
    expect(result).toBe('本日 09:30');
  });

  test('returns formatted time for yesterday', () => {
    const timestampSeconds = Math.floor(new Date('2024-05-09T23:00:00+09:00').getTime() / 1000);
    const result = formatRelativeDateTime(timestampSeconds);
    expect(result).toBe('昨日 23:00');
  });

  test('returns date for older timestamps', () => {
    const timestampSeconds = Math.floor(new Date('2024-04-30T12:00:00+09:00').getTime() / 1000);
    const result = formatRelativeDateTime(timestampSeconds);
    expect(result).toBe('2024/04/30');
  });

  test('returns null for invalid values', () => {
    expect(formatRelativeDateTime(null)).toBeNull();
    expect(formatRelativeDateTime('invalid')).toBeNull();
  });
});
