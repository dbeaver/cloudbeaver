/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContext, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import type { GraphQLService } from '@cloudbeaver/core-sdk';

import { DatabaseDataSource } from '../DatabaseDataModel/DatabaseDataSource.js';
import { type IDatabaseDataOptions } from '../DatabaseDataModel/IDatabaseDataOptions.js';
import type { IDatabaseResultSet } from '../DatabaseDataModel/IDatabaseResultSet.js';

export abstract class ResultSetDataSource<TOptions = IDatabaseDataOptions> extends DatabaseDataSource<TOptions, IDatabaseResultSet> {
  executionContext: IConnectionExecutionContext | null;
  totalCountRequestTask: ITask<number> | null;
  private keepExecutionContextOnDispose: boolean;

  constructor(
    override readonly serviceProvider: IServiceProvider,
    protected graphQLService: GraphQLService,
    protected asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    super(serviceProvider);
    this.totalCountRequestTask = null;
    this.executionContext = null;
    this.keepExecutionContextOnDispose = false;

    makeObservable(this, {
      totalCountRequestTask: observable.ref,
      executionContext: observable,
    });
  }

  override isReadonly(resultIndex: number): boolean {
    return super.isReadonly(resultIndex) || !this.executionContext?.context || !!this.getResult(resultIndex)?.data?.readOnly;
  }

  override async cancel(): Promise<void> {
    await super.cancel();
    await this.cancelLoadTotalCount();
  }

  async cancelLoadTotalCount(): Promise<ITask<number> | null> {
    await this.totalCountRequestTask?.cancel();

    return this.totalCountRequestTask;
  }

  async loadTotalCount(resultIndex: number): Promise<ITask<number>> {
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

    const count = await task;
    this.setTotalCount(resultIndex, count);

    return this.totalCountRequestTask;
  }

  override setResults(results: IDatabaseResultSet[]): this {
    this.closeResults(this.results.filter(result => !results.some(r => r.id === result.id)));
    return super.setResults(results);
  }

  override async dispose(): Promise<void> {
    await super.dispose();
    if (this.keepExecutionContextOnDispose) {
      await this.closeResults(this.results);
    } else {
      await this.executionContext?.destroy();
    }
  }

  setKeepExecutionContextOnDispose(keep: boolean): this {
    this.keepExecutionContextOnDispose = keep;
    return this;
  }

  setExecutionContext(context: IConnectionExecutionContext | null): this {
    this.executionContext = context;
    this.setOutdated();
    return this;
  }

  protected getPreviousResultId(prevResults: IDatabaseResultSet[], context: IConnectionExecutionContextInfo) {
    let resultId: string | undefined;

    if (
      prevResults.length === 1 &&
      prevResults[0]!.contextId === context.id &&
      prevResults[0]!.connectionId === context.connectionId &&
      prevResults[0]!.id !== null
    ) {
      resultId = prevResults[0]!.id;
    }

    return resultId;
  }

  private setTotalCount(resultIndex: number, count: number): this {
    const result = this.getResult(resultIndex);

    if (result) {
      result.totalCount = count;
    }
    return this;
  }

  private async closeResults(results: IDatabaseResultSet[]): Promise<void> {
    if (!this.executionContext?.context) {
      return;
    }

    for (const result of results) {
      // TODO: it's better to track that context is closed with subscription
      if (result.id === null || result.contextId !== this.executionContext.context.id) {
        continue;
      }
      try {
        await this.graphQLService.sdk.closeResult({
          projectId: result.projectId,
          connectionId: result.connectionId,
          contextId: result.contextId,
          resultId: result.id,
        });
      } catch (exception: any) {
        console.log(`Error closing result (${result.id}):`, exception);
      }
    }
  }
}

export function isResultSetDataSource<T = IDatabaseDataOptions>(dataSource: any): dataSource is ResultSetDataSource<T> {
  return dataSource instanceof ResultSetDataSource;
}
