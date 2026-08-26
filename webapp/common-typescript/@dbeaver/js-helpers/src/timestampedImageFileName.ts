/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IImageExportOptions } from './IImageExportOptions.js';
import { withTimestamp } from './withTimestamp.js';

const FALLBACK_FILE_NAME = 'image';

/** `{ fileName: 'Chart', format: 'PNG' }` → `'Chart 2026-07-27 10-30-00.png'` */
export function timestampedImageFileName(options: IImageExportOptions): string {
  return `${withTimestamp(options.fileName.trim() || FALLBACK_FILE_NAME)}.${options.format.toLowerCase()}`;
}
