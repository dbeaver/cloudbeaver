/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { svgToBlob } from './svgToBlob.js';

describe('svgToBlob', () => {
  it('wraps an SVG string in a Blob with the correct MIME type and XML declaration', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    const blob = svgToBlob(svg);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/svg+xml;charset=utf-8');

    const text = await blob.text();
    expect(text).toBe(`<?xml version="1.0" standalone="no"?>\r\n${svg}`);
  });
});
