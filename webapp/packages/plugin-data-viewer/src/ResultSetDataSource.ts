/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceInjector } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import type { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';

import { DatabaseDataSource } from './DatabaseDataModel/DatabaseDataSource';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';

export abstract class ResultSetDataSource<TOptions> extends DatabaseDataSource<TOptions, IDatabaseResultSet> {
  constructor(
    readonly serviceInjector: IServiceInjector,
    protected graphQLService: GraphQLService,
    protected asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    super(serviceInjector);
  }

  async dispose(): Promise<void> {
    await this.cancelLoadTotalCount();
  }

  async cancelLoadTotalCount(): Promise<ITask<number> | null> {
    await this.totalCountRequestTask?.cancel();

    return this.totalCountRequestTask;
  }

  async loadTotalCount(resultIndex: number) {
    const executionContext = this.executionContext;
    const executionContextInfo = this.executionContext?.context;

    if (!executionContext || !executionContextInfo) {
      throw new Error('Context must be provided');
    }

    const result = this.getResult(resultIndex);

    if (!result?.id) {
      throw new Error('Result id must be provided');
    }

    const asyncTask = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlRowDataCount({
        resultsId: result.id!,
        connectionId: executionContextInfo.connectionId,
        contextId: executionContextInfo.id,
        projectId: executionContextInfo.projectId,
      });

      return taskInfo;
    });

    const task = executionContext.run(
      async () => {
        const info = await this.asyncTaskInfoService.run(asyncTask);

        const { count } = await this.graphQLService.sdk.getSqlRowDataCountResult({ taskId: info.id });

        return count;
      },
      () => this.asyncTaskInfoService.cancel(asyncTask.id),
      () => this.asyncTaskInfoService.remove(asyncTask.id),
    );

    this.totalCountRequestTask = task;

    try {
      const count = await task;

      this.setTotalCount(resultIndex, count);
    } finally {
      this.totalCountRequestTask = null;
    }

    return this.totalCountRequestTask;
  }
}
