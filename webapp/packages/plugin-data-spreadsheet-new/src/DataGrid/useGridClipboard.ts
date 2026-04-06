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
import {
  DatabaseSelectAction,
  DataViewerService,
  type IGridColumnKey,
  type IGridDataKey,
  GridDataKeysUtils,
  ResultSetSelectAction,
  useDataViewerCopyHandler,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext, ILastSelectionRegion } from './DataGridSelection/DataGridSelectionContext.js';
import type { ITableData } from './TableDataContext.js';
import type { GridClipboard } from './helpers/clipboard/GridClipboard.js';
import { parseTsv } from './helpers/clipboard/parseTsv.js';
import { CLIPBOARD_KEY_CODES } from './helpers/constants/keyCodes.js';
import { GRID_ROLES } from './helpers/constants/gridRoles.js';
import { formatCellValueForClipboard } from './helpers/cell/formatters.js';
import { getCellRawValue, isCellPasteable } from './helpers/cell/accessors.js';
import { extractCellsFromRegion, extractRegionCells } from './helpers/selection/extractCells.js';
import { buildTsvFromCells } from './helpers/selection/buildTsv.js';
import { computePasteUpdates } from './helpers/paste/computePasteUpdates.js';

/**
 * Check if the keyboard event target is a grid cell (not an input field).
 */
function isGridCellTarget(event: React.KeyboardEvent): boolean {
  const activeElement = document.activeElement as HTMLElement | null;

  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
    return false;
  }

  const role = activeElement?.getAttribute('role');

  return (
    role === GRID_ROLES.gridCell ||
    role === GRID_ROLES.columnHeader ||
    activeElement?.closest(`[role="${GRID_ROLES.gridCell}"]`) !== null ||
    event.target === event.currentTarget
  );
}

/**
 * Get the region to copy based on current selection state.
 */
function getRegionToCopy(
  selectedCells: Map<string, IGridDataKey[]>,
  focusedElement: IGridDataKey | null,
  lastSelectionRegion: ILastSelectionRegion | null,
  tableData: ITableData,
  getCellRawValue: (key: IGridDataKey) => unknown,
) {
  // Priority 1: Use last selection region if available (preserves selection order)
  if (selectedCells.size > 0 && lastSelectionRegion) {
    return extractCellsFromRegion({ region: lastSelectionRegion, getCellRawValue });
  }

  // Priority 2: Use bounding box of selected cells
  if (selectedCells.size > 0) {
    return extractRegionCells({ tableData, selectedCells, getCellRawValue });
  }

  // Priority 3: Use focused element as single-cell selection
  if (focusedElement) {
    const serialized = GridDataKeysUtils.serialize(focusedElement.row);
    return extractRegionCells({ tableData, selectedCells: new Map([[serialized, [focusedElement]]]), getCellRawValue });
  }

  return null;
}

interface IUseGridClipboardParams {
  tableData: ITableData;
  selectAction: DatabaseSelectAction | undefined;
  selectionContext: IDataGridSelectionContext;
  gridClipboard: GridClipboard;
  getHeaderOrder: () => string[];
}

interface IUseGridClipboardResult {
  onKeydownHandler: (event: React.KeyboardEvent) => void;
  handleCopy: () => void;
  handlePaste: () => Promise<void>;
  gridClipboard: GridClipboard;
}

export function useGridClipboard(params: IUseGridClipboardParams): IUseGridClipboardResult {
  const { tableData, selectAction, selectionContext, gridClipboard, getHeaderOrder } = params;

  const dataViewerService = useService(DataViewerService);
  const notificationService = useService(NotificationService);
  const props = useObjectRef({ tableData, selectionContext, selectAction, gridClipboard, getHeaderOrder, notificationService });
  const copyEventHandler = useDataViewerCopyHandler();

  const handleCopy = useCallback(() => {
    const { tableData, selectionContext, selectAction, gridClipboard } = props;

    if (!dataViewerService.canCopyData || !(selectAction instanceof ResultSetSelectAction)) {
      return;
    }

    // Safe cast: ResultSetSelectAction is typed with IGridDataKey
    const focusedElement = selectAction.getFocusedElement() as IGridDataKey | null;
    const selectedCells = selectionContext.selectedCells;

    if (selectedCells.size === 0 && !focusedElement) {
      return;
    }

    const getCellValue = (key: IGridDataKey) => getCellRawValue({ tableData, key });
    const regionData = getRegionToCopy(selectedCells, focusedElement, selectionContext.lastSelectionRegion, tableData, getCellValue);

    if (!regionData) {
      return;
    }

    gridClipboard.setCopiedRegion({
      rows: regionData.cells.length,
      columns: regionData.cells[0]?.length ?? 0,
      cells: regionData.cells,
    });

    const tsvText = buildTsvFromCells(regionData.cells, cell => formatCellValueForClipboard({ tableData, key: cell.sourceKey, value: cell.value }));
    copyToClipboard(tsvText);
  }, [dataViewerService.canCopyData, props]);

  const handlePaste = useCallback(async () => {
    const { tableData, selectionContext, selectAction, getHeaderOrder, notificationService } = props;

    if (!tableData.editor) {
      return;
    }

    let clipboardText: string;
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch {
      notificationService.logError({
        title: 'data_grid_table_context_menu_filter_clipboard_permission',
        isSilent: true,
      });
      return;
    }

    const pastedGrid = parseTsv(clipboardText);

    if (pastedGrid.length === 0) {
      return;
    }

    const focusedElement = (selectAction?.getFocusedElement() as IGridDataKey | null) ?? null;
    const selectedCells = selectionContext.selectedCells;
    const visualColumnOrder: IGridColumnKey[] = getHeaderOrder()
      .map(key => ({ index: Number(key) }))
      .filter(col => !Number.isNaN(col.index));

    const updates = computePasteUpdates({
      pastedGrid,
      selectedCells,
      focusedElement,
      tableData,
      visualColumnOrder,
      isCellEditable: key => isCellPasteable({ tableData, key }),
    });

    if (updates.length === 0) {
      return;
    }

    tableData.editor.setMany(
      updates.map(u => ({
        key: u.key,
        value: u.value,
      })),
    );
  }, [props]);

  const onKeydownHandler = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.nativeEvent.code === CLIPBOARD_KEY_CODES.ESCAPE) {
        props.gridClipboard.clear();
        return;
      }

      const isModKey = event.ctrlKey || event.metaKey;

      if (!isModKey) {
        return;
      }

      if (event.nativeEvent.code === CLIPBOARD_KEY_CODES.C) {
        if (!isGridCellTarget(event)) {
          return;
        }

        EventContext.set(event, EventStopPropagationFlag);
        handleCopy();
        copyEventHandler(event);
      }

      if (event.nativeEvent.code === CLIPBOARD_KEY_CODES.V) {
        if (!isGridCellTarget(event)) {
          return;
        }

        EventContext.set(event, EventStopPropagationFlag);
        handlePaste();
      }
    },
    [copyEventHandler, handleCopy, handlePaste, props.gridClipboard],
  );

  return { onKeydownHandler, handleCopy, handlePaste, gridClipboard };
}
