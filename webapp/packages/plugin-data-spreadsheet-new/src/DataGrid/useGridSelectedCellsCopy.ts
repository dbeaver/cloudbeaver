/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { copyToClipboard } from '@cloudbeaver/core-utils';
import { IResultSetColumnKey, IResultSetElementKey, ResultSetDataKeysUtils } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import type { ITableData } from './TableDataContext';

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function copyGridSelectedDataToClipboard(
  tableData: ITableData,
  selectedCells: Map<string, IResultSetElementKey[]>
) {
  const orderedSelectedCells = new Map<string, IResultSetElementKey[]>(
    [...selectedCells]
      .sort((a, b) => tableData.getRowIndexFromKey(a[1][0].row) - tableData.getRowIndexFromKey(b[1][0].row))
  );

  const selectedColumns: IResultSetColumnKey[] = [];
  for (const rowSelection of orderedSelectedCells.values()) {
    for (const cell of rowSelection) {
      selectedColumns.push(cell.column);
    }
  }

  const rowsValues: string[] = [];
  for (const rowSelection of orderedSelectedCells.values()) {
    const rowCellsValues: string[] = [];
    for (const column of tableData.view.columnKeys) {
      if (
        !selectedColumns.some(columnKey => ResultSetDataKeysUtils.isEqual(columnKey, column))
      ) {
        continue;
      }

      const cellKey = rowSelection.find(key => ResultSetDataKeysUtils.isEqual(key.column, column));

      if (cellKey) {
        const cell = tableData.getCellValue(cellKey);
        const cellValue = cell !== undefined ? tableData.format.getText(cell) : undefined;
        rowCellsValues.push(cellValue ?? '');
      } else {
        rowCellsValues.push('');
      }
    }
    rowsValues.push(rowCellsValues.join('\t'));
  }

  copyToClipboard(rowsValues.join('\r\n'));
}

// needed for event.code
type IKeyboardEvent = React.KeyboardEvent<HTMLDivElement> & KeyboardEvent;

export function useGridSelectedCellsCopy(
  tableData: ITableData,
  selectionContext: IDataGridSelectionContext
) {
  const props = useObjectRef({ tableData, selectionContext });

  const onKeydownHandler = useCallback((event: IKeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === EVENT_KEY_CODE.C) {
      copyGridSelectedDataToClipboard(
        props.tableData,
        props.selectionContext.selectedCells
      );
    }
  }, []);

  return { onKeydownHandler };
}
