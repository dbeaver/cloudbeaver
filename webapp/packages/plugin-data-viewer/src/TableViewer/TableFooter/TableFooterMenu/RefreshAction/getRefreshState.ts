/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IDataContextProvider } from '@cloudbeaver/core-data-context';

import { DatabaseRefreshAction } from '../../../../DatabaseDataModel/Actions/DatabaseRefreshAction.js';
import { DATA_CONTEXT_DV_DDM } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import { type IDatabaseDataResult } from '../../../../DatabaseDataModel/IDatabaseDataResult.js';

export function getRefreshState(context: IDataContextProvider): DatabaseRefreshAction<IDatabaseDataResult> | null {
  const model = context.get(DATA_CONTEXT_DV_DDM)!;
  const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX);
  if (resultIndex === undefined || !model.source.hasResult(resultIndex)) {
    return null;
  }
  return model.source.getAction(resultIndex, DatabaseRefreshAction);
}
