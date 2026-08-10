/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { blobToDataUrl } from './blobToDataUrl.js';
import type { ImageExportDataUrlReadyHandler, ImageExportReadyHandler } from './IImageExportOptions.js';

export function toDataUrlImageExport(handler: ImageExportDataUrlReadyHandler): ImageExportReadyHandler {
  return async result => {
    handler({ fileName: result.fileName, format: result.format, dataUrl: await blobToDataUrl(result.blob) });
  };
}
