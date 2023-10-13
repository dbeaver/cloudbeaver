/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetFileValue } from './IResultSetFileValue';
import { isResultSetComplexValue } from './isResultSetComplexValue';

export function isResultSetFileValue(value: any): value is IResultSetFileValue {
  return isResultSetComplexValue(value) && value.$type === 'content' && 'fileId' in value && ['string', 'undefined'].includes(typeof value.fileId);
}
