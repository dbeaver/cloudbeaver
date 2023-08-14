/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCombinedRef } from '@cloudbeaver/core-blocks';
import { IDNDBox, IDNDData, useDNDBox, useDNDData } from '@cloudbeaver/core-ui';
import { useDataContext } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY,
  IDatabaseDataModel,
  IResultSetColumnKey,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

interface TableColumnDnD {
  setRef: (element: React.ReactElement | Element | null) => void;
  data: IDNDData;
  box: IDNDBox;
  side: 'left' | 'right' | null;
}

export function useTableColumnDnD(model: IDatabaseDataModel, resultIndex: number, columnKey: IResultSetColumnKey | null): TableColumnDnD {
  const context = useDataContext();
  const resultSetViewAction = model.source.getAction(resultIndex, ResultSetViewAction);

  context.set(DATA_CONTEXT_DV_DDM, model);
  context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex);
  context.set(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY, columnKey);

  const dndData = useDNDData(context, {
    canDrag: () => !model.isDisabled(resultIndex),
  });

  const dndBox = useDNDBox({
    canDrop(context) {
      return (
        context.hasValue(DATA_CONTEXT_DV_DDM, model) &&
        context.hasValue(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex) &&
        !context.hasValue(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY, columnKey)
      );
    },
    onDrop(context) {
      const dndColumnKey = context.get(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY);

      if (columnKey && dndColumnKey) {
        resultSetViewAction.setColumnOrder(dndColumnKey, resultSetViewAction.columnIndex(columnKey));
      }
    },
  });

  const setRef = useCombinedRef(dndData.setTargetRef, dndBox.setRef);

  let side: 'left' | 'right' | null = null;

  if (columnKey && dndBox.state.isOver && dndBox.state.context) {
    const dndColumnKey = dndBox.state.context.get(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY);

    if (dndColumnKey && resultSetViewAction.columnIndex(columnKey) > resultSetViewAction.columnIndex(dndColumnKey)) {
      side = 'right';
    } else {
      side = 'left';
    }
  }

  return { setRef, data: dndData, box: dndBox, side };
}
