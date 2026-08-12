# monkey-patches

Personal [Tampermonkey](https://www.tampermonkey.net/) userscripts, organised by topic, with
Git-based install/update and automatic version bumping. This repository is public so any
script here can be installed directly from a raw GitHub URL — see
[Why this repository is public](#why-this-repository-is-public).

## Directory convention

```text
scripts/<topic-or-domain>/
    <name>.user.js
```

Each subdirectory of `scripts/` groups userscripts by the site or topic they target, e.g.

```text
scripts/
├── cookie-clicker/
├── github/
└── example.com/
```

An installable script always uses the `.user.js` extension so Tampermonkey recognises it.
Non-installable helper files (README, shared snippets) live alongside it without that extension.

## Userscript metadata convention

Every installable script must start with a standard metadata header:

```javascript
// ==UserScript==
// @name         Example
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @version      1.0.0
// @description  Example description
// @match        https://example.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js
// ==/UserScript==
```

Rules:

- **`@updateURL` / `@downloadURL`** must point at the raw GitHub file on the `main` branch
  (see [obtaining the raw URL](#how-to-obtain-the-raw-installupdate-url)). Both must be identical
  and use HTTPS.
- **`@version`** drives Tampermonkey's update check. It's managed automatically — see
  [Versioning](#versioning).
- **`@match`** should be as narrow as reasonably possible (a specific path, not a whole domain,
  when that's enough).
- **`@grant none`** is preferred. Only request Tampermonkey APIs (`GM_*`, `unsafeWindow`, ...)
  the script genuinely needs.
- **`@require`** should be avoided where practical — prefer inlining small amounts of code.
  If a remote dependency is unavoidable, pin it to a specific version, not `latest` or an
  unpinned branch.
- **Secrets never belong here.** No credentials, cookies, tokens, session data, or other
  browser/account state — see [Security considerations](#security-considerations).

## How installation works

Tampermonkey can install a script directly from its raw GitHub URL. Once installed, it polls
`@updateURL` periodically, compares the remote `@version` to the installed one, and if the
remote is newer, re-downloads from `@downloadURL` and updates automatically — no store, no
build step, no release process required.

### How to obtain the raw install/update URL

For a script at `scripts/<topic>/<name>.user.js` on the `main` branch:

```text
https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/<topic>/<name>.user.js
```

Open that URL directly (or click it from GitHub's file view via "Raw") and Tampermonkey will
offer to install it.

## Versioning

`@version` is bumped automatically — you should not hand-edit it.

```bash
npm run userscripts:version
```

This:

1. Finds `.user.js` files that changed relative to `HEAD` (or pass `--file=<path>` for one
   specific file, or `--staged` to only look at the Git index).
2. For each, compares the working-tree content against the committed content at `HEAD`:
   - If the working copy's `@version` already differs from the committed `@version`, it's
     treated as already bumped for this pending change (e.g. a previous run, or a manual edit)
     and is skipped. This is what keeps repeated invocations from causing runaway increments —
     the tool never bumps a version that's already ahead of `HEAD`.
   - Otherwise, if the content differs from `HEAD` in any way other than the `@version` line
     itself, the patch component is incremented (`1.2.3 -> 1.2.4`) and only that line is
     rewritten, leaving the rest of the file untouched.
   - If nothing meaningful changed, it's skipped.
3. Fails with a clear error (non-zero exit) if a file's metadata block or `@version` is missing
   or malformed.

Run `node tools/userscript-version.mjs --help` for the full option list.

Note: if you run `userscripts:version` manually more than once on the same uncommitted edit
(e.g. you bump, then edit further, then run it again before committing), the tool bumps at most
once per invocation and won't bump a second time purely because the working copy is still ahead
of `HEAD` — the version still increases at least once for the whole edit session, which is all
Tampermonkey's update check needs. Commit, then edit again, to get a fresh bump per change.

### Git integration

A local `pre-commit` hook (in [.githooks/](.githooks/), installed automatically by
`npm run prepare` / `npm install`) runs `userscripts:version --staged` before each commit and
re-stages any files it bumped, so the version increment is part of the same commit as your
edit. This was chosen over a GitHub Action that commits back to `main`, which would create
extra, easy-to-miss automated commits and complicate protected-branch workflows. The flow end
to end:

```text
edit userscript
    -> git commit (pre-commit hook bumps @version, re-stages it)
    -> git push
    -> raw GitHub file changes
    -> Tampermonkey sees a newer @version
    -> browser updates the userscript
```

## Validation

```bash
npm run userscripts:validate
```

Checks every `*.user.js` file under `scripts/` and reports errors (fail the command) and
warnings (reported, non-fatal):

**Errors:** missing metadata block, missing `@name`, missing/invalid `@version`, no `@match`
(or `@include`), missing `@updateURL`/`@downloadURL`, non-HTTPS URLs, `@updateURL` and
`@downloadURL` pointing at different files, wrong file extension, obvious hardcoded-secret
patterns.

**Warnings:** overly broad `@match` (e.g. `*://*/*`), privileged `@grant` entries, `@require`
usage, mutable dependency URLs (e.g. containing `latest`).

This is a convention checker, not a security scanner — it only catches a short list of
obviously-shaped secrets (AWS keys, PEM blocks, common token prefixes, `key = "..."`-style
assignments) via regex. It cannot detect obfuscated, encoded, or otherwise disguised secrets.
Review every diff yourself before committing.

## npm scripts

| Script | Description |
| --- | --- |
| `npm run lint` | Lint with Biome (no changes made) |
| `npm run format` | Format with Biome (writes changes) |
| `npm run format:check` | Check formatting without writing |
| `npm run fix` | Lint + format with autofixes (writes changes) |
| `npm test` | Run the Vitest suite |
| `npm run userscripts:validate` | Validate all userscripts' metadata |
| `npm run userscripts:version` | Bump `@version` for changed userscripts |
| `npm run check` | Lint + validate + test — non-mutating, safe for CI |

## Adding a new userscript

1. Pick (or create) a topic directory: `scripts/<topic>/`.
2. Create `scripts/<topic>/<name>.user.js` with the metadata header above, using
   `https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/<topic>/<name>.user.js`
   for both `@updateURL` and `@downloadURL`, and starting at `@version 1.0.0`.
3. Write the script body, wrapped in an IIFE:

   ```javascript
   (function () {
     'use strict';
     // ...
   })();
   ```

4. Run `npm run userscripts:validate` and `npm run check`.
5. Commit. The pre-commit hook only bumps versions for *changed* existing scripts, so a brand
   new file keeps the `1.0.0` you gave it.
6. Push, then install the script in Tampermonkey via its raw GitHub URL.

## Security considerations

- Never commit credentials, cookies, session tokens, API keys, or any other authentication or
  account state. Userscripts run in the context of real, logged-in sites — anything hardcoded
  in one is effectively public.
- Prefer `@grant none`. Only request the specific `GM_*` APIs a script needs.
- Keep `@match` as narrow as the task allows.
- Pin any remote dependency (`@require`, `@resource`, or fetched URLs) to an immutable version,
  never `latest` or a moving branch/tag.
- `npm run userscripts:validate` catches some obvious secret patterns, but it is not a
  substitute for reviewing your own diffs.

## Why this repository is public

Tampermonkey's auto-update mechanism needs an unauthenticated URL it can poll (`@updateURL`)
and fetch from (`@downloadURL`). A public repository lets `raw.githubusercontent.com` serve
those files with no extra hosting or auth. This is also exactly why secrets must never be
stored here: everything in this repository, including full history, is world-readable.

## Testing

```bash
npm test
```

Vitest covers the pure logic in `tools/lib/` (metadata parsing, version bumping, meaningful-
change detection, validation rules) without touching Git or the filesystem beyond what's under
test.
