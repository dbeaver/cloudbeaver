/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag, NotificationService } from '@cloudbeaver/core-events';
import type { DataGridCellKeyboardEvent } from '@cloudbeaver/plugin-data-grid';
import { ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from './TableDataContext.js';

const EVENT_KEY_CODE = {
  V: 'KeyV',
};

export function useGridSelectedCellsPaste(
  tableData: ITableData,
  selectAction: ResultSetSelectAction | undefined,
): { onKeydownHandler: (event: DataGridCellKeyboardEvent) => void } {
  const notificationService = useService(NotificationService);

  const onKeydownHandler = useCallback(
    async (event: DataGridCellKeyboardEvent) => {
      const isPasteShortcut = (event.ctrlKey || event.metaKey) && event.nativeEvent.code === EVENT_KEY_CODE.V;
      const selectedCells = selectAction?.getActiveElements();

      if (!isPasteShortcut) {
        return;
      }

      EventContext.set(event, EventStopPropagationFlag);
      event.preventDefault();
      event?.preventGridDefault?.();

      if (!selectedCells?.length || !tableData.editor) {
        return;
      }

      try {
        const clipboardText = await navigator.clipboard.readText();
        const updates = selectedCells.map(key => ({ key, value: clipboardText }));

        if (updates.length > 0) {
          tableData.editor.setMany(updates);
        }
      } catch (error) {
        notificationService.logException(error as Error, 'ata_grid_table_paste_error');
      }
    },
    [notificationService, tableData.editor, selectAction],
  );

  return { onKeydownHandler };
}
