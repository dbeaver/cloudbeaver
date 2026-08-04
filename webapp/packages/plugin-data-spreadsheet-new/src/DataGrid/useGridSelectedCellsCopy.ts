/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
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
  DataViewerService,
  type IGridColumnKey,
  type IGridDataKey,
  GridDataKeysUtils,
  useDataViewerCopyHandler,
  GridSelectAction,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function getCellCopyValue(tableData: ITableData, key: IGridDataKey): string {
  return tableData.format.getText(tableData.format.get(key));
}

function getSelectedCellsValue(tableData: ITableData, selectedCells: Map<string, IGridDataKey[]>) {
  const orderedSelectedCells = new Map<string, IGridDataKey[]>(
    [...selectedCells].sort((a, b) => tableData.getRowIndexFromKey(a[1]![0]!.row) - tableData.getRowIndexFromKey(b[1]![0]!.row)),
  );

  const selectedColumns: IGridColumnKey[] = [];
  for (const rowSelection of orderedSelectedCells.values()) {
    for (const cell of rowSelection) {
      selectedColumns.push(cell.column);
    }
  }

  const rowsValues: string[] = [];
  for (const rowSelection of orderedSelectedCells.values()) {
    const rowCellsValues: string[] = [];
    for (const column of tableData.view.visualColumnKeys) {
      if (!selectedColumns.some(columnKey => GridDataKeysUtils.isEqual(columnKey, column))) {
        continue;
      }

      const cellKey = rowSelection.find(key => GridDataKeysUtils.isEqual(key.column, column));

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
  selectAction: GridSelectAction | undefined,
  selectionContext: IDataGridSelectionContext,
) {
  const dataViewerService = useService(DataViewerService);
  const props = useObjectRef({ tableData, selectionContext, selectAction });
  const copyEventHandler = useDataViewerCopyHandler();

  const onKeydownHandler = useCallback((event: React.KeyboardEvent) => {
    const isCopyShortcut =
      (event.ctrlKey || event.metaKey) && !event.altKey && (event.key.toLowerCase() === 'c' || event.nativeEvent.code === EVENT_KEY_CODE.C);

    if (isCopyShortcut) {
      const activeElement = document.activeElement as HTMLElement | null;
      const isEditing = activeElement?.matches('input, textarea, [contenteditable="true"]');

      if (isEditing) {
        return;
      }

      const hasTarget = activeElement?.closest('[role="gridcell"], [role="columnheader"]') !== null;

      if (!hasTarget && event.target !== event.currentTarget) {
        return;
      }

      EventContext.set(event, EventStopPropagationFlag);

      if (dataViewerService.canCopyData) {
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
