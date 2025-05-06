/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetBinaryValue } from './IResultSetBinaryValue.js';
import { isResultSetContentValue } from './isResultSetContentValue.js';

export function isResultSetBinaryValue(value: unknown): value is IResultSetBinaryValue {
  return isResultSetContentValue(value) && 'binary' in value;
}
