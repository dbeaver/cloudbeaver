/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { getPathName } from './getPathName.js';

vitest.mock('./getPathParts', () => ({
  getPathParts: (path: string) => path.split('/'),
}));

describe('getPathName', () => {
  it('should return the last part of the path', () => {
    expect(getPathName('/a/b/c')).toBe('c');
  });

  it('should return the path if it has no parts', () => {
    expect(getPathName('')).toBe('');
  });

  it('should return the path if it has only one part', () => {
    expect(getPathName('/a')).toBe('a');
  });

  it('should return same string if cannot divide it to full path', () => {
    expect(getPathName('abc')).toBe('abc');
  });
});
