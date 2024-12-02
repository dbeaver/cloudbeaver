/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from '@jest/globals';

import { textToHex } from './textToHex.js';

const value = 'test value';

describe('textToHex', () => {
  it('should return a hex string', () => {
    expect(textToHex(value)).toBe('746573742076616C7565');
  });

  it('should return an empty string', () => {
    expect(textToHex('')).toBe('');
  });
});
