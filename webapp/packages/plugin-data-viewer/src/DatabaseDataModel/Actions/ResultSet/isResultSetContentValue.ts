/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetContentValue } from './IResultSetContentValue.js';
import { isResultSetComplexValue } from './isResultSetComplexValue.js';

export function isResultSetContentValue(value: any): value is IResultSetContentValue {
  return isResultSetComplexValue(value) && value.$type === 'content';
}
