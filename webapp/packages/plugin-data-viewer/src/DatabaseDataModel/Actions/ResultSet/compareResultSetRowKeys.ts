/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetRowKey } from './IResultSetDataKey.js';

export function compareResultSetRowKeys(a: IResultSetRowKey, b: IResultSetRowKey): number {
  // subIndex is used to sort rows with the same index
  return a.index + a.subIndex / 10 - b.index - b.subIndex / 10;
}
