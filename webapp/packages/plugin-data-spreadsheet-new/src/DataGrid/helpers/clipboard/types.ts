/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

export interface ICopiedCell {
  sourceKey: IGridDataKey;
  value: unknown;
}

export interface ICopiedRegion {
  rows: number;
  columns: number;
  cells: ICopiedCell[][];
}
