/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

//@ts-ignore
import { Canvg } from 'canvg';

import { blobToBase64, download, svgToDataUri, uriToBlob } from '@cloudbeaver/core-utils';

import type { ISaveImageOptions } from './ISaveImageOptions.js';
import { type IPreparedSVG, prepareSvg } from './prepareSvg.js';

const pixelRatio = 2;
const encoderType = 'image/png';
const quality = 0.8;

async function convertToPng(source: IPreparedSVG) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  canvas.width = source.width * pixelRatio;
  canvas.height = source.height * pixelRatio;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const svgXml = svgToDataUri(source.src);

  const canvg = await Canvg.from(context, svgXml, {
    scaleWidth: canvas.width,
    scaleHeight: canvas.height,
  });

  await canvg.render();

  const blob: Blob | null = await new Promise(resolve => {
    canvas.toBlob(
      result => {
        resolve(result);
      },
      encoderType,
      quality,
    );
  });

  if (!blob) {
    throw new Error('Something went wrong, please try select another file format');
  }

  const png = await blobToBase64(blob);

  if (!png) {
    throw new Error("Can't convert blob to data");
  }

  return png;
}

export async function saveSvgAsPng(el: SVGSVGElement, name: string, options: ISaveImageOptions): Promise<void> {
  const preparedSvg = await prepareSvg(el, options);
  const uri = await convertToPng(preparedSvg);
  const blob = uriToBlob(uri);

  download(blob, name);
}
