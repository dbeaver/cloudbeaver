/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';

import { svgToDataUri } from './svgToDataUri.js';

jest.mock('./utf8ToBase64', () => ({
  utf8ToBase64: jest.fn((str: string) => str),
}));

const doctype =
  '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';

describe.skip('svgToDataUri', () => {
  it('should convert svg to data uri', () => {
    const svg = 'some svg data';
    const dataUri = svgToDataUri(svg);
    expect(dataUri).toBe(`data:image/svg+xml;base64,${doctype.concat(svg)}`);
  });
});
