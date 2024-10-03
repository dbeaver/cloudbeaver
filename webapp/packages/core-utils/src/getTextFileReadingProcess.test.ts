/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getTextFileReadingProcess } from './getTextFileReadingProcess.js';

describe('getTextFileReadingProcess', () => {
  let file: File;
  let mockFileReader: Partial<FileReader>;

  beforeEach(() => {
    file = new File(['file content'], 'test.txt', { type: 'text/plain' });

    mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      onabort: null,
    };

    jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as FileReader);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return correct instances', () => {
    const { promise, reader } = getTextFileReadingProcess(file);

    expect(promise).toBeInstanceOf(Promise);
    expect(reader).toBe(mockFileReader);
  });

  it('should resolve with file content on successful read', async () => {
    const { promise } = getTextFileReadingProcess(file);

    (mockFileReader.onload as any)({
      target: { result: 'file content' },
    });

    await expect(promise).resolves.toBe('file content');
    expect(mockFileReader.readAsText).toHaveBeenCalledWith(file);
  });

  it('should reject with an error if file has no data', async () => {
    const { promise } = getTextFileReadingProcess(file);

    const results = [null, undefined, ''];

    for (const result of results) {
      (mockFileReader.onload as any)({
        target: { result: result },
      });

      await expect(promise).rejects.toThrow(`No data for the file: "${file.name}"`);
    }
  });

  it('should reject with an error if reading fails', async () => {
    const { promise } = getTextFileReadingProcess(file);
    const error = new Error('Read error');

    (mockFileReader.onerror as any)({
      target: { error: error },
    });

    await expect(promise).rejects.toThrow(`Error occurred reading file: "${file.name}"`);
  });

  it('should reject if the read is aborted', async () => {
    const { promise } = getTextFileReadingProcess(file);

    (mockFileReader.onabort as any)();

    await expect(promise).rejects.toThrow(`Reading "${file.name}" is aborted`);
  });
});
