/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import * as modernScreenshot from 'modern-screenshot';
import type { Options } from 'modern-screenshot';
import { download } from './download.js';
import { isImageBroken } from './isBrokenImage.js';
import { svgToBlob } from './svgToBlob.js';

export type { Options as IScreenshotOptions };

const BROKEN_IMAGE_ERROR_MESSAGE = 'Something went wrong. Please try to select another file format';

export async function downloadSvg<T extends Node>(element: T, options: Options, fileName: string): Promise<void> {
  const svg = await modernScreenshot.domToForeignObjectSvg<T>(element, options);
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = svgToBlob(svgData);
  const uri = URL.createObjectURL(blob);
  const isBrokenImage = await isImageBroken(uri);

  if (isBrokenImage) {
    throw new Error(BROKEN_IMAGE_ERROR_MESSAGE);
  }

  download(blob, `${fileName}.svg`);
}

export async function downloadPng<T extends Node>(element: T, options: Options, fileName: string): Promise<void> {
  const png = await modernScreenshot.domToPng(element, options);
  const isBrokenImage = await isImageBroken(png);

  if (isBrokenImage) {
    throw new Error(BROKEN_IMAGE_ERROR_MESSAGE);
  }

  download(png, `${fileName}.png`);
}
