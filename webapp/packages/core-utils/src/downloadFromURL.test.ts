/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, type Mock, vi, afterEach } from 'vitest';

import { downloadFromURL } from './downloadFromURL.js';

type MockXHR = {
  open: Mock;
  send: Mock;
  setRequestHeader: Mock;
  responseType: string;
  onload: Mock;
  onerror: Mock;
  response: Blob | null;
};

describe('downloadFromURL', () => {
  let mockXHR: MockXHR;

  beforeEach(() => {
    vi.useFakeTimers();
    mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      responseType: '',
      onload: vi.fn(),
      onerror: vi.fn(),
      response: null,
    };

    (globalThis as any).XMLHttpRequest = vi.fn(() => mockXHR);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should open and send request to the specified URL', () => {
    const url = 'http://example.com/test';
    downloadFromURL(url);

    expect(mockXHR.open).toHaveBeenCalledWith('GET', url, true);
    expect(mockXHR.send).toHaveBeenCalled();
  });

  it('should resolve with a Blob when the request is successful', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    mockXHR.response = mockBlob;

    setTimeout(() => {
      mockXHR.onload?.();
    }, 0);

    const url = 'http://example.com/test';
    const resultPromise = downloadFromURL(url);
    vi.advanceTimersByTime(1);
    const result = await resultPromise;

    expect(mockXHR.responseType).toBe('blob');
    expect(result).toBe(mockBlob);
  });

  it('should reject with an error when the request fails', async () => {
    const mockError = new Error('Network error');

    setTimeout(() => {
      mockXHR.onerror?.(mockError);
    }, 0);

    const url = 'http://example.com/test';
    const promise = downloadFromURL(url);

    vi.advanceTimersByTime(1);

    await expect(promise).rejects.toThrow('Network error');
    expect(mockXHR.responseType).toBe('blob');
  });
});
