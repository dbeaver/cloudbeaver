/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { IServiceInjector } from '@cloudbeaver/core-di';
import type { AsyncTask, AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';

import { DatabaseDataSource } from './DatabaseDataModel/DatabaseDataSource';
import type { IDatabaseResultSet } from './DatabaseDataModel/IDatabaseResultSet';

interface ResultSetDataSourceState {
  totalCountTasks: Map<number, AsyncTask>; // Map<resultIndex, AsyncTask>
}

export abstract class ResultSetDataSource<TOptions> extends DatabaseDataSource<TOptions, IDatabaseResultSet> {
  readonly totalCountTasks: Map<number, AsyncTask>;

  constructor(
    readonly serviceInjector: IServiceInjector,
    protected graphQLService: GraphQLService,
    protected asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    super(serviceInjector);

    this.totalCountTasks = new Map();

    makeObservable<ResultSetDataSourceState>(this, {
      totalCountTasks: observable.shallow,
    });
  }

  async cancelLoadTotalCount(resultIndex: number) {
    const task = this.totalCountTasks.get(resultIndex);

    if (task && !task.cancelled) {
      await this.asyncTaskInfoService.cancel(task.id);
      this.totalCountTasks.delete(resultIndex);
    }
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

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlRowDataCount({
        resultsId: result.id!,
        connectionId: executionContextInfo.connectionId,
        contextId: executionContextInfo.id,
        projectId: executionContextInfo.projectId,
      });

      return taskInfo;
    });

    this.totalCountTasks.set(resultIndex, task);

    try {
      const count = await executionContext.run(
        async () => {
          const info = await this.asyncTaskInfoService.run(task);

          if (!task.cancelled && !info.running) {
            const { count } = await this.graphQLService.sdk.getSqlRowDataCountResult({ taskId: info.id });
            return count;
          }

          return;
        },
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );

      if (count !== undefined) {
        this.setTotalCount(resultIndex, count);
      }
    } finally {
      this.totalCountTasks.delete(resultIndex);
    }
  }
}
