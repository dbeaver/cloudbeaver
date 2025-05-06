/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResultSetComplexValue } from '@dbeaver/result-set-api';
import type { IResultSetFileValue } from './IResultSetFileValue.js';

export function isResultSetFileValue(value: any): value is IResultSetFileValue {
  return isResultSetComplexValue(value) && value.$type === 'file';
}
