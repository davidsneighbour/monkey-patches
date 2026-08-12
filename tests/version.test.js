import { describe, expect, it } from 'vitest';
import { bumpPatch, isValidVersion } from '../tools/lib/version.mjs';

describe('isValidVersion', () => {
  it('accepts X.Y.Z', () => {
    expect(isValidVersion('1.2.3')).toBe(true);
    expect(isValidVersion('0.0.1')).toBe(true);
  });

  it('rejects malformed versions', () => {
    expect(isValidVersion('1.2')).toBe(false);
    expect(isValidVersion('1.2.3.4')).toBe(false);
    expect(isValidVersion('v1.2.3')).toBe(false);
    expect(isValidVersion('')).toBe(false);
    expect(isValidVersion(undefined)).toBe(false);
  });
});

describe('bumpPatch', () => {
  it('increments the patch component', () => {
    expect(bumpPatch('1.2.3')).toBe('1.2.4');
    expect(bumpPatch('0.0.9')).toBe('0.0.10');
  });

  it('leaves major/minor untouched', () => {
    expect(bumpPatch('2.5.0')).toBe('2.5.1');
  });

  it('throws on invalid input', () => {
    expect(() => bumpPatch('not-a-version')).toThrow(/invalid version format/);
  });
});
