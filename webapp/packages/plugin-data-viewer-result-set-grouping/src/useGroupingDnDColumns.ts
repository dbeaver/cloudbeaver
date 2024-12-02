/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IDNDBox, useDNDBox } from '@cloudbeaver/core-ui';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY,
  type IDatabaseDataModel,
  type IResultSetColumnKey,
  isResultSetDataSource,
  ResultSetDataAction,
  ResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';

import type { IGroupingQueryState } from './IGroupingQueryState.js';
import type { IGroupingDataModel } from './useGroupingDataModel.js';

interface IGroupingQueryResult {
  dndBox: IDNDBox;
  dndThrowBox: IDNDBox;
}

export function useGroupingDnDColumns(
  state: IGroupingQueryState,
  sourceModel: IDatabaseDataModel<any>,
  groupingModel: IGroupingDataModel,
): IGroupingQueryResult {
  async function dropItem(source: ResultSetDataSource, resultIndex: number, columnKey: IResultSetColumnKey | null, outside: boolean) {
    if (!columnKey) {
      return;
    }

    const resultSetDataAction = source.getAction(resultIndex, ResultSetDataAction);
    const name = resultSetDataAction.getColumn(columnKey)?.name;

    if (!name) {
      return;
    }

    try {
      let columnNames = [...new Set([...state.columns, name])];

      if (outside) {
        columnNames = columnNames.filter(n => n !== name);
      }

      state.columns = columnNames;
    } catch (e) {}
  }

  const dndBox = useDNDBox({
    canDrop: context => {
      const model = context.get(DATA_CONTEXT_DV_DDM)!;

      return isResultSetDataSource(model.source) && context.has(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY) && model === sourceModel;
    },
    onDrop: async context => {
      const model = context.get(DATA_CONTEXT_DV_DDM)!;
      const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
      const columnKey = context.get(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY)!;

      dropItem(model.source as unknown as ResultSetDataSource, resultIndex, columnKey, false);
    },
  });

  const dndThrowBox = useDNDBox({
    canDrop: context => {
      const model = context.get(DATA_CONTEXT_DV_DDM);

      return context.has(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY) && model?.id === groupingModel.model.id && isResultSetDataSource(model.source);
    },
    onDrop: async context => {
      const model = context.get(DATA_CONTEXT_DV_DDM)!;
      const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
      const columnKey = context.get(DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY)!;

      dropItem(model.source as unknown as ResultSetDataSource, resultIndex, columnKey, true);
    },
  });

  return {
    dndBox,
    dndThrowBox,
  };
}
