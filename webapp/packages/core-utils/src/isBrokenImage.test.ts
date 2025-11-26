/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isImageBroken } from './isBrokenImage.js';

describe('isImageBroken', () => {
  const OriginalImage = globalThis.Image;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (OriginalImage) {
      globalThis.Image = OriginalImage;
    } else {
      delete (globalThis as Record<string, unknown>)['Image'];
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return false if image loads successfully', async () => {
    const srcSpy = vi.fn();

    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;

      set src(value: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisRef = this;
        srcSpy(value);
        setTimeout(() => {
          thisRef.onload?.();
        }, 0);
        vi.runAllTimers();
      }
    }

    vi.stubGlobal('Image', MockImage);

    await expect(isImageBroken('https://example.com/ok.png')).resolves.toBe(false);
    expect(srcSpy).toHaveBeenCalledWith('https://example.com/ok.png');
  });

  it('should return true if image loading fails', async () => {
    const srcSpy = vi.fn();

    class MockImage {
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;

      set src(value: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisRef = this;
        srcSpy(value);
        setTimeout(() => {
          thisRef.onerror?.();
        }, 0);
        vi.runAllTimers();
      }
    }

    vi.stubGlobal('Image', MockImage);

    await expect(isImageBroken('https://example.com/broken.png')).resolves.toBe(true);
    expect(srcSpy).toHaveBeenCalledWith('https://example.com/broken.png');
  });
});
