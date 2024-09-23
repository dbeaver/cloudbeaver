/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createResultSetFileValue } from './createResultSetFileValue.js';
import type { IResultSetBlobValue } from './IResultSetBlobValue.js';

export function createResultSetBlobValue(blob: Blob, fileId?: string): IResultSetBlobValue {
  return {
    ...createResultSetFileValue(fileId ?? null, blob.type, blob.size),
    blob,
  };
}
