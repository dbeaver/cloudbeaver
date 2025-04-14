/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { uriToBlob } from './uriToBlob.js';

describe('uriToBlob', () => {
  it('should convert a Data URI to a Blob object', () => {
    const uri = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
    const blob = uriToBlob(uri);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain');

    // assert that the Blob object contains the correct data
    const reader = new FileReader();
    reader.readAsText(blob, 'utf-8');
    reader.onload = () => {
      expect(reader.result).toBe('Hello, World!');
    };
  });
});
