/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { isPrimitive } from './isPrimitive.js';

describe('isPrimitive', () => {
  it('should return true', () => {
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(1)).toBe(true);
    expect(isPrimitive('')).toBe(true);
    expect(isPrimitive(false)).toBe(true);
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(0)).toBe(true);
    expect(isPrimitive(NaN)).toBe(true);
    expect(isPrimitive(Infinity)).toBe(true);
    expect(isPrimitive(Symbol(''))).toBe(true);
  });

  it('should return false', () => {
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive(() => {})).toBe(false);
    expect(isPrimitive(new Map())).toBe(false);
    expect(isPrimitive(new Set())).toBe(false);
    expect(isPrimitive(new Date())).toBe(false);
    expect(isPrimitive(new Error())).toBe(false);
  });
});
