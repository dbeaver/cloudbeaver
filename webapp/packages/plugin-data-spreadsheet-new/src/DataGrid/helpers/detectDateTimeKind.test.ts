/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { DateTimeKind } from '../FormattingContext.js';
import { detectDateTimeKind } from './detectDateTimeKind.js';

describe('detectDateTimeKind', () => {
  test('should detect date-only format (YYYY-MM-DD)', () => {
    expect(detectDateTimeKind('2025-12-29')).toBe(DateTimeKind.DateOnly);
    expect(detectDateTimeKind('2024-01-01')).toBe(DateTimeKind.DateOnly);
    expect(detectDateTimeKind('1999-12-31')).toBe(DateTimeKind.DateOnly);
  });

  test('should detect time-only format (HH:MM:SS or HH:MM)', () => {
    expect(detectDateTimeKind('14:30:00')).toBe(DateTimeKind.TimeOnly);
    expect(detectDateTimeKind('00:00:00')).toBe(DateTimeKind.TimeOnly);
    expect(detectDateTimeKind('23:59')).toBe(DateTimeKind.TimeOnly);
    expect(detectDateTimeKind('14:30:00.123')).toBe(DateTimeKind.TimeOnly);
  });

  test('should detect datetime format', () => {
    expect(detectDateTimeKind('2025-12-29 14:30:00')).toBe(DateTimeKind.DateTime);
    expect(detectDateTimeKind('2024-01-01 00:00:00')).toBe(DateTimeKind.DateTime);
    expect(detectDateTimeKind('2025-12-29T14:30:00')).toBe(DateTimeKind.DateTime);
    expect(detectDateTimeKind('2025-12-29T14:30:00.123Z')).toBe(DateTimeKind.DateTime);
  });

  test('should default to DateTime for unrecognized formats', () => {
    expect(detectDateTimeKind('')).toBe(DateTimeKind.DateTime);
    expect(detectDateTimeKind('invalid')).toBe(DateTimeKind.DateTime);
    expect(detectDateTimeKind('2025/12/29')).toBe(DateTimeKind.DateTime);
  });
});
