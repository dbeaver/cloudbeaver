/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { use, useMemo } from 'react';
import { HeaderDnDContext } from '../useHeaderDnD.js';
import { DataGridCellContext, type IDataGridCellRenderer, type IDataGridCellProps } from '../DataGridCellContext.js';
import { useGridReactiveValue } from '../useGridReactiveValue.js';
import type { CalculatedColumn } from 'react-data-grid';
import type { IInnerRow } from '../IInnerRow.js';
import { CellContentRenderer } from './CellContentRenderer.js';

export interface Props {
  rowIdx: number;
  column: CalculatedColumn<IInnerRow, unknown>;
}

export function SummaryCellRenderer({ rowIdx, column }: Props): React.ReactNode {
  const cellContext = use(DataGridCellContext);
  const dndContext = use(HeaderDnDContext)!;
  const dataColIdx = dndContext.getDataColIdxByKey(column.key);

  const mappedProps = useMemo<IDataGridCellProps>(
    () => ({
      isFocused: false,
    }),
    [],
  );

  const renderDefaultCell = useMemo<IDataGridCellRenderer>(
    () => () => <CellContentRenderer rowIdx={rowIdx} colIdx={dataColIdx} />,
    [rowIdx, dataColIdx],
  );

  return useGridReactiveValue(cellContext?.cellElement, rowIdx, dataColIdx, mappedProps, renderDefaultCell);
}
