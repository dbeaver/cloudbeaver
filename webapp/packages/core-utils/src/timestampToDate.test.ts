/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { timestampToDate } from './timestampToDate.js';

describe.skip('timestampToDate', () => {
  it('should convert timestamp to date', () => {
    const date = timestampToDate(1591862400000);
    expect(date).toBe('6/11/2020, 8:00:00 AM');
  });

  it('should convert negative timestamp to date', () => {
    const date = timestampToDate(-1591862400000);
    expect(date).toBe('7/23/1919, 4:00:00 PM');
  });

  it('should convert zero timestamp to date', () => {
    const date = timestampToDate(0);
    expect(date).toBe('1/1/1970, 12:00:00 AM');
  });
});
