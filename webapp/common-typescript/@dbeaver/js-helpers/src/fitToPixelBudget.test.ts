/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { DEFAULT_MAX_IMAGE_PIXELS, DEFAULT_MAX_IMAGE_SIDE, fitToPixelBudget } from './fitToPixelBudget.js';

describe('fitToPixelBudget', () => {
  test('should keep the requested scale when the content fits', () => {
    expect(fitToPixelBudget(1200, 800, { scale: 2 })).toBe(2);
  });

  test('should default to scale 1', () => {
    expect(fitToPixelBudget(1200, 800)).toBe(1);
  });

  test('should scale down when the total area exceeds the pixel budget', () => {
    const scale = fitToPixelBudget(12000, 9000, { scale: 2 });

    expect(scale).toBeLessThan(1);
    expect(12000 * scale * 9000 * scale).toBeLessThanOrEqual(DEFAULT_MAX_IMAGE_PIXELS + 1);
  });

  test('should scale down when a single side exceeds the max side', () => {
    const scale = fitToPixelBudget(20000, 300, { scale: 1 });

    expect(20000 * scale).toBeLessThanOrEqual(DEFAULT_MAX_IMAGE_SIDE + 1);
  });

  test('should respect custom budgets', () => {
    expect(fitToPixelBudget(2000, 2000, { scale: 1, maxSide: 1000 })).toBe(0.5);
    expect(fitToPixelBudget(2000, 2000, { scale: 1, maxPixels: 1_000_000 })).toBe(0.5);
  });

  test('should not collapse to zero on an enormous content', () => {
    expect(fitToPixelBudget(10_000_000, 10_000_000, { scale: 1 })).toBeGreaterThan(0);
  });
});
