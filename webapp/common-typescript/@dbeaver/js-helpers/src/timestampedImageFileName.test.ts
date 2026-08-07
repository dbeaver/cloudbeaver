/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { timestampedImageFileName } from './timestampedImageFileName.js';

describe('timestampedImageFileName', () => {
  test('should append the timestamp and the extension', () => {
    const name = timestampedImageFileName({ fileName: 'Chart', format: 'PNG', transparent: false });

    expect(name).toMatch(/^Chart \d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}\.png$/);
  });

  test('should lowercase the extension per format', () => {
    const name = timestampedImageFileName({ fileName: 'Plan', format: 'SVG', transparent: false });

    expect(name.endsWith('.svg')).toBe(true);
  });

  test('should trim the requested name', () => {
    const name = timestampedImageFileName({ fileName: '  Chart  ', format: 'PNG', transparent: false });

    expect(name.startsWith('Chart 20')).toBe(true);
  });

  test('should fall back when the requested name is blank', () => {
    const name = timestampedImageFileName({ fileName: '', format: 'PNG', transparent: false });

    expect(name.startsWith('image')).toBe(true);
  });
});
