/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { downloadFromURL } from './downloadFromURL.js';

type MockXHR = {
  open: jest.Mock;
  send: jest.Mock;
  setRequestHeader: jest.Mock;
  responseType: string;
  onload: jest.Mock;
  onerror: jest.Mock;
  response: Blob | null;
};

describe('downloadFromURL', () => {
  let mockXHR: MockXHR;

  beforeEach(() => {
    mockXHR = {
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn(),
      responseType: '',
      onload: jest.fn(),
      onerror: jest.fn(),
      response: null,
    };

    (global as any).XMLHttpRequest = jest.fn(() => mockXHR);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should open and send request to the specified URL', async () => {
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
    const result = await downloadFromURL(url);

    expect(mockXHR.responseType).toBe('blob');
    expect(result).toBe(mockBlob);
  });

  it('should reject with an error when the request fails', async () => {
    const mockError = new Error('Network error');

    setTimeout(() => {
      mockXHR.onerror?.(mockError);
    }, 0);

    const url = 'http://example.com/test';

    await expect(downloadFromURL(url)).rejects.toThrow('Network error');
    expect(mockXHR.responseType).toBe('blob');
  });
});
