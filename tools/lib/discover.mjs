import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const IGNORED_DIRS = new Set(['node_modules', '.git']);

/**
 * Recursively find every *.user.js file under rootDir.
 * @param {string} rootDir
 * @returns {string[]}
 */
export function findUserscriptFiles(rootDir) {
  const results = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (IGNORED_DIRS.has(entry)) continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.user.js')) {
        results.push(fullPath);
      }
    }
  };

  walk(rootDir);
  return results.sort();
}
