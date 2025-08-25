// tests/unit/utils.test.js
import { deepClone, createWeaknessArray } from '../../src/utils/utils.js';

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
