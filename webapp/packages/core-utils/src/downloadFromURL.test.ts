/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadFromURL } from './downloadFromURL.js';

describe('downloadFromURL', () => {
  let mockXHR: {
    open: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    responseType: string;
    response: Blob;
    onload: () => void;
    onerror: (e: Error) => void;
  };

  beforeEach(() => {
    mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      responseType: '',
      response: new Blob(['test data']),
      onload: () => {},
      onerror: () => {},
    };

    (window as any).XMLHttpRequest = vi.fn().mockImplementation(() => mockXHR);
  });

  it('should download data successfully', async () => {
    const url = 'https://example.com/file';
    const promise = downloadFromURL(url);

    expect(mockXHR.open).toHaveBeenCalledWith('GET', url, true);
    expect(mockXHR.responseType).toBe('blob');
    expect(mockXHR.send).toHaveBeenCalled();

    mockXHR.onload();
    const result = await promise;

    expect(result).toBe(mockXHR.response);
  });

  it('should reject on error', async () => {
    const url = 'https://example.com/file';
    const error = new Error('Network error');
    const promise = downloadFromURL(url);

    mockXHR.onerror(error);
    await expect(promise).rejects.toThrow('Network error');
  });
});
