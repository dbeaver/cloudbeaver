/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { type IDNDBox, useDNDBox } from '@cloudbeaver/core-ui';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY,
  GridViewAction,
  type IDatabaseDataModel,
  IDatabaseDataViewAction,
  type IGridColumnKey,
  isResultSetDataModel,
  ResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';

import { ColumnDnDContext } from './ColumnDnDContext.js';

export function useDataEditorDnDBox(model: IDatabaseDataModel, resultIndex: number, columnKey: IGridColumnKey | null): IDNDBox {
  const columnDnDContext = useContext(ColumnDnDContext);
  let resultSetViewAction: GridViewAction | undefined;

  if (isResultSetDataModel(model)) {
    resultSetViewAction = (model.source as ResultSetDataSource).tryGetAction(resultIndex, IDatabaseDataViewAction, GridViewAction);
  }

  const dndBox = useDNDBox({
    canDrop(context) {
      return (
        context.hasValue(DATA_CONTEXT_DV_DDM, model) &&
        context.hasValue(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex) &&
        !context.hasValue(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY, columnKey)
      );
    },
    onHover() {
      if (columnKey && dndBox.state.isOver && dndBox.state.context) {
        const dndColumnKey = dndBox.state.context.get(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY);
        let side: 'left' | 'right' = 'left';

        if (resultSetViewAction && dndColumnKey && resultSetViewAction.columnIndex(columnKey) > resultSetViewAction.columnIndex(dndColumnKey)) {
          side = 'right';
        }

        columnDnDContext?.setDropTarget(columnKey.index, side);
      }
    },
    onDrop(context) {
      columnDnDContext?.setDropTarget(null);

      const dndColumnKey = context.get(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY);

      if (columnKey && dndColumnKey && resultSetViewAction) {
        resultSetViewAction.setColumnOrder(dndColumnKey, resultSetViewAction.columnIndex(columnKey));

        const isFromPinned = resultSetViewAction.isColumnPinned(dndColumnKey);
        const isToPinned = resultSetViewAction.isColumnPinned(columnKey);

        if (isFromPinned && !isToPinned) {
          resultSetViewAction.unpinColumns([dndColumnKey]);
        } else if (!isFromPinned && isToPinned) {
          resultSetViewAction.pinColumns([dndColumnKey]);
        }
      }
    },
  });

  return dndBox;
}
