/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetGeometryValue } from './IResultSetGeometryValue.js';
import { isResultSetComplexValue } from './isResultSetComplexValue.js';

export function isResultSetGeometryValue(value: any): value is IResultSetGeometryValue {
  return isResultSetComplexValue(value) && value.$type === 'geometry';
}
