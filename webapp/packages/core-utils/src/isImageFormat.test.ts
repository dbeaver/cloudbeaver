/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { isImageFormat } from './isImageFormat.js';

describe('Is image format', () => {
  test('should return "true" when link with ".jpeg" extension is passed', () => {
    expect(isImageFormat('https://300.jpeg')).toBe(true);
  });

  test('should return "true" when link with ".jpg" extension is passed', () => {
    expect(isImageFormat('https://300.jpg')).toBe(true);
  });

  test('should return "true" when link with ".gif" extension is passed', () => {
    expect(isImageFormat('https://300.gif')).toBe(true);
  });

  test('should return "true" when link with ".png" extension is passed', () => {
    expect(isImageFormat('https://300.png')).toBe(true);
  });

  test('should return "true" when link with ".svg" extension is passed', () => {
    expect(isImageFormat('https://300.svg')).toBe(true);
  });

  test('should return "true" when link with ".ico" extension is passed', () => {
    expect(isImageFormat('https://300.ico')).toBe(true);
  });

  test('should return "true" when link with ".bmp" extension is passed', () => {
    expect(isImageFormat('https://300.bmp')).toBe(true);
  });

  test('should return "false" when link with ".html" extension is passed', () => {
    expect(isImageFormat('https://300.html')).toBe(false);
  });
});
