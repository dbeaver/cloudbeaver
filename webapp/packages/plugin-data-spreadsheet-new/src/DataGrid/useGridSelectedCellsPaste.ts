/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { isDefined, isNotNullDefined } from '@dbeaver/js-helpers';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import type { DataGridCellKeyboardEvent } from '@cloudbeaver/plugin-data-grid';
import { ResultSetSelectAction, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';
import { ClipboardService } from '@cloudbeaver/core-ui';

import type { ITableData } from './TableDataContext.js';

const EVENT_KEY_CODE = {
  V: 'KeyV',
};

/** Parses clipboard content into a two-dimensional array of cells. */
function parseTSV(value: string): string[][] {
  if (value === '') {
    return [];
  }

  const normalized = value.replace(/\r\n/g, '\n');
  return normalized.split('\n').map(row => row.split('\t'));
}

export function useGridSelectedCellsPaste(
  tableData: ITableData,
  selectAction: ResultSetSelectAction | undefined,
): { onKeydownHandler: (event: DataGridCellKeyboardEvent) => void } {
  const clipboardService = useService(ClipboardService);

  const onKeydownHandler = useCallback(
    async (event: DataGridCellKeyboardEvent) => {
      const isPasteShortcut =
        (event.ctrlKey || event.metaKey) && !event.altKey && (event.key.toLowerCase() === 'v' || event.nativeEvent.code === EVENT_KEY_CODE.V);
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

      const clipboardText = await clipboardService.read();

      if (!isNotNullDefined(clipboardText)) {
        return;
      }

      if (selectedCells.length === 1) {
        const [target] = selectedCells;

        if (target && tableData.isCellEditable(target)) {
          tableData.editor.set(target, clipboardText);
        }

        return;
      }

      const matrix = parseTSV(clipboardText);
      const rows = matrix.length;
      const cols = matrix[0]?.length ?? 0;

      if (rows === 0 || cols === 0) {
        return;
      }

      const getRowIdx = (key: IGridDataKey) => tableData.getRowIndexFromKey(key.row);
      const getColIdx = (key: IGridDataKey) => tableData.getVisualColumnIndexFromColumnKey(key.column);

      // row-major order (top-to-bottom, left-to-right)
      const targets = selectedCells.slice().sort((a, b) => {
        const aRowIdx = getRowIdx(a);
        const bRowIdx = getRowIdx(b);

        if (aRowIdx !== bRowIdx) {
          return aRowIdx - bRowIdx;
        }

        return getColIdx(a) - getColIdx(b);
      });

      if (targets.length === 0) {
        return;
      }

      if (rows === 1 && cols === 1) {
        const value = matrix[0]?.[0];

        if (!isDefined(value)) {
          return;
        }

        const updates = targets.filter(key => tableData.isCellEditable(key)).map(key => ({ key, value }));
        tableData.editor.setMany(updates);
        return;
      }

      const [first] = targets;

      if (!first) {
        return;
      }

      // the top-left corner of the selection
      const baseRow = getRowIdx(first);
      const baseCol = getColIdx(first);

      const targetMap = new Map<string, IGridDataKey>();

      for (const target of targets) {
        const relRow = getRowIdx(target) - baseRow;
        const relCol = getColIdx(target) - baseCol;

        targetMap.set(`${relRow}:${relCol}`, target);
      }

      const updates = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const target = targetMap.get(`${r}:${c}`);
          const value = matrix[r]?.[c];

          if (target && isDefined(value) && tableData.isCellEditable(target)) {
            updates.push({ key: target, value });
          }
        }
      }

      if (updates.length > 0) {
        tableData.editor.setMany(updates);
      }
    },
    [tableData, selectAction, clipboardService],
  );

  return { onKeydownHandler };
}
