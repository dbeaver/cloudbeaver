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
import type { DataGridCellKeyboardEvent } from '@cloudbeaver/plugin-data-grid';
import { ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';

const EVENT_KEY_CODE = {
  V: 'KeyV',
};

export function useGridSelectedCellsPaste(
  tableData: ITableData,
  selectAction: ResultSetSelectAction | undefined,
  selectionContext: IDataGridSelectionContext,
): { onKeydownHandler: (event: DataGridCellKeyboardEvent) => void } {
  const notificationService = useService(NotificationService);
  const props = useObjectRef({ tableData, selectionContext, selectAction });

  const onKeydownHandler = useCallback(
    async (event: DataGridCellKeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.nativeEvent.code === EVENT_KEY_CODE.V) {
        EventContext.set(event, EventStopPropagationFlag);
        event.preventDefault();
        event?.preventGridDefault?.();

        if (props.tableData.editor && props.selectAction instanceof ResultSetSelectAction) {
          const selectedCells = selectAction?.getSelectedElementsWithFocused();

          if (selectedCells) {
            if (!tableData.editor) {
              return;
            }

            try {
              const clipboardText = await navigator.clipboard.readText();

              if (!clipboardText) {
                return;
              }

              const updates = Array.from(selectedCells.values())
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
    [props, notificationService, tableData.editor, selectAction],
  );

  return { onKeydownHandler };
}
