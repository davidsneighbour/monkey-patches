import { execFileSync } from 'node:child_process';

function gitRaw(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function isGitRepository() {
  try {
    gitRaw(['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

export function hasCommits() {
  try {
    gitRaw(['rev-parse', '--verify', 'HEAD']);
    return true;
  } catch {
    return false;
  }
}

/**
 * List *.user.js files changed relative to HEAD.
 * @param {{ staged?: boolean }} [options]
 * @returns {string[]}
 */
export function listChangedUserscripts({ staged = false } = {}) {
  if (!hasCommits()) {
    // Nothing has been committed yet, so there is no HEAD to diff against —
    // every file is new and none needs a version bump.
    return [];
  }
  const args = staged
    ? ['diff', '--name-only', '--cached', '--diff-filter=ACM', '--', '*.user.js']
    : ['diff', '--name-only', 'HEAD', '--diff-filter=ACM', '--', '*.user.js'];
  const output = gitRaw(args).trim();
  return output ? output.split('\n') : [];
}

/**
 * Read a file's content as it existed at HEAD. Returns null if the file is
 * new (not yet committed).
 * @param {string} path
 * @returns {string | null}
 */
export function readFileAtHead(path) {
  try {
    return gitRaw(['show', `HEAD:${path}`]);
  } catch {
    return null;
  }
}
