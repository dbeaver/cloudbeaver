/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { beforeEach, describe, expect, it, vitest } from 'vitest';

import { download } from './download.js';

describe('download', () => {
  beforeEach(() => {
    // Clean up any existing links from previous tests
    document.body.innerHTML = '';
  });

  it('should not create links after download', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const linksBefore = document.querySelectorAll('a');
    expect(linksBefore.length).toBe(0);

    download(blob, 'test.txt');

    const linksAfter = document.querySelectorAll('a');
    expect(linksAfter.length).toBe(0);
  });

  it('should create a link with url and click it to download file', () => {
    const element = document.createElement('a');
    const createElementSpy = vitest.spyOn(document, 'createElement').mockImplementation(() => element);
    const clickSpy = vitest.spyOn(element, 'click');
    const createObjectURLSpy = vitest.spyOn(URL, 'createObjectURL');
    const blob = new Blob(['test'], { type: 'text/plain' });

    download(blob, 'test.txt');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(createElementSpy).toHaveBeenCalledTimes(1);

    expect(clickSpy).toHaveBeenCalledWith();
    expect(clickSpy).toHaveBeenCalledTimes(1);

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
    clickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });
});
