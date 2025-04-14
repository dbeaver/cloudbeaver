/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { formatNumber } from './formatNumber.js';

describe('formatNumber', () => {
  it('should not format number', () => {
    expect(formatNumber(999, 2)).toBe('999');
  });

  it('should format number with no extra decimals', () => {
    expect(formatNumber(1000, 2)).toBe('1k');
    expect(formatNumber(1000000, 2)).toBe('1M');
    expect(formatNumber(1000000000, 2)).toBe('1B');
    expect(formatNumber(1000000000000, 2)).toBe('1T');
    expect(formatNumber(1000000000000000, 2)).toBe('1P');
    expect(formatNumber(1000000000000000000, 2)).toBe('1E');
  });

  it('should format number with extra decimals', () => {
    expect(formatNumber(1230, 2)).toBe('1.23k');
    expect(formatNumber(1230000, 2)).toBe('1.23M');
    expect(formatNumber(1230000000, 2)).toBe('1.23B');
    expect(formatNumber(1230000000000, 2)).toBe('1.23T');
    expect(formatNumber(1230000000000000, 2)).toBe('1.23P');
    expect(formatNumber(1230000000000000000, 2)).toBe('1.23E');
  });

  it('should round formatted number', () => {
    expect(formatNumber(1234, 2)).toBe('1.23k');
    expect(formatNumber(1234567, 2)).toBe('1.23M');
    expect(formatNumber(1234567890, 2)).toBe('1.23B');
    expect(formatNumber(1234567890123, 2)).toBe('1.23T');
    expect(formatNumber(1234567890123456, 2)).toBe('1.23P');
  });
});
