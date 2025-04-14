/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { isNotNullDefined } from './isNotNullDefined.js';

describe('isNotNullDefined', () => {
  it('should return true', () => {
    expect(isNotNullDefined({})).toBe(true);
    expect(isNotNullDefined(1)).toBe(true);
    expect(isNotNullDefined('')).toBe(true);
    expect(isNotNullDefined([])).toBe(true);
    expect(isNotNullDefined(false)).toBe(true);
    expect(isNotNullDefined(true)).toBe(true);
    expect(isNotNullDefined(0)).toBe(true);
    expect(isNotNullDefined(() => {})).toBe(true);
    expect(isNotNullDefined(NaN)).toBe(true);
    expect(isNotNullDefined(Infinity)).toBe(true);
    expect(isNotNullDefined(Symbol(''))).toBe(true);
  });

  it('should return false', () => {
    expect(isNotNullDefined(undefined)).toBe(false);
    expect(isNotNullDefined(null)).toBe(false);
  });
});
