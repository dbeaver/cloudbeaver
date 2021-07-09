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
import { IDatabaseDataModel, IDatabaseResultSet, ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import type { ITableData } from './TableDataContext';

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function copyGridSelectedDataToClipboard(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  tableData: ITableData,
  selectedCells: Map<number, number[]>
) {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const editor = model.source.getEditor(resultIndex);

  const orderedSelectedCells: Map<number, number[]> = new Map([...selectedCells].sort((a, b) => a[0] - b[0]));

  const selectedColumns: Set<number> = new Set();
  for (const colIndexes of orderedSelectedCells.values()) {
    for (const colIdx of colIndexes) {
      selectedColumns.add(colIdx);
    }
  }

  const rowsValues: string[] = [];
  for (const [rowIdx, colIndexes] of orderedSelectedCells) {
    const rowCellsValues: string[] = [];
    for (const column of tableData.data.columns) {
      const columnIdx = tableData.getDataColumnIndexFromKey(column.key);
      if (columnIdx === null || !selectedColumns.has(columnIdx)) {
        continue;
      }

      if (colIndexes.includes(columnIdx)) {
        const cell = editor.getCell(rowIdx, columnIdx);
        const cellValue = format.getText(cell);
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
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  tableData: ITableData,
  selectionContext: IDataGridSelectionContext
) {
  const props = useObjectRef({ model, resultIndex, tableData, selectionContext });

  const onKeydownHandler = useCallback((event: IKeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === EVENT_KEY_CODE.C) {
      copyGridSelectedDataToClipboard(
        props.model,
        props.resultIndex,
        props.tableData,
        props.selectionContext.selectedCells
      );
    }
  }, []);

  return { onKeydownHandler };
}
