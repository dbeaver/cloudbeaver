/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeAll, describe, expect, it, vitest } from 'vitest';

import { copyToClipboard } from './copyToClipboard.js';

describe('copyToClipboard', () => {
  beforeAll(() => {
    document.execCommand = vitest.fn() as any;
  });

  it('should copy data to clipboard', () => {
    copyToClipboard('test');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('should focus on active element after copy', () => {
    document.body.focus = vitest.fn();

    copyToClipboard('test');

    expect(document.activeElement).toBe(document.body);
    expect(document.body.focus).toHaveBeenCalled();
  });

  it('should have no children after copy', () => {
    copyToClipboard('test');

    expect(document.body.children.length).toBe(0);
  });
});
