// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const MAX_LENGTH = 256;

const normalize = (version: unknown): string | undefined => {
  if (typeof version !== 'string' || version.length > MAX_LENGTH) {
    return undefined;
  }
  return version.trim().replace(/^v/, '');
};

/**
 * Native replacement of `semver.valid`: true when the version is a valid semantic version (a leading "v" is accepted).
 */
export function isValidSemver(version: unknown): version is string {
  const normalized = normalize(version);
  return normalized !== undefined && SEMVER_REGEX.test(normalized);
}

/**
 * Native replacement of `semver.major`: the major number of a semantic version, it throws a TypeError for an invalid version.
 */
export function semverMajor(version: string): number {
  const normalized = normalize(version);
  const match = normalized === undefined ? null : SEMVER_REGEX.exec(normalized);
  if (!match) {
    throw new TypeError(`Invalid Version: ${version}`);
  }
  return Number(match[1]);
}
