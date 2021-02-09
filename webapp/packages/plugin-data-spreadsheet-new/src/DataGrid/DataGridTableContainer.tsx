/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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

const styles = css`
  grid-container {
    outline: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
`;

interface Props {
  children: React.ReactNode;
  modelResultData: IDatabaseDataResult | null;
  className?: string;
}

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function copyGridSelectedDataToClipboard(modelData: SqlResultSet, selectedCells: Map<number, number[]>) {
  if (!modelData.rows) {
    return;
  }

  const orderedSelectedCells: Map<number, number[]> = new Map([...selectedCells].sort((a, b) => a[0] - b[0]));

  const selectedColumns: Set<number> = new Set();

  for (const colIndexes of orderedSelectedCells.values()) {
    for (const colIdx of colIndexes) {
      selectedColumns.add(colIdx);
    }
  }

  const columns = [...selectedColumns].sort();

  let data = '';
  for (const [rowIdx, colIndexes] of orderedSelectedCells) {
    for (const column of columns) {
      if (column !== columns[0]) {
        data += '\t';
      }

      if (colIndexes.includes(column)) {
        const value = modelData.rows?.[rowIdx][column];
        data += value;
      }
    }
    data += '\r\n';
  }

  copyToClipboard(data);
}

// needed for event.code
type IKeyboardEvent = React.KeyboardEvent<HTMLDivElement> & KeyboardEvent;

export const DataGridTableContainer: React.FC<Props> = function DataGridTableContainer({
  modelResultData, children, className,
}) {
  const selectionContext = useContext(DataGridSelectionContext);

  if (!selectionContext) {
    throw new Error('Selection context must be provided');
  }

  const onKeydownHandler = useCallback((event: IKeyboardEvent) => {
    if (!modelResultData) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.code === EVENT_KEY_CODE.C) {
      copyGridSelectedDataToClipboard(modelResultData.data, selectionContext.selectedCells);
    }
  }, [modelResultData, selectionContext.selectedCells]);

  return styled(styles)(
    <grid-container as='div' tabIndex={-1} className={className} onKeyDown={onKeydownHandler}>
      {children}
    </grid-container>
  );
};
