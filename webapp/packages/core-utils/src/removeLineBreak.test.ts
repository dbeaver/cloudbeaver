/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { removeLineBreak } from './removeLineBreak.js';

describe('removeLineBreak', () => {
  it('should remove line break characters from a string', () => {
    const input = 'This is a\r\ntest string\nwith line breaks\r.';
    const expectedOutput = 'This is atest stringwith line breaks.';
    expect(removeLineBreak(input)).toEqual(expectedOutput);
  });
});
