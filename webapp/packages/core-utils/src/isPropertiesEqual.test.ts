/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { isPropertiesEqual } from './isPropertiesEqual.js';

describe('isPropertiesEqual', () => {
  it('should return true if the two input objects have the same properties and property values, and false otherwise', () => {
    // Test the isPropertiesEqual function with different input objects
    expect(isPropertiesEqual({ foo: 'bar', baz: 'qux' }, { foo: 'bar', baz: 'qux' })).toBe(true);
    expect(isPropertiesEqual({ foo: 'bar', baz: 'qux' }, { foo: 'bar', baz: 'quux' })).toBe(false);
    expect(isPropertiesEqual({ foo: 'bar', baz: 'qux' }, { foo: 'bar', baz: 'qux', quux: 'corge' })).toBe(false);
    expect(isPropertiesEqual({ foo: 'bar' }, { foo: 'bar', baz: 'qux' })).toBe(false);
    expect(isPropertiesEqual(null, { foo: 'bar', baz: 'qux' })).toBe(false);
    expect(isPropertiesEqual({}, {})).toBe(true);
    expect(isPropertiesEqual(1, 1)).toBe(false);
  });
});
