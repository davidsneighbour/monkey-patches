import { describe, expect, it } from 'vitest';
import { validateUserscript } from '../tools/lib/validate.mjs';

const VALID = `// ==UserScript==
// @name         Example
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @version      1.0.0
// @description  Example description
// @match        https://example.com/settings
// @grant        none
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js
// ==/UserScript==

console.log('hi');
`;

describe('validateUserscript', () => {
  it('accepts a well-formed script with no errors or warnings', () => {
    const { errors, warnings } = validateUserscript(VALID, 'scripts/example/example.user.js');
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('errors when the metadata block is missing', () => {
    const { errors } = validateUserscript('console.log(1);', 'scripts/x/x.user.js');
    expect(errors.some((e) => /metadata block/.test(e))).toBe(true);
  });

  it('errors on a wrong file extension', () => {
    const { errors } = validateUserscript(VALID, 'scripts/example/example.js');
    expect(errors).toContain('file must use the .user.js extension');
  });

  it('errors on missing @name, @version, @match, @updateURL, @downloadURL', () => {
    const minimal = `// ==UserScript==
// @grant        none
// ==/UserScript==
`;
    const { errors } = validateUserscript(minimal, 'scripts/x/x.user.js');
    expect(errors).toContain('missing @name');
    expect(errors).toContain('missing @version');
    expect(errors.some((e) => e.includes('@match'))).toBe(true);
    expect(errors).toContain('missing @updateURL');
    expect(errors).toContain('missing @downloadURL');
  });

  it('errors on invalid version format', () => {
    const bad = VALID.replace('1.0.0', 'v1.0');
    const { errors } = validateUserscript(bad, 'scripts/example/example.user.js');
    expect(errors.some((e) => /invalid @version/.test(e))).toBe(true);
  });

  it('errors when update/download URLs are not HTTPS', () => {
    const bad = VALID.replace(
      '@updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js',
      '@updateURL    http://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js',
    );
    const { errors } = validateUserscript(bad, 'scripts/example/example.user.js');
    expect(errors).toContain('@updateURL must use HTTPS');
  });

  it('errors when update and download URLs point to different files', () => {
    const bad = VALID.replace(
      '@downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/example/example.user.js',
      '@downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/other/other.user.js',
    );
    const { errors } = validateUserscript(bad, 'scripts/example/example.user.js');
    expect(errors).toContain('@updateURL and @downloadURL should point to the same file');
  });

  it('warns on overly broad @match', () => {
    const broad = VALID.replace(
      '@match        https://example.com/settings',
      '@match        *://*/*',
    );
    const { warnings } = validateUserscript(broad, 'scripts/example/example.user.js');
    expect(warnings.some((w) => /overly broad/.test(w))).toBe(true);
  });

  it('warns on privileged @grant', () => {
    const privileged = VALID.replace('@grant        none', '@grant        GM_setValue');
    const { warnings } = validateUserscript(privileged, 'scripts/example/example.user.js');
    expect(warnings.some((w) => /privileged @grant/.test(w))).toBe(true);
  });

  it('warns on @require, and flags mutable "latest" URLs', () => {
    const withRequire = VALID.replace(
      '// @grant        none',
      '// @grant        none\n// @require      https://cdn.example.com/lib@latest/lib.js',
    );
    const { warnings } = validateUserscript(withRequire, 'scripts/example/example.user.js');
    expect(warnings.some((w) => /@require is used/.test(w))).toBe(true);
    expect(warnings.some((w) => /mutable @require/.test(w))).toBe(true);
  });

  it('errors when an obvious secret pattern is present', () => {
    const withSecret = VALID.replace(
      "console.log('hi');",
      "const apiKey = 'sk_live_abcdefgh12345678';",
    );
    const { errors } = validateUserscript(withSecret, 'scripts/example/example.user.js');
    expect(errors.some((e) => /possible secret detected/.test(e))).toBe(true);
  });
});
