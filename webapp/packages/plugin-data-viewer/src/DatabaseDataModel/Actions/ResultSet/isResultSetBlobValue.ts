/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetBlobValue } from './IResultSetBlobValue.js';
import { isResultSetFileValue } from './isResultSetFileValue.js';

export function isResultSetBlobValue(value: any): value is IResultSetBlobValue {
  return isResultSetFileValue(value) && 'blob' in value && value.blob instanceof Blob;
}
