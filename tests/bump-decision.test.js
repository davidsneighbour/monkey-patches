import { describe, expect, it } from 'vitest';
import { decideVersionBump } from '../tools/lib/bump-decision.mjs';

const BASE = `// ==UserScript==
// @name         Example
// @version      1.0.0
// @match        https://example.com/*
// @grant        none
// ==/UserScript==

console.log('hi');
`;

describe('decideVersionBump', () => {
  it('skips when content is identical to HEAD', () => {
    expect(decideVersionBump(BASE, BASE)).toEqual({
      action: 'skip',
      reason: 'no changes since last commit',
    });
  });

  it('bumps the patch version on a substantive change', () => {
    const edited = BASE.replace("console.log('hi');", "console.log('bye');");
    const decision = decideVersionBump(BASE, edited);
    expect(decision.action).toBe('bump');
    expect(decision.from).toBe('1.0.0');
    expect(decision.to).toBe('1.0.1');
    expect(decision.content).toContain('// @version      1.0.1');
    expect(decision.content).toContain("console.log('bye');");
  });

  it('skips a version-only edit as already ahead of HEAD, not as a fresh bump', () => {
    const versionOnly = BASE.replace('1.0.0', '1.0.1');
    expect(decideVersionBump(BASE, versionOnly)).toEqual({
      action: 'skip',
      reason: 'already at 1.0.1, ahead of committed 1.0.0',
    });
  });

  it('skips when content is identical apart from version-line formatting', () => {
    const reformatted = BASE.replace('// @version      1.0.0', '// @version 1.0.0');
    expect(decideVersionBump(BASE, reformatted)).toEqual({
      action: 'skip',
      reason: 'no meaningful change since last commit',
    });
  });

  it('is idempotent: re-running after a bump (without committing) is a no-op', () => {
    const edited = BASE.replace("console.log('hi');", "console.log('bye');");
    const firstRun = decideVersionBump(BASE, edited);
    expect(firstRun.action).toBe('bump');

    // Simulate the tool having written firstRun.content to disk, then being
    // invoked again before the change is committed (HEAD is still BASE).
    const secondRun = decideVersionBump(BASE, firstRun.content);
    expect(secondRun).toEqual({
      action: 'skip',
      reason: 'already at 1.0.1, ahead of committed 1.0.0',
    });
  });

  it('errors when the metadata block is missing', () => {
    const decision = decideVersionBump(BASE, 'console.log("no header");');
    expect(decision.action).toBe('error');
    expect(decision.message).toMatch(/metadata block/);
  });

  it('errors when @version is missing', () => {
    const noVersion = `// ==UserScript==
// @name X
// ==/UserScript==
body
`;
    const decision = decideVersionBump('other', noVersion);
    expect(decision).toEqual({ action: 'error', message: 'missing @version in metadata block' });
  });

  it('errors when @version is malformed', () => {
    const badVersion = BASE.replace('1.0.0', 'not-a-version');
    const decision = decideVersionBump('other', badVersion);
    expect(decision.action).toBe('error');
    expect(decision.message).toMatch(/invalid @version/);
  });
});
