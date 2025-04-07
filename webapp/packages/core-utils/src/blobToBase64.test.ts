/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { blobToBase64 } from './blobToBase64.js';

function getMockFileReader(getResult: () => string) {
  return class MockFileReader extends FileReader {
    constructor() {
      super();
      Object.defineProperty(this, 'result', {
        get: getResult,
      });
    }

    override readAsDataURL() {
      this.onload?.({} as ProgressEvent<FileReader>);
    }
  };
}

describe('blobToBase64', () => {
  let originalFileReader: typeof FileReader;

  beforeEach(() => {
    originalFileReader = globalThis.FileReader;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
    vi.useRealTimers();
  });

  it('should convert blob to base64', async () => {
    const result = 'data:text/plain;base64,dGVzdA==';
    const blob = new Blob(['test'], { type: 'text/plain' });
    const MockFileReader = getMockFileReader(() => result);

    Object.defineProperty(globalThis, 'FileReader', {
      writable: true,
      value: MockFileReader,
    });

    const base64 = await blobToBase64(blob);
    expect(base64).toBe(result);
  });

  it('should convert blob to base64 with slice', async () => {
    const result = 'data:application/octet-stream;base64,dGhpcyBpcyBhIHRlc3Qgd2l0aCA=';
    const blob = new Blob(['this is a test with longer text']);
    const MockFileReader = getMockFileReader(() => result);
    Object.defineProperty(globalThis, 'FileReader', {
      writable: true,
      value: MockFileReader,
    });

    const base64 = await blobToBase64(blob, 20);
    expect(base64).toBe(result);
  });

  it('should handle read error', async () => {
    const error = new Error('Read error');
    const blob = new Blob(['test']);
    const MockFileReader = getMockFileReader(() => {
      throw error;
    });

    Object.defineProperty(globalThis, 'FileReader', {
      writable: true,
      value: MockFileReader,
    });

    await expect(blobToBase64(blob)).rejects.toThrow('Read error');
  });
});
