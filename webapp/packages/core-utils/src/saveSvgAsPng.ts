/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { domToImage, download, transformClassesToStyles } from '@cloudbeaver/core-utils';

import type { ISaveImageOptions } from './ISaveImageOptions.js';
import { prepareSvg } from './prepareSvg.js';

export async function saveSvgAsPng(el: SVGSVGElement, name: string, options: ISaveImageOptions): Promise<void> {
  transformClassesToStyles(el);
  await prepareSvg(el, options);
  domToImage.toPng(el, options).then(dataUrl => download(dataUrl, `${name}.png`));
}
