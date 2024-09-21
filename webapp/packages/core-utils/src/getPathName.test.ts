/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';

import { getPathName } from './getPathName.js';

jest.mock('./getPathParts', () => ({
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
