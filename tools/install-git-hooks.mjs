#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import process from 'node:process';

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
  console.log('Git hooks path set to .githooks (pre-commit auto-bumps userscript versions).');
} catch {
  // Not inside a Git repository (e.g. installed as a package) — nothing to configure.
  process.exit(0);
}
