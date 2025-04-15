/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getProgressPercent } from './getProgressPercent.js';

describe('getProgressPercent', () => {
  it('calculates the correct percentage', () => {
    expect(getProgressPercent(50, 100)).toBe(50);
    expect(getProgressPercent(25, 100)).toBe(25);
  });

  it('returns 0% when nothing is done', () => {
    expect(getProgressPercent(0, 100)).toBe(0);
  });

  it('returns 100% when done equals total', () => {
    expect(getProgressPercent(100, 100)).toBe(100);
  });

  it('does not exceed 100%', () => {
    expect(getProgressPercent(110, 100)).toBe(100);
  });

  it('does not drop below 0%', () => {
    expect(getProgressPercent(-10, 100)).toBe(0);
  });

  it('handles total as zero without throwing error', () => {
    expect(getProgressPercent(10, 0)).toBe(100);
  });
});
