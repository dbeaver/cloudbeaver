/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';

import { getPathParent } from './getPathParent.js';

jest.mock('./getPathParts', () => ({
  getPathParts: (path: string) => path.split('/'),
  createPath: (...parts: string[]) => parts.join('/'),
}));

describe('getPathParent', () => {
  it('should return the parent path', () => {
    expect(getPathParent('/a/b/c')).toBe('a/b');
  });

  it('should return the parent path if it has no parts', () => {
    expect(getPathParent('')).toBe('');
  });

  it('should return the parent path if it has only one part', () => {
    expect(getPathParent('/a')).toBe('');
  });

  it('should return same string if cannot divide it to full path', () => {
    expect(getPathParent('abc')).toBe('');
  });
});
