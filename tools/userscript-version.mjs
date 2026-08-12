#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { decideVersionBump } from './lib/bump-decision.mjs';
import { isGitRepository, listChangedUserscripts, readFileAtHead } from './lib/git.mjs';

const HELP_TEXT = `Usage: npm run userscripts:version -- [options]

Increment the @version (patch component) of changed .user.js files.

Options:
  --file=<path>   Operate on a single file instead of auto-detecting changes
  --staged        Only consider files staged in the Git index (used by the pre-commit hook)
  --help          Show this help message

By default, compares every tracked *.user.js file against the last commit (HEAD)
and bumps @version only for files whose content changed beyond the @version line
itself — running this command repeatedly with no further edits is a no-op.
`;

function printHelp() {
  process.stdout.write(HELP_TEXT);
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function toRepoRelativePath(path) {
  return relative(process.cwd(), resolve(path)).split('\\').join('/');
}

function processFile(path) {
  const repoRelativePath = toRepoRelativePath(path);
  const oldContent = readFileAtHead(repoRelativePath);

  if (oldContent === null) {
    return { path, status: 'skipped', reason: 'new file, no bump needed' };
  }

  const newContent = readFileSync(path, 'utf8');
  const decision = decideVersionBump(oldContent, newContent);

  if (decision.action === 'error') {
    throw new Error(`${path}: ${decision.message}`);
  }
  if (decision.action === 'skip') {
    return { path, status: 'skipped', reason: decision.reason };
  }

  writeFileSync(path, decision.content);
  return { path, status: 'bumped', from: decision.from, to: decision.to };
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        file: { type: 'string' },
        staged: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
    }));
  } catch (error) {
    fail(error.message);
    return;
  }

  if (values.help) {
    printHelp();
    return;
  }

  if (!isGitRepository()) {
    fail('not inside a Git repository');
    return;
  }

  let targets;
  try {
    targets = values.file ? [values.file] : listChangedUserscripts({ staged: values.staged });
  } catch (error) {
    fail(`failed to determine changed files: ${error.message}`);
    return;
  }

  if (targets.length === 0) {
    console.log('No changed .user.js files to version.');
    return;
  }

  const results = [];
  for (const path of targets) {
    try {
      results.push(processFile(path));
    } catch (error) {
      fail(error.message);
      return;
    }
  }

  for (const result of results) {
    if (result.status === 'bumped') {
      console.log(`bumped   ${result.path}  ${result.from} -> ${result.to}`);
    } else {
      console.log(`skipped  ${result.path}  (${result.reason})`);
    }
  }

  const bumpedCount = results.filter((result) => result.status === 'bumped').length;
  console.log(`\n${bumpedCount} file(s) bumped, ${results.length - bumpedCount} skipped.`);
}

main();
