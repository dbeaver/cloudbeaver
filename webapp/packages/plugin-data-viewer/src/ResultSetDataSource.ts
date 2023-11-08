/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceInjector } from '@cloudbeaver/core-di';
import { AutoRunningTask } from '@cloudbeaver/core-executor';
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

  async loadTotalCount(resultIndex: number) {
    const context = this.executionContext?.context;

    if (!context) {
      throw new Error('Context must be provided');
    }

    const result = this.getResult(resultIndex);

    if (!result?.id) {
      throw new Error('Result id must be provided');
    }

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlRowDataCount({
        resultsId: result.id!,
        connectionId: context.connectionId,
        contextId: context.id,
        projectId: context.projectId,
      });

      return taskInfo;
    });

    const count = await this.runTask(
      () =>
        new AutoRunningTask(
          async () => {
            const info = await this.asyncTaskInfoService.run(task);

            if (task.cancelled) {
              return;
            }

            const { count } = await this.graphQLService.sdk.getSqlRowDataCountResult({ taskId: info.id });
            return count;
          },
          async () => await this.asyncTaskInfoService.cancel(task.id),
        ),
    );

    if (count !== undefined) {
      this.setTotalCount(resultIndex, count);
    }
  }
}
