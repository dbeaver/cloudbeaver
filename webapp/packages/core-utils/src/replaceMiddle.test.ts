/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { replaceMiddle } from './replaceMiddle.js';

describe('replaceMiddle', () => {
  it('should replace middle of string', () => {
    const result = replaceMiddle('1234567890', '...', 3, 9);
    expect(result).toBe('123...890');
  });

  it('should return value if it is shorter than limiter', () => {
    const result = replaceMiddle('1234567890', '...', 3, 11);
    expect(result).toBe('1234567890');
  });

  it('should return replacement only if side length is 0', () => {
    const result = replaceMiddle('1234567890', '...', 0, 0);
    expect(result).toBe('...');
  });

  it('should return replacement only if side length is negative', () => {
    const result = replaceMiddle('1234567890', '...', -1, 3);
    expect(result).toBe('...');
  });
});
