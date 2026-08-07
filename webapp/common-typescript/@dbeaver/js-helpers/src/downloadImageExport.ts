/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { download } from './download.js';
import type { IImageExportResult } from './IImageExportOptions.js';

export function downloadImageExport(result: IImageExportResult): void {
  download(result.blob, result.fileName);
}
