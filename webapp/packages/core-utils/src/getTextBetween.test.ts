/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { getTextBetween } from './getTextBetween.js';

describe('Get text between', () => {
  test('should return text between when arguments are valid', () => {
    expect(getTextBetween('<title>some text inside title</title>', '<title>', '</title>')).toBe('some text inside title');
  });

  test('should return target text when arguments are not presented in the target text', () => {
    expect(getTextBetween('<title>some text inside title<title>', '<title>', '</title>')).toBe('<title>some text inside title<title>');
  });
});
