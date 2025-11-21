/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import * as modernScreenshot from 'modern-screenshot';
import type { Options } from 'modern-screenshot';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { download } from './download.js';
import { isImageBroken } from './isBrokenImage.js';
import { BROKEN_IMAGE_ERROR_MESSAGE, downloadPng, downloadSvg } from './downloadImage.js';

vi.mock('modern-screenshot', function modernScreenshotMock() {
  return {
    domToForeignObjectSvg: vi.fn(),
    domToPng: vi.fn(),
  };
});

vi.mock('./download.js', function downloadMock() {
  return { download: vi.fn() };
});

vi.mock('./isBrokenImage.js', function isBrokenImageMock() {
  return { isImageBroken: vi.fn() };
});

const mockedDownload = vi.mocked(download);
const mockedIsImageBroken = vi.mocked(isImageBroken);
const mockedModernScreenshot = vi.mocked(modernScreenshot);

describe('downloadImage', function downloadImageDescribe() {
  const options = { backgroundColor: '#fff', width: 100, height: 100 } as Options;

  afterEach(function cleanupMocks() {
    mockedDownload.mockClear();
    mockedIsImageBroken.mockReset();
    mockedModernScreenshot.domToForeignObjectSvg.mockReset();
    mockedModernScreenshot.domToPng.mockReset();
  });

  it('should convert DOM to SVG blob and trigger download when image is valid', async function testDownloadSvgValid() {
    const element = document.createElement('div');
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://svg');
    mockedModernScreenshot.domToForeignObjectSvg.mockResolvedValue(svgElement as unknown as SVGSVGElement);
    mockedIsImageBroken.mockResolvedValue(false);

    try {
      await downloadSvg(element, options, 'diagram');

      expect(mockedModernScreenshot.domToForeignObjectSvg).toHaveBeenCalledWith(element, options);
      expect(mockedIsImageBroken).toHaveBeenCalledWith('blob://svg');
      expect(mockedDownload).toHaveBeenCalledTimes(1);
      const downloadCall = mockedDownload.mock.calls[0];
      expect(downloadCall).toBeDefined();
      const [blob, fileName] = downloadCall!;
      expect(blob).toBeInstanceOf(Blob);
      expect(fileName).toBe('diagram.svg');
    } finally {
      createObjectURLSpy.mockRestore();
    }
  });

  it('should throw error when generated SVG is broken', async function testDownloadSvgBroken() {
    const element = document.createElement('div');
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://svg');
    mockedModernScreenshot.domToForeignObjectSvg.mockResolvedValue(svgElement as unknown as SVGSVGElement);
    mockedIsImageBroken.mockResolvedValue(true);

    try {
      await expect(downloadSvg(element, options, 'diagram')).rejects.toThrow(BROKEN_IMAGE_ERROR_MESSAGE);
      expect(mockedIsImageBroken).toHaveBeenCalledWith('blob://svg');
      expect(mockedDownload).not.toHaveBeenCalled();
    } finally {
      createObjectURLSpy.mockRestore();
    }
  });
});

describe('downloadPng', function downloadPngDescribe() {
  const options = { backgroundColor: '#fff', width: 100, height: 100 } as Options;

  afterEach(function cleanupMocks() {
    mockedDownload.mockClear();
    mockedIsImageBroken.mockReset();
    mockedModernScreenshot.domToForeignObjectSvg.mockReset();
    mockedModernScreenshot.domToPng.mockReset();
  });

  it('should download PNG when image is valid', async function testDownloadPngValid() {
    const element = document.createElement('div');
    const pngData = 'data:image/png;base64,abc';
    mockedModernScreenshot.domToPng.mockResolvedValue(pngData);
    mockedIsImageBroken.mockResolvedValue(false);

    await downloadPng(element, options, 'diagram');

    expect(mockedModernScreenshot.domToPng).toHaveBeenCalledWith(element, options);
    expect(mockedIsImageBroken).toHaveBeenCalledWith(pngData);
    expect(mockedDownload).toHaveBeenCalledWith(pngData, 'diagram.png');
  });

  it('should throw error when generated PNG is broken', async function testDownloadPngBroken() {
    const element = document.createElement('div');
    const pngData = 'data:image/png;base64,abc';
    mockedModernScreenshot.domToPng.mockResolvedValue(pngData);
    mockedIsImageBroken.mockResolvedValue(true);

    await expect(downloadPng(element, options, 'diagram')).rejects.toThrow(BROKEN_IMAGE_ERROR_MESSAGE);
    expect(mockedDownload).not.toHaveBeenCalled();
  });
});
