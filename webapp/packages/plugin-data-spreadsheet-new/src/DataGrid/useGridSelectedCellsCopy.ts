/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { copyToClipboard } from '@cloudbeaver/core-utils';
import {
  DatabaseSelectAction,
  DataViewerService,
  type IResultSetColumnKey,
  type IResultSetElementKey,
  ResultSetDataKeysUtils,
  ResultSetSelectAction,
  useDataViewerCopyHandler,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function getCellCopyValue(tableData: ITableData, key: IResultSetElementKey): string {
  return tableData.format.getText(key);
}

function getSelectedCellsValue(tableData: ITableData, selectedCells: Map<string, IResultSetElementKey[]>) {
  const orderedSelectedCells = new Map<string, IResultSetElementKey[]>(
    [...selectedCells].sort((a, b) => tableData.getRowIndexFromKey(a[1]![0]!.row) - tableData.getRowIndexFromKey(b[1]![0]!.row)),
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
      if (!selectedColumns.some(columnKey => ResultSetDataKeysUtils.isEqual(columnKey, column))) {
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
  selectAction: DatabaseSelectAction | undefined,
  selectionContext: IDataGridSelectionContext,
) {
  const dataViewerService = useService(DataViewerService);
  const props = useObjectRef({ tableData, selectionContext, selectAction });
  const copyEventHandler = useDataViewerCopyHandler();

  const onKeydownHandler = useCallback((event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.nativeEvent.code === EVENT_KEY_CODE.C) {
      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement?.getAttribute('role') !== 'gridcell' &&
        activeElement?.getAttribute('role') !== 'columnheader' &&
        event.target !== event.currentTarget
      ) {
        return;
      }
      EventContext.set(event, EventStopPropagationFlag);

      if (dataViewerService.canCopyData) {
        if (!(props.selectAction instanceof ResultSetSelectAction)) {
          throw new Error('Copying data is not supported');
        }

        const focusedElement = props.selectAction?.getFocusedElement();
        let value: string | null = null;

        if (Array.from(props.selectionContext.selectedCells.keys()).length > 0) {
          value = getSelectedCellsValue(props.tableData, props.selectionContext.selectedCells);
        } else if (focusedElement) {
          value = getCellCopyValue(tableData, focusedElement);
        }

        if (value !== null) {
          copyToClipboard(value);
        }
      }

      copyEventHandler(event);
    }
  }, []);

  return { onKeydownHandler };
}
