/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { isValidUrl } from './isValidUrl.js';

describe('Is valid url', () => {
  test('should return "true" when valid url with "http" protocol is passed', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  test('should return "true" when valid url with "https" protocol is passed', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  test('should return "false" when url without protocol is passed', () => {
    expect(isValidUrl('example.com')).toBe(false);
  });

  test('should return "false" when not valid url is passed', () => {
    expect(isValidUrl('example')).toBe(false);
  });
});
