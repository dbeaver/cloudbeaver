/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IDNDData, useDNDData } from '@cloudbeaver/core-ui';
import { useDataContext } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY, IDatabaseDataModel, IResultSetColumnKey } from '@cloudbeaver/plugin-data-viewer';

export function useTableColumnDnD(
  model: IDatabaseDataModel,
  resultIndex: number,
  columnKey: IResultSetColumnKey | null
): IDNDData {
  const context = useDataContext();

  context.set(DATA_CONTEXT_DV_DDM, model);
  context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex);
  context.set(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY, columnKey);

  const dndData = useDNDData(context, {
    canDrag: () => !model.isDisabled(resultIndex),
  });

  return dndData;
}