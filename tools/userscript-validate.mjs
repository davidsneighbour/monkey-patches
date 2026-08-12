#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import { findUserscriptFiles } from './lib/discover.mjs';
import { validateUserscript } from './lib/validate.mjs';

const HELP_TEXT = `Usage: npm run userscripts:validate -- [options]

Validate every *.user.js file's metadata against the repository conventions.

Options:
  --dir=<path>   Root directory to scan (default: scripts)
  --help         Show this help message

Exits non-zero if any file has errors. Warnings are reported but do not fail
the command. This is a lightweight convention checker, not a security scanner
— see README "Security considerations" for its limitations.
`;

function printHelp() {
  process.stdout.write(HELP_TEXT);
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        dir: { type: 'string', default: 'scripts' },
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

  const files = findUserscriptFiles(values.dir);

  if (files.length === 0) {
    console.log(`No .user.js files found under "${values.dir}".`);
    return;
  }

  let errorCount = 0;
  let warningCount = 0;

  for (const path of files) {
    const relPath = relative(process.cwd(), path);
    const content = readFileSync(path, 'utf8');
    const { errors, warnings } = validateUserscript(content, path);

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`ok       ${relPath}`);
      continue;
    }

    for (const error of errors) {
      console.log(`error    ${relPath}: ${error}`);
      errorCount += 1;
    }
    for (const warning of warnings) {
      console.log(`warning  ${relPath}: ${warning}`);
      warningCount += 1;
    }
  }

  console.log(
    `\n${files.length} file(s) checked, ${errorCount} error(s), ${warningCount} warning(s).`,
  );

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
