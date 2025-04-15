/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { replaceSubstring } from './replaceSubstring.js';

describe('replaceSubstring', () => {
  it('should replace a substring correctly', () => {
    const result = replaceSubstring('Hello, world!', 7, 12, 'there');
    expect(result).toBe('Hello, there!');
  });

  it('should handle beginIndex at the start', () => {
    const result = replaceSubstring('Hello, world!', 0, 5, 'Hi');
    expect(result).toBe('Hi, world!');
  });

  it('should handle endIndex at the end', () => {
    const result = replaceSubstring('Hello, world!', 7, 13, 'everyone');
    expect(result).toBe('Hello, everyone');
  });

  it('should handle empty replacement', () => {
    const result = replaceSubstring('Hello, world!', 7, 13, '');
    expect(result).toBe('Hello, ');
  });

  it('should handle replacement longer than the substring', () => {
    const result = replaceSubstring('Hello, world!', 7, 12, 'everyone out there');
    expect(result).toBe('Hello, everyone out there!');
  });
});
