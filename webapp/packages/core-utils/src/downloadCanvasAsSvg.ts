/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { download } from './download.js';

export function downloadCanvasAsSvg(canvas: HTMLCanvasElement, fileName: string): void {
  const img = canvas.toDataURL('image/png');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
    <image href="${img}" width="${canvas.width}" height="${canvas.height}"/>
  </svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  download(blob, `${fileName}.svg`);
}
