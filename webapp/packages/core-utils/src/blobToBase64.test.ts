/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { blobToBase64 } from './blobToBase64.js';
import { mockFileReader } from './__mocks__/mockFileReader.js';

describe('blobToBase64', () => {
  it('converts blob to base64', async () => {
    const result = 'data:text/plain;base64,dGVzdA==';
    const blob = new Blob(['test'], { type: 'text/plain' });

    mockFileReader(() => result);

    const base64 = await blobToBase64(blob);

    expect(base64).toBe(result);
  });

  it('converts empty string', async () => {
    const result = 'data:text/plain;base64,';
    const blob = new Blob(['']);

    mockFileReader(() => result);

    const base64 = await blobToBase64(blob);

    expect(base64).toBe(result);
  });

  it('converts blob to base64 with slice', async () => {
    const result = 'data:application/octet-stream;base64,dGhpcyBpcyBhIHRlc3Qgd2l0aCA=';
    const blob = new Blob(['this is a test with longer text']);

    mockFileReader(() => result);

    const base64 = await blobToBase64(blob, 20);

    expect(base64).toBe(result);
  });
});
