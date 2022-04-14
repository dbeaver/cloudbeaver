/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { copyToClipboard } from '@cloudbeaver/core-utils';
import { IResultSetColumnKey, IResultSetElementKey, ResultSetDataKeysUtils, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import type { ITableData } from './TableDataContext';

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function getCellCopyValue(tableData: ITableData, key: IResultSetElementKey): string {
  const cell = tableData.getCellValue(key);
  const cellValue = cell !== undefined ? tableData.format.getText(cell) : undefined;
  return cellValue ?? '';
}

function getSelectedCellsValue(
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
        rowCellsValues.push(getCellCopyValue(tableData, cellKey));
      } else {
        rowCellsValues.push('');
      }
    }
    rowsValues.push(rowCellsValues.join('\t'));
  }

  return rowsValues.join('\r\n');
}

export function useGridSelectedCellsCopy(
  tableData: ITableData,
  resultSetSelectAction: ResultSetSelectAction,
  selectionContext: IDataGridSelectionContext
) {
  const props = useObjectRef({ tableData, selectionContext, resultSetSelectAction });

  const onKeydownHandler = useCallback((event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.nativeEvent.code === EVENT_KEY_CODE.C) {
      EventContext.set(event, EventStopPropagationFlag);

      const focusedElement = props.resultSetSelectAction.getFocusedElement();
      let value: string | null = null;

      if (Array.from(props.selectionContext.selectedCells.keys()).length > 0) {
        value = getSelectedCellsValue(
          props.tableData,
          props.selectionContext.selectedCells
        );
      } else if (focusedElement) {
        value = getCellCopyValue(tableData, focusedElement);
      }

      if (value !== null) {
        copyToClipboard(value);
      }
    }
  }, []);

  return { onKeydownHandler };
}
