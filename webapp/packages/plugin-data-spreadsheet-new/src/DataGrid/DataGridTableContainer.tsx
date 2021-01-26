/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useContext } from 'react';
import styled, { css } from 'reshadow';

import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import { copyToClipboard } from '@cloudbeaver/core-utils';
import type { IDatabaseDataResult } from '@cloudbeaver/plugin-data-viewer';

import { DataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import type { IPosition } from './DataGridSelection/useGridSelectionContext';

const styles = css`
  grid-container {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
`;

interface Props {
  children: React.ReactNode;
  modelResultData: IDatabaseDataResult | null;
}

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function copyGridSelectedDataToClipboard(modelData: SqlResultSet, selectedCells: Map<string, IPosition>) {
  if (!modelData.rows) {
    return;
  }

  const orderedSelectedCells = Array.from((selectedCells.values())).sort((a, b) => {
    if (a.rowIdx === b.rowIdx) {
      return a.idx - b.idx;
    }
    return a.rowIdx - b.rowIdx;
  });

  const selectedRows: Map<number, Set<number>> = new Map();
  const selectedColumns: Set<number> = new Set();

  for (const { idx, rowIdx } of orderedSelectedCells.values()) {
    if (!selectedColumns.has(idx)) {
      selectedColumns.add(idx);
    }

    if (!selectedRows.has(rowIdx)) {
      selectedRows.set(rowIdx, new Set([idx]));
      continue;
    }
    selectedRows.set(rowIdx, selectedRows.get(rowIdx)!.add(idx));
  }

  const sortedSelectedColumns = Array.from(selectedColumns.values()).sort();

  let data = '';
  for (const [rowIdx, colIndexes] of selectedRows.entries()) {
    for (const column of sortedSelectedColumns) {
      if (column !== sortedSelectedColumns[0]) {
        data += '\t';
      }

      if (colIndexes.has(column)) {
        const value = modelData.rows?.[rowIdx][column - 1];
        data += value;
      }
    }
    data += '\r\n';
  }

  copyToClipboard(data);
}

// needed for event.code
type IKeyboardEvent = React.KeyboardEvent<HTMLDivElement> & KeyboardEvent;

export const DataGridTableContainer: React.FC<Props> = function DataGridTableContainer(props) {
  const selectionContext = useContext(DataGridSelectionContext);

  if (!selectionContext) {
    throw new Error('Selection context must be provided');
  }

  const onKeydownHandler = useCallback((event: IKeyboardEvent) => {
    if (!props.modelResultData) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.code === EVENT_KEY_CODE.C) {
      copyGridSelectedDataToClipboard(props.modelResultData.data, selectionContext.selectedCells);
    }
  }, [props.modelResultData, selectionContext.selectedCells]);

  return styled(styles)(
    <grid-container as='div' tabIndex={-1} onKeyDown={onKeydownHandler}>
      {props.children}
    </grid-container>
  );
};
