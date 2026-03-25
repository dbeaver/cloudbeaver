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
import { DatabaseSelectAction, DataViewerService, ResultSetSelectAction, useDataViewerCopyHandler } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext.js';
import { gridCellsClipboardHelper } from './gridCellsClipboardHelper.js';
import type { ITableData } from './TableDataContext.js';
import { type DataGridCellKeyboardEvent } from '@cloudbeaver/plugin-data-grid';

interface IUseGridSelectedCellsClipboardResult {
  onKeydownHandler: (event: DataGridCellKeyboardEvent) => void;
}

const EVENT_KEY_CODE = {
  C: 'KeyC',
  V: 'KeyV',
};

export function useGridSelectedCellsClipboard(
  tableData: ITableData,
  selectAction: DatabaseSelectAction | undefined,
  selectionContext: IDataGridSelectionContext,
): IUseGridSelectedCellsClipboardResult {
  const dataViewerService = useService(DataViewerService);
  const props = useObjectRef({ tableData, selectionContext, selectAction });
  const copyEventHandler = useDataViewerCopyHandler();
  const canCopyData = dataViewerService.canCopyData;

  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText) {
        return;
      }

      const selected = gridCellsClipboardHelper.getPastedCells(clipboardText, props.selectionContext, props.selectAction, props.tableData);

      if (selected.length > 0) {
        props.tableData.editor?.setMany(selected);
      }
    } catch (error) {
      console.warn('Paste failed:', error);
    }
  }, [props]);

  const handleCopy = useCallback(
    (event: DataGridCellKeyboardEvent) => {
      if (canCopyData) {
        if (!(props.selectAction instanceof ResultSetSelectAction)) {
          throw new Error('Copying data is not supported');
        }

        const focusedElement = props.selectAction.getFocusedElement();
        const value = gridCellsClipboardHelper.getSelectedCellsValue(props.tableData, props.selectionContext.selectedCells, focusedElement);

        if (value !== null) {
          copyToClipboard(value);
        }
        copyEventHandler(event);
      }
    },
    [canCopyData, props, copyEventHandler],
  );

  const onKeydownHandler = useCallback(
    async (event: DataGridCellKeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !gridCellsClipboardHelper.isGridClipboardTarget(event)) {
        return;
      }

      switch (event.nativeEvent.code) {
        case EVENT_KEY_CODE.C: {
          EventContext.set(event, EventStopPropagationFlag);

          handleCopy(event);

          break;
        }
        case EVENT_KEY_CODE.V:
          event.preventDefault();
          event.stopPropagation();
          event.preventGridDefault();
          EventContext.set(event, EventStopPropagationFlag);

          await handlePaste();
          break;
      }
    },
    [handleCopy, handlePaste],
  );

  return { onKeydownHandler };
}
