import { describe, expect, it } from 'vitest';
import { isMeaningfulChange } from '../tools/lib/diff.mjs';

const BASE = `// ==UserScript==
// @name         Example
// @version      1.0.0
// @match        https://example.com/*
// @grant        none
// ==/UserScript==

console.log('hi');
`;

describe('isMeaningfulChange', () => {
  it('returns false when content is identical', () => {
    expect(isMeaningfulChange(BASE, BASE)).toBe(false);
  });

  it('returns false when only the @version line differs', () => {
    const bumped = BASE.replace('1.0.0', '1.0.1');
    expect(isMeaningfulChange(BASE, bumped)).toBe(false);
  });

  it('returns true when the version changes alongside other edits', () => {
    const bumped = BASE.replace('1.0.0', '1.0.1').replace(
      "console.log('hi');",
      "console.log('bye');",
    );
    expect(isMeaningfulChange(BASE, bumped)).toBe(true);
  });

  it('returns true when body content changes but version does not', () => {
    const edited = BASE.replace("console.log('hi');", "console.log('bye');");
    expect(isMeaningfulChange(BASE, edited)).toBe(true);
  });

  it('falls back to a raw comparison when a metadata block is absent', () => {
    expect(isMeaningfulChange('a', 'b')).toBe(true);
    expect(isMeaningfulChange('a', 'a')).toBe(false);
  });
});
