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
import { EventContext, EventStopPropagationFlag, NotificationService } from '@cloudbeaver/core-events';
import { copyToClipboard } from '@cloudbeaver/core-utils';
import type { DataGridCellKeyboardEvent } from '@cloudbeaver/plugin-data-grid';
import {
  DatabaseSelectAction,
  DataViewerService,
  type IGridColumnKey,
  type IGridDataKey,
  GridDataKeysUtils,
  ResultSetSelectAction,
  useDataViewerCopyHandler,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';

const EVENT_KEY_CODE = {
  C: 'KeyC',
  V: 'KeyV',
};

function isEventFromGrid(event: DataGridCellKeyboardEvent): boolean {
  const activeElement = document.activeElement as HTMLElement | null;
  return (
    activeElement?.getAttribute('role') === 'gridcell' ||
    activeElement?.getAttribute('role') === 'columnheader' ||
    event.target === event.currentTarget
  );
}

function getSelectedCells(selectionContext: IDataGridSelectionContext, selectAction?: ResultSetSelectAction): Map<string, IGridDataKey[]> | null {
  const hasSelection = Array.from(selectionContext.selectedCells.keys()).length > 0;

  if (hasSelection) {
    return selectionContext.selectedCells;
  }

  const focusedElement = selectAction?.getFocusedElement() as IGridDataKey | undefined;
  if (focusedElement) {
    return new Map<string, IGridDataKey[]>([[GridDataKeysUtils.serialize(focusedElement.row), [focusedElement]]]);
  }

  return null;
}

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
    for (const column of tableData.view.columnKeys) {
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
  selectAction: DatabaseSelectAction | undefined,
  selectionContext: IDataGridSelectionContext,
): { onKeydownHandler: (event: DataGridCellKeyboardEvent) => void } {
  const dataViewerService = useService(DataViewerService);
  const notificationService = useService(NotificationService);
  const props = useObjectRef({ tableData, selectionContext, selectAction });
  const copyEventHandler = useDataViewerCopyHandler();

  const onKeydownHandler = useCallback(
    async (event: DataGridCellKeyboardEvent) => {
      if (!isEventFromGrid(event)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.nativeEvent.code === EVENT_KEY_CODE.C) {
        EventContext.set(event, EventStopPropagationFlag);

        if (dataViewerService.canCopyData) {
          if (!(props.selectAction instanceof ResultSetSelectAction)) {
            throw new Error('Copying data is not supported');
          }

          const cells = getSelectedCells(props.selectionContext, props.selectAction);

          if (cells) {
            const firstRow = Array.from(cells.values())[0];
            const isMultipleSelection = cells.size > 1 || (firstRow?.length ?? 0) > 1;
            const value = isMultipleSelection ? getSelectedCellsValue(props.tableData, cells) : getCellCopyValue(props.tableData, firstRow![0]!);

            copyToClipboard(value);
          }
        }

        copyEventHandler(event);
      }

      if ((event.ctrlKey || event.metaKey) && event.nativeEvent.code === EVENT_KEY_CODE.V) {
        EventContext.set(event, EventStopPropagationFlag);
        event.preventDefault();
        event.preventGridDefault();

        if (props.tableData.editor && props.selectAction instanceof ResultSetSelectAction) {
          const cells = getSelectedCells(props.selectionContext, props.selectAction);
          if (cells) {
            if (!tableData.editor) {
              return;
            }

            try {
              const clipboardText = await navigator.clipboard.readText();

              if (!clipboardText) {
                return;
              }

              const updates = Array.from(cells.values())
                .flat()
                .map(key => ({ key, value: clipboardText }));

              if (updates.length > 0) {
                tableData.editor.setMany(updates);
              }
            } catch (error) {
              notificationService.logException(error as Error, 'data_grid_paste_error');
            }
          }
        }
      }
    },
    [props, dataViewerService.canCopyData, copyEventHandler, notificationService, tableData.editor],
  );

  return { onKeydownHandler };
}
