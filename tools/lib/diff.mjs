import { extractMetadataBlock } from './metadata.mjs';

const VERSION_LINE_PATTERN = /^\/\/\s*@version\s+/;

/**
 * Normalise a userscript's @version line to a constant placeholder so version-only
 * edits can be told apart from substantive content changes.
 * @param {string} content
 * @returns {string}
 */
function normaliseVersionLine(content) {
  let block;
  try {
    block = extractMetadataBlock(content);
  } catch {
    return content;
  }
  const { lines, startIndex, endIndex } = block;
  const normalised = lines.map((line, index) => {
    if (index > startIndex && index < endIndex && VERSION_LINE_PATTERN.test(line)) {
      return '// @version <normalised>';
    }
    return line;
  });
  return normalised.join('\n');
}

/**
 * Determine whether newContent differs from oldContent in a way that isn't
 * purely the @version line changing.
 * @param {string} oldContent
 * @param {string} newContent
 * @returns {boolean}
 */
export function isMeaningfulChange(oldContent, newContent) {
  if (oldContent === newContent) return false;
  return normaliseVersionLine(oldContent) !== normaliseVersionLine(newContent);
}
