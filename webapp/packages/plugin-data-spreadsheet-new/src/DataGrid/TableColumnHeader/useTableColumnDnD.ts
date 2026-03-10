/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { useCombinedRef } from '@cloudbeaver/core-blocks';
import { useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import { type IDNDBox, type IDNDData, useDNDData } from '@cloudbeaver/core-ui';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY,
  type IDatabaseDataModel,
  type IGridColumnKey,
} from '@cloudbeaver/plugin-data-viewer';

import { ColumnDnDContext } from '../ColumnDnDContext.js';
import { useDataEditorDnDBox } from '../useDataEditorDnDBox.js';

interface TableColumnDnD {
  setRef: (element: React.ReactElement | Element | null) => void;
  data: IDNDData;
  box: IDNDBox;
}

export function useTableColumnDnD(model: IDatabaseDataModel, resultIndex: number, columnKey: IGridColumnKey | null): TableColumnDnD {
  const context = useDataContext();
  const columnDnDContext = useContext(ColumnDnDContext);

  useDataContextLink(context, (context, id) => {
    context.set(DATA_CONTEXT_DV_DDM, model, id);
    context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex, id);
    context.set(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY, columnKey, id);
  });

  const dndData = useDNDData(context, {
    canDrag: () => !model.isDisabled(resultIndex),
    onDragStart() {
      columnDnDContext?.setDragging(true);
    },
    onDragEnd() {
      columnDnDContext?.setDragging(false);
      columnDnDContext?.setDropTarget(null);
    },
  });

  const dndBox = useDataEditorDnDBox(model, resultIndex, columnKey);

  const setRef = useCombinedRef(dndData.setTargetRef, dndBox.setRef);

  return { setRef, data: dndData, box: dndBox };
}
