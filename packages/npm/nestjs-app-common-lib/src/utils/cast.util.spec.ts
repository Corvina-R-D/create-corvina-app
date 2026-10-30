import { toNumber } from './cast.util';

describe('toNumber', () => {
  it('reads the numbers of a body and the strings of a query', () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber('0')).toBe(0);
    expect(toNumber(6)).toBe(6);
    expect(toNumber('12')).toBe(12);
    expect(toNumber(2.7)).toBe(2);
  });

  it('gives the default for a missing value or not a number', () => {
    expect(toNumber(undefined, { default: 10 })).toBe(10);
    expect(toNumber(null, { default: 10 })).toBe(10);
    expect(toNumber('', { default: 10 })).toBe(10);
    expect(toNumber('abc', { default: 10 })).toBe(10);
    expect(toNumber(undefined)).toBeUndefined();
    expect(toNumber('abc')).toBeUndefined();
  });

  it('keeps 0 instead of the default', () => {
    expect(toNumber(0, { default: 10 })).toBe(0);
  });

  it('clamps to min and max', () => {
    expect(toNumber(-1, { min: 0, max: 6 })).toBe(0);
    expect(toNumber(9, { min: 0, max: 6 })).toBe(6);
    expect(toNumber(0, { min: 0, max: 6 })).toBe(0);
    expect(toNumber('200', { default: 10, max: 100 })).toBe(100);
  });
});
