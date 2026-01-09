/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { AsyncTaskInfo } from '@cloudbeaver/core-sdk';
import { type IDataQueryOptions, QueryDataSource } from '@cloudbeaver/plugin-sql-editor';

export interface IDataGroupingOptions extends IDataQueryOptions {
  query: string;
  sourceResultId: string;
  columns: string[];
  functions: string[];
  showDuplicatesOnly: boolean;
}

export class GroupingDataSource extends QueryDataSource<IDataGroupingOptions> {
  protected override async executeQuery(
    executionContextInfo: IConnectionExecutionContextInfo,
    options: IDataGroupingOptions,
    currentResultsId: string | undefined,
    limit: number,
  ): Promise<AsyncTaskInfo> {
    const { taskInfo } = await this.graphQLService.sdk.asyncSqlGroupingResultSet({
      projectId: executionContextInfo.projectId,
      connectionId: executionContextInfo.connectionId,
      contextId: executionContextInfo.id,
      originalResultsId: options.sourceResultId,
      currentResultsId: currentResultsId,
      columnNames: options.columns,
      functions: options.functions,
      showDuplicatesOnly: options.showDuplicatesOnly,
      filter: {
        offset: this.offset,
        limit,
        constraints: options.constraints,
        where: options.whereFilter || undefined,
      },
      dataFormat: this.dataFormat,
    });

    return taskInfo;
  }
}
