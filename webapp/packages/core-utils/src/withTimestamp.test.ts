/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { withTimestamp } from './withTimestamp.js';

describe('withTimestamp', () => {
  it('should generate a value with timestamp at the end', () => {
    const mockDate = new Date('2020-09-09T14:13:20');
    const spy = vitest.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

    const value = 'value';
    const expectedValue = `${value} 2020-09-09 14-13-20`;

    expect(withTimestamp(value)).toEqual(expectedValue);

    spy.mockRestore();
  });
});
