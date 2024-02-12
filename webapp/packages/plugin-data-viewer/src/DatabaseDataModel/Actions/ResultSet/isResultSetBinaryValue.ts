/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetBinaryValue } from './IResultSetBinaryValue';
import { isResultSetContentValue } from './isResultSetContentValue';

export function isResultSetBinaryValue(value: any): value is IResultSetBinaryValue {
  return isResultSetContentValue(value) && 'binary' in value;
}
