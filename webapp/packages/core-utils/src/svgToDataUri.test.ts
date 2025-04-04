/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';
import * as utf8ToBase64 from './utf8ToBase64.js';

import { svgToDataUri } from './svgToDataUri.js';

const doctype =
  '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';

describe('svgToDataUri', () => {
  it('should convert svg to data uri', () => {
    const utf8ToBase65Mock = vi.spyOn(utf8ToBase64, 'utf8ToBase64').mockImplementation((str: string) => str);
    const svg = 'some svg data';
    const dataUri = svgToDataUri(svg);

    expect(utf8ToBase65Mock).toHaveBeenCalledWith(doctype.concat(svg));
    expect(dataUri).toBe(`data:image/svg+xml;base64,${doctype.concat(svg)}`);
  });
});
