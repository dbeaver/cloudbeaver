/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { getLocalizedDisplayName } from './getLocalizedDisplayName.js';

describe('getLocalizedDisplayName', () => {
  test('should return capitalized language name for a valid locale', () => {
    const result = getLocalizedDisplayName('en');
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
    expect(result.length).toBeGreaterThan(0);
  });

  test('should return the locale string capitalized when display name resolves to the locale itself', () => {
    // 'zzz' has no known display name; Intl.DisplayNames returns it back,
    // and the function capitalizes the first character.
    const result = getLocalizedDisplayName('zzz');
    expect(result).toBe('Zzz');
  });

  test('should default to "language" type', () => {
    const withDefault = getLocalizedDisplayName('fr');
    const withExplicit = getLocalizedDisplayName('fr', 'language');
    expect(withDefault).toBe(withExplicit);
  });

  test('should support "region" type', () => {
    const result = getLocalizedDisplayName('US', 'region');
    expect(result.length).toBeGreaterThan(0);
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
  });

  test('should support "currency" type', () => {
    const result = getLocalizedDisplayName('USD', 'currency');
    expect(result.length).toBeGreaterThan(0);
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
  });

  test('should capitalize first character of the display name', () => {
    const result = getLocalizedDisplayName('de');
    const firstChar = result.charAt(0);
    expect(firstChar).toBe(firstChar.toLocaleUpperCase());
  });
});
