/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';

import { blobToBase64 } from './blobToBase64.js';

describe('blobToBase64', () => {
  it('converts blob to base64', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const base64 = await blobToBase64(blob);

    expect(base64).toBe('data:text/plain;base64,dGVzdA==');
  });

  it('converts blob to base64 with slice', async () => {
    const blob = new Blob(['this is a test with longer text']);
    const base64 = await blobToBase64(blob, 20);

    expect(base64).toBe('data:application/octet-stream;base64,dGhpcyBpcyBhIHRlc3Qgd2l0aCA=');
  });

  it('calls readAsDataURL', async () => {
    const readAsDataURL = jest.fn(blob => Promise.resolve(blob));
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        readAsDataURL,
      })),
    });
    jest.useFakeTimers();

    const blob = new Blob(['test'], { type: 'text/plain' });

    blobToBase64(blob);

    expect(readAsDataURL).toHaveBeenCalledWith(blob);
    jest.useRealTimers();
  });
});
