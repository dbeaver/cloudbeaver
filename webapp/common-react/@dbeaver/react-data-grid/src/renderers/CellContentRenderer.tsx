/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { use } from 'react';
import { DataGridCellContext } from '../DataGridCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';

export interface Props {
  rowIdx: number;
  colIdx: number;
}

export function CellContentRenderer({ rowIdx, colIdx }: Props) {
  const cellContext = use(DataGridCellContext);
  return useGridReactiveValue(cellContext?.cell, rowIdx, colIdx);
}
