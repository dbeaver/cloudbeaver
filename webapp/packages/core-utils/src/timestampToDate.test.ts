/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { mockToLocaleString } from './__mocks__/mockToLocaleString.js';
import { timestampToDate } from './timestampToDate.js';

describe('timestampToDate', () => {
  mockToLocaleString();

  it('should convert timestamp to date', () => {
    const date = timestampToDate(1591862400000);
    expect(date).toBe('06/11/2020, 08:00:00');
  });

  it('should convert negative timestamp to date', () => {
    const date = timestampToDate(-1591862400000);
    expect(date).toBe('07/23/1919, 16:00:00');
  });

  it('should convert zero timestamp to date', () => {
    const date = timestampToDate(0);
    // required for windows tests to pass
    const validResults = ['01/01/1970, 00:00:00', '01/01/1970, 24:00:00'];

    expect(validResults).toContain(date);
  });
});
