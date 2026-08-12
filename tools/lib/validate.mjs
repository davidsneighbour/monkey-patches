import {
  extractMetadataBlock,
  getMetaValue,
  getMetaValues,
  parseMetadataEntries,
} from './metadata.mjs';
import { isValidVersion } from './version.mjs';

// Intentionally narrow, high-confidence patterns only. This is a lightweight
// tripwire, not a security scanner — see README "Security considerations".
const SECRET_PATTERNS = [
  { name: 'AWS access key ID', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'PEM private key block', pattern: /-----BEGIN[ A-Z]*PRIVATE KEY-----/ },
  { name: 'GitHub token', pattern: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: 'Slack token', pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  {
    name: 'hardcoded credential assignment',
    pattern: /(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
  },
];

const BROAD_MATCH_PATTERNS = new Set(['*://*/*', 'http://*/*', 'https://*/*', '<all_urls>', '*']);

function stripProtocol(url) {
  return url.replace(/^https?:\/\//, '');
}

/**
 * Validate a single userscript's content against the repository's metadata conventions.
 * @param {string} content
 * @param {string} filePath
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateUserscript(content, filePath) {
  const errors = [];
  const warnings = [];

  if (!filePath.endsWith('.user.js')) {
    errors.push('file must use the .user.js extension');
  }

  let entries;
  try {
    const block = extractMetadataBlock(content);
    entries = parseMetadataEntries(block.lines, block.startIndex, block.endIndex);
  } catch (error) {
    errors.push(error.message);
    return { errors, warnings };
  }

  if (!getMetaValue(entries, 'name')) {
    errors.push('missing @name');
  }

  const version = getMetaValue(entries, 'version');
  if (!version) {
    errors.push('missing @version');
  } else if (!isValidVersion(version)) {
    errors.push(`invalid @version "${version}" (expected X.Y.Z)`);
  }

  const matches = [...getMetaValues(entries, 'match'), ...getMetaValues(entries, 'include')];
  if (matches.length === 0) {
    errors.push('missing @match (or @include) — at least one inclusion rule is required');
  }
  for (const match of matches) {
    if (BROAD_MATCH_PATTERNS.has(match)) {
      warnings.push(`overly broad @match rule "${match}"`);
    }
  }

  const updateURL = getMetaValue(entries, 'updateURL');
  const downloadURL = getMetaValue(entries, 'downloadURL');

  if (!updateURL) errors.push('missing @updateURL');
  if (!downloadURL) errors.push('missing @downloadURL');

  for (const [key, url] of [
    ['updateURL', updateURL],
    ['downloadURL', downloadURL],
  ]) {
    if (url && !url.startsWith('https://')) {
      errors.push(`@${key} must use HTTPS`);
    }
  }

  if (updateURL && downloadURL && stripProtocol(updateURL) !== stripProtocol(downloadURL)) {
    errors.push('@updateURL and @downloadURL should point to the same file');
  }

  const grants = getMetaValues(entries, 'grant');
  const privilegedGrants = grants.filter((grant) => grant !== 'none');
  if (privilegedGrants.length > 0) {
    warnings.push(`privileged @grant entries: ${privilegedGrants.join(', ')}`);
  }

  const requires = getMetaValues(entries, 'require');
  if (requires.length > 0) {
    warnings.push(`@require is used (${requires.length}) — prefer inlining code where practical`);
    for (const req of requires) {
      if (/latest/i.test(req)) {
        warnings.push(`mutable @require dependency URL (contains "latest"): "${req}"`);
      }
    }
  }

  for (const { name, pattern } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`possible secret detected (${name}) — remove before committing`);
    }
  }

  return { errors, warnings };
}
