const BLOCK_START = '// ==UserScript==';
const BLOCK_END = '// ==/UserScript==';
const ENTRY_PATTERN = /^\/\/\s*@(\S+)\s+(.*)$/;

export class MetadataError extends Error {}

/**
 * Locate the UserScript metadata block within a file's content.
 * @param {string} content
 * @returns {{ lines: string[], startIndex: number, endIndex: number }}
 */
export function extractMetadataBlock(content) {
  const lines = content.split('\n');
  const startIndex = lines.findIndex((line) => line.trim() === BLOCK_START);
  const endIndex = lines.findIndex((line) => line.trim() === BLOCK_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new MetadataError('missing or malformed UserScript metadata block (==UserScript==)');
  }

  return { lines, startIndex, endIndex };
}

/**
 * Parse `// @key value` entries between the block markers.
 * @param {string[]} lines
 * @param {number} startIndex
 * @param {number} endIndex
 * @returns {{ key: string, value: string, line: number }[]}
 */
export function parseMetadataEntries(lines, startIndex, endIndex) {
  const entries = [];
  for (let i = startIndex + 1; i < endIndex; i += 1) {
    const match = lines[i].match(ENTRY_PATTERN);
    if (match) {
      entries.push({ key: match[1], value: match[2].trim(), line: i });
    }
  }
  return entries;
}

export function getMetaValue(entries, key) {
  return entries.find((entry) => entry.key === key)?.value;
}

export function getMetaValues(entries, key) {
  return entries.filter((entry) => entry.key === key).map((entry) => entry.value);
}
