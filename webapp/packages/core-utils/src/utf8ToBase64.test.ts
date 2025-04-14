/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { utf8ToBase64 } from './utf8ToBase64.js';

describe('utf8ToBase64', () => {
  it('should convert utf8 to base64', () => {
    expect(utf8ToBase64('test')).toBe('dGVzdA==');
    expect(utf8ToBase64('')).toBe('');
    expect(utf8ToBase64('test test')).toBe('dGVzdCB0ZXN0');
  });

  it('should convert utf8 to base64 with special characters', () => {
    expect(utf8ToBase64('test % test')).toBe('dGVzdCAlIHRlc3Q=');
    expect(utf8ToBase64('%')).toBe('JQ==');
  });
});
