import { isMeaningfulChange } from './diff.mjs';
import { extractMetadataBlock, getMetaValue, parseMetadataEntries } from './metadata.mjs';
import { bumpPatch, isValidVersion } from './version.mjs';

function readVersion(content) {
  try {
    const block = extractMetadataBlock(content);
    const entries = parseMetadataEntries(block.lines, block.startIndex, block.endIndex);
    return getMetaValue(entries, 'version');
  } catch {
    return undefined;
  }
}

/**
 * Decide whether a userscript's @version should be bumped, given its content
 * at HEAD and its current working-tree content. Pure: never touches the
 * filesystem or Git, never mutates its inputs.
 *
 * The working copy's @version having already moved past HEAD's is treated as
 * proof that a previous run (or a manual edit) already bumped it for this
 * pending change, so re-running with no further edits is a no-op instead of
 * an unbounded patch increment.
 *
 * @param {string} oldContent - file content as committed at HEAD
 * @param {string} newContent - current working-tree file content
 * @returns {
 *   | { action: 'skip', reason: string }
 *   | { action: 'error', message: string }
 *   | { action: 'bump', from: string, to: string, content: string }
 * }
 */
export function decideVersionBump(oldContent, newContent) {
  if (oldContent === newContent) {
    return { action: 'skip', reason: 'no changes since last commit' };
  }

  let block;
  try {
    block = extractMetadataBlock(newContent);
  } catch (error) {
    return { action: 'error', message: error.message };
  }

  const entries = parseMetadataEntries(block.lines, block.startIndex, block.endIndex);
  const versionEntry = entries.find((entry) => entry.key === 'version');
  const currentVersion = getMetaValue(entries, 'version');

  if (!currentVersion) {
    return { action: 'error', message: 'missing @version in metadata block' };
  }
  if (!isValidVersion(currentVersion)) {
    return { action: 'error', message: `invalid @version "${currentVersion}" (expected X.Y.Z)` };
  }

  const headVersion = readVersion(oldContent);
  if (headVersion !== undefined && headVersion !== currentVersion) {
    return {
      action: 'skip',
      reason: `already at ${currentVersion}, ahead of committed ${headVersion}`,
    };
  }

  if (!isMeaningfulChange(oldContent, newContent)) {
    return { action: 'skip', reason: 'no meaningful change since last commit' };
  }

  const nextVersion = bumpPatch(currentVersion);
  const lines = block.lines.slice();
  lines[versionEntry.line] = lines[versionEntry.line].replace(currentVersion, nextVersion);

  return { action: 'bump', from: currentVersion, to: nextVersion, content: lines.join('\n') };
}
