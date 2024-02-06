/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetBinaryFileValue } from './IResultSetBinaryFileValue';
import { isResultSetContentValue } from './isResultSetContentValue';

export function isResultSetBinaryFileValue(value: any): value is IResultSetBinaryFileValue {
  return isResultSetContentValue(value) && value?.contentType === 'application/octet-stream' && 'binary' in value;
}
