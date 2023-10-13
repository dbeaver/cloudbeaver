/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetFileValue } from './IResultSetFileValue';

export function createResultSetFileValue(fileId?: string, contentType?: string, contentLength?: number): IResultSetFileValue {
  return {
    $type: 'content',
    fileId,
    contentType,
    contentLength,
  };
}
