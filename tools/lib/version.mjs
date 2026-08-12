const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export function isValidVersion(version) {
  return typeof version === 'string' && SEMVER_PATTERN.test(version);
}

/**
 * Increment the patch component of an X.Y.Z version string.
 * @param {string} version
 * @returns {string}
 */
export function bumpPatch(version) {
  const match = version.match(SEMVER_PATTERN);
  if (!match) {
    throw new Error(`invalid version format: "${version}" (expected X.Y.Z)`);
  }
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${Number(patch) + 1}`;
}
