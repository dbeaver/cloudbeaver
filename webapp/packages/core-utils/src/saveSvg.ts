/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { download, svgToDataUri, transformClassesToStyles, uriToBlob } from '@cloudbeaver/core-utils';

import type { ISaveImageOptions } from './ISaveImageOptions.js';
import { prepareSvg } from './prepareSvg.js';

export async function saveSvg(el: SVGSVGElement, name: string, options: ISaveImageOptions): Promise<void> {
  transformClassesToStyles(el);
  const preparedSvg = await prepareSvg(el, options);
  const uri = svgToDataUri(preparedSvg.src);
  const blob = uriToBlob(uri);

  download(blob, name);
}
