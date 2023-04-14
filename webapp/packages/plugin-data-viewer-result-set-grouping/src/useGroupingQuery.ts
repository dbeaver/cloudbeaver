/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction } from 'mobx';
import { useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import type { IDatabaseDataModel, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';



export interface IGroupingQueryState{
  columns: string[];
  query: string | null;
}

export function useGroupingQuery(
  state: IGroupingQueryState,
  sourceModel: IDatabaseDataModel<any, IDatabaseResultSet>,
  sourceResultIndex: number,
) {
  const graphQLService = useService(GraphQLService);

  useEffect(() => {
    const sub = reaction(() => {
      const executionContextInfo = sourceModel.source.executionContext?.context;
      const result = sourceModel.source.hasResult(sourceResultIndex)
        ? sourceModel.source.getResult(sourceResultIndex)
        : null;

      return {
        columns: state.columns,
        executionContextInfo,
        result,
      };
    }, async ({ columns, executionContextInfo, result }) => {

      if (!result?.id || !executionContextInfo || columns.length === 0) {
        return;
      }

      const { query } = await graphQLService.sdk.getResultsetGroupingQuery({
        projectId: executionContextInfo.projectId,
        connectionId: executionContextInfo.connectionId,
        contextId: executionContextInfo.id,
        resultsId: result.id,
        columnNames: columns,
      });
      state.query = query;
    }, { fireImmediately: true });

    return sub;
  }, [state, sourceModel, sourceResultIndex]);
}