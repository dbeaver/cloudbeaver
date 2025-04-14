/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { toSafeHtmlString } from './toSafeHtmlString.js';

describe('toSafeHtmlString', () => {
  it('should make html string safe', () => {
    const input = '<script>alert("some unsafe action")</script>';
    const output = toSafeHtmlString(input);
    expect(output).toBe('&lt;script&gt;alert("some unsafe action")&lt;/script&gt;');
  });

  it('should return empty string', () => {
    const input = '';
    const output = toSafeHtmlString(input);
    expect(output).toBe('');
  });

  it('should return the same string', () => {
    const input = 'some safe string';
    const output = toSafeHtmlString(input);
    expect(output).toBe(input);
  });
});
