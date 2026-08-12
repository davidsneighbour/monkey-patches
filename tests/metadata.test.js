import { describe, expect, it } from 'vitest';
import {
  MetadataError,
  extractMetadataBlock,
  getMetaValue,
  getMetaValues,
  parseMetadataEntries,
} from '../tools/lib/metadata.mjs';

const SAMPLE = `// ==UserScript==
// @name         Example
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @version      1.0.0
// @match        https://example.com/*
// @match        https://example.org/*
// @grant        none
// ==/UserScript==

console.log('hi');
`;

describe('extractMetadataBlock', () => {
  it('finds the start and end markers', () => {
    const { startIndex, endIndex } = extractMetadataBlock(SAMPLE);
    expect(startIndex).toBe(0);
    expect(endIndex).toBe(7);
  });

  it('throws MetadataError when the block is missing', () => {
    expect(() => extractMetadataBlock('console.log(1);')).toThrow(MetadataError);
  });

  it('throws when only the start marker is present', () => {
    expect(() => extractMetadataBlock('// ==UserScript==\n// @name X\n')).toThrow(MetadataError);
  });
});

describe('parseMetadataEntries / getMetaValue(s)', () => {
  const { lines, startIndex, endIndex } = extractMetadataBlock(SAMPLE);
  const entries = parseMetadataEntries(lines, startIndex, endIndex);

  it('parses single-value entries', () => {
    expect(getMetaValue(entries, 'name')).toBe('Example');
    expect(getMetaValue(entries, 'version')).toBe('1.0.0');
  });

  it('parses repeated entries as arrays', () => {
    expect(getMetaValues(entries, 'match')).toEqual([
      'https://example.com/*',
      'https://example.org/*',
    ]);
  });

  it('returns undefined for missing keys', () => {
    expect(getMetaValue(entries, 'updateURL')).toBeUndefined();
  });
});
