# AGENTS.md

Primary source of truth for AI coding agents working in this repository. Read this before
making changes. If something here conflicts with what you observe in the code, the code wins
for implementation detail — but update this file if a convention actually changed.

## Purpose

Personal Tampermonkey userscripts, organised by topic, distributed via raw GitHub URLs with
Tampermonkey's built-in auto-update mechanism. No build step, no package publishing, no
releases. See [README.md](README.md) for the full user-facing explanation.

## Structure

```text
scripts/<topic-or-domain>/<name>.user.js   # installable userscripts, grouped by site/topic
tools/                                     # repository tooling (version bump, validation)
tools/lib/                                 # pure, testable logic used by tools/*.mjs CLIs
tests/                                     # Vitest tests for tools/lib/
```

- Group scripts under `scripts/<topic-or-domain>/`, one directory per site or theme (e.g.
  `scripts/github/`, `scripts/cookie-clicker/`). Don't invent a different top-level layout.
- Never create placeholder/fake production userscripts just to populate a folder. An empty
  topic directory with a README is fine.
- Every installable script must use the `.user.js` extension.

## Node / ESM / npm baseline

- Node.js 24+, ESM only (`"type": "module"`, `.mjs` for tool scripts).
- npm only — no other package manager.
- Plain JavaScript for repository tooling. Only reach for TypeScript if there's a concrete,
  specific benefit; don't introduce it by default.
- No unnecessary runtime dependencies. `tools/` currently has zero runtime dependencies beyond
  Node's built-ins (`node:fs`, `node:path`, `node:child_process`, `node:util`).

## Coding conventions

- Biome for linting and formatting (`biome.json`). Run `npm run check` before considering work
  done — it must remain non-mutating (lint + validate + test only, never writes files).
  `npm run fix` / `npm run format` are the separate, mutating commands.
- Keep `tools/lib/*.mjs` pure (no `process.exit`, no direct I/O side effects beyond what's
  explicitly passed in) so it stays unit-testable. `tools/*.mjs` are the thin CLI wrappers that
  do I/O and call into `tools/lib/`.
- Every CLI tool must support `--help` and use named flags (`--file=...`), never positional
  args. Fail with a non-zero exit code and a clear, actionable message on error.

## Userscript metadata requirements

Every `.user.js` file must have a metadata block with at least: `@name`, `@namespace`,
`@version` (`X.Y.Z`), `@description`, `@match` (or `@include`), `@grant`, `@updateURL`,
`@downloadURL`. `@updateURL` and `@downloadURL` must be identical, HTTPS, and point at
`https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/<topic>/<name>.user.js`.
Full convention and example: [README.md](README.md#userscript-metadata-convention).

Minimise Tampermonkey privileges:

- Prefer `@grant none`. Only add specific `GM_*` grants a script actually calls.
- Keep `@match` as narrow as the task allows — a specific path over a whole domain, a whole
  domain over a wildcard.
- Avoid `@require`; if unavoidable, pin the exact version/commit, never `latest` or a moving
  ref.

## Versioning behaviour

`@version` is managed by `tools/userscript-version.mjs` (`npm run userscripts:version`), never
hand-edited except when authoring a brand new script (start at `1.0.0`). It bumps the patch
component only, and only when a file's content changed beyond the `@version` line itself
(diffed against `HEAD`). Don't change this default-patch-bump behaviour without updating both
this file and README.md. A pre-commit hook (`.githooks/pre-commit`, installed via `npm run
prepare`) runs this automatically on staged `.user.js` changes — don't duplicate that logic in
a GitHub Action, and don't design any automation that creates recursive or noisy bot commits.

## Validation expectations

`tools/userscript-validate.mjs` (`npm run userscripts:validate`) must keep failing (non-zero
exit) on: missing metadata block, missing `@name`, missing/invalid `@version`, no
`@match`/`@include`, missing or non-HTTPS `@updateURL`/`@downloadURL`, mismatched update/download
paths, wrong file extension, obvious hardcoded-secret patterns. Broad `@match`, privileged
`@grant`, `@require`, and mutable dependency URLs are warnings, not errors — don't promote them
to errors without discussing it, since that's a deliberate choice to keep the checker
lightweight. This tool is a convention/tripwire checker, not a security scanner — don't imply
otherwise in messages or docs.

## Testing expectations

Add or update a Vitest test in `tests/` for any behavioural change to `tools/lib/`. Tests must
not depend on the ambient Git state of the working repo (no shelling out to `git` in tests) —
exercise the pure functions directly with inline fixtures, the way the existing tests do.

## Security rules

- Never commit credentials, cookies, session tokens, API keys, save data, or any other
  authentication/browser/session state, in a userscript or anywhere else in this repo.
- Don't add code that exfiltrates page data to a third-party endpoint without the human owner
  explicitly asking for that behaviour.
- If you think a userscript needs a broad `@grant` or `@match`, justify it in the script's
  `@description` or a comment rather than defaulting to it.

## Before introducing new patterns

Look at existing files in `scripts/`, `tools/`, and `tests/` first. Match the existing metadata
header format, the `tools/*.mjs` + `tools/lib/*.mjs` split, and the test style already in use,
rather than introducing a new convention. If you do change a repository-wide convention, update
this file (and README.md where user-facing) in the same change.
