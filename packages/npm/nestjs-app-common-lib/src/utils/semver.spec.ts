import { isValidSemver, semverMajor } from './semver';

// expectations taken from the `semver` package (`semver.valid` / `semver.major`) these helpers replace
const VALID: Array<[string, number]> = [
  ['1.0.0', 1],
  ['v1.2.3', 1],
  ['  2.0.0  ', 2],
  ['1.0.0-alpha.1', 1],
  ['1.0.0+build.5', 1],
  ['1.0.0-rc.1+b', 1],
  ['10.20.30', 10],
];

const INVALID: unknown[] = [
  '01.0.0',
  '1.0',
  '1',
  '1.0.0.0',
  '=1.0.0',
  'vv1.0.0',
  'V1.0.0',
  '1.0.0-',
  '1.0.0-01',
  '',
  'abc',
  null,
  undefined,
  1,
  `1.0.0-${'a'.repeat(300)}`,
];

describe('isValidSemver', () => {
  it.each(VALID)('accepts %p', (version) => {
    expect(isValidSemver(version)).toBe(true);
  });

  it.each(INVALID)('rejects %p', (version) => {
    expect(isValidSemver(version)).toBe(false);
  });
});

describe('semverMajor', () => {
  it.each(VALID)('reads the major of %p', (version, major) => {
    expect(semverMajor(version)).toBe(major);
  });

  it.each(INVALID)('throws for %p', (version) => {
    expect(() => semverMajor(version as string)).toThrow(TypeError);
  });
});
