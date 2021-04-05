/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { copyToClipboard } from '@cloudbeaver/core-utils';
import { IDatabaseDataModel, IDatabaseResultSet, ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';

const EVENT_KEY_CODE = {
  C: 'KeyC',
};

function copyGridSelectedDataToClipboard(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  selectedCells: Map<number, number[]>
) {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const editor = model.source.getEditor(resultIndex);
  const orderedSelectedCells: Map<number, number[]> = new Map([...selectedCells].sort((a, b) => a[0] - b[0]));

  const selectedColumns: Set<number> = new Set();

  for (const colIndexes of orderedSelectedCells.values()) {
    for (const colIdx of colIndexes) {
      selectedColumns.add(colIdx);
    }
  }

  const columns = [...selectedColumns].sort((a, b) => a - b);

  let data = '';
  for (const [rowIdx, colIndexes] of orderedSelectedCells) {
    for (const column of columns) {
      if (column !== columns[0]) {
        data += '\t';
      }

      if (colIndexes.includes(column)) {
        const cell = editor.getCell(rowIdx, column);
        const cellValue = format.get(cell);
        if (cellValue === null) {
          continue;
        }
        data += cellValue;
      }
    }
    data += '\r\n';
  }

  copyToClipboard(data);
}

// needed for event.code
type IKeyboardEvent = React.KeyboardEvent<HTMLDivElement> & KeyboardEvent;

export function useGridSelectedCellsCopy(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  selectionContext: IDataGridSelectionContext
) {
  const props = useObjectRef({ model, resultIndex, selectionContext });

  const onKeydownHandler = useCallback((event: IKeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === EVENT_KEY_CODE.C) {
      copyGridSelectedDataToClipboard(
        props.model,
        props.resultIndex,
        props.selectionContext.selectedCells
      );
    }
  }, []);

  return { onKeydownHandler };
}
