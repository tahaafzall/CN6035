import { describe, expect, it } from 'vitest';

import { shortHash } from './formatters';

describe('shortHash', () => {
  it('keeps short hashes unchanged', () => {
    expect(shortHash('0x1234', 4, 2)).toBe('0x1234');
  });

  it('truncates long hashes predictably', () => {
    expect(shortHash('0x1234567890abcdef')).toBe('0x1234...cdef');
  });
});
