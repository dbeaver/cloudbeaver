/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getPathParts } from './getPathParts.js';

describe('getPathParts', () => {
  it('should return full parts', () => {
    expect(getPathParts('/a/b/c')).toStrictEqual(['', 'a', 'b', 'c']);
  });

  it('should return empty part', () => {
    expect(getPathParts('')).toStrictEqual(['']);
  });

  it('should return 2 parts', () => {
    expect(getPathParts('/a')).toStrictEqual(['', 'a']);
  });

  it('should return same string in array', () => {
    expect(getPathParts('abc')).toStrictEqual(['abc']);
  });
});
