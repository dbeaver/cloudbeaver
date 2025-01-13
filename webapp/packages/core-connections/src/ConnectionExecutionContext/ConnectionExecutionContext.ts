/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { ITask, TaskScheduler } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import type { AsyncTaskInfo, GraphQLService } from '@cloudbeaver/core-sdk';

import type { ConnectionExecutionContextResource, IConnectionExecutionContextInfo } from './ConnectionExecutionContextResource.js';
import type { IConnectionExecutionContext } from './IConnectionExecutionContext.js';

export interface IConnectionExecutionContextUpdateTaskInfo {
  name?: string;
  result?: string | boolean;
}

export class ConnectionExecutionContext implements IConnectionExecutionContext {
  get context(): IConnectionExecutionContextInfo | undefined {
    return this.connectionExecutionContextResource.get(this.contextId);
  }

  get executing(): boolean {
    return this.scheduler.isExecuting(this.contextId);
  }

  get cancellable(): boolean {
    return this.currentTask?.cancellable || false;
  }

  get autoCommit() {
    if (!this.context) {
      return;
    }

    return this.context.autoCommit;
  }

  private currentTask: ITask<any> | null;

  constructor(
    private readonly contextId: string,
    private readonly scheduler: TaskScheduler<string>,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly graphQLService: GraphQLService,
  ) {
    this.currentTask = null;
    makeObservable<this, 'currentTask'>(this, {
      currentTask: observable.ref,
      context: computed,
      executing: computed,
      cancellable: computed,
      autoCommit: computed,
    });
  }

  run<T>(task: () => Promise<T>, cancel?: () => Promise<any> | void, end?: () => Promise<any> | void): ITask<T> {
    if (!this.context) {
      throw new Error('Execution Context not found');
    }

    this.currentTask = this.scheduler
      .schedule(this.contextId, task, { cancel })
      .finally(end)
      .finally(() => {
        this.currentTask = null;
      });

    return this.currentTask;
  }

  async cancel(): Promise<void> {
    await this.scheduler.cancel(this.contextId);
  }

  async destroy(): Promise<void> {
    if (!this.context) {
      return;
    }

    await this.cancel();
    await this.connectionExecutionContextResource.destroy(this.contextId);
  }

  async update(defaultCatalog?: string, defaultSchema?: string): Promise<IConnectionExecutionContextInfo> {
    if (!this.context) {
      throw new Error('Execution Context not found');
    }

    return await this.connectionExecutionContextResource.update(this.contextId, defaultCatalog, defaultSchema);
  }

  async setAutoCommit(auto: boolean): Promise<IConnectionExecutionContextUpdateTaskInfo> {
    const result = await this.withContext(async context => {
      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.asyncSqlSetAutoCommit({
          projectId: context.projectId,
          connectionId: context.connectionId,
          contextId: context.id,
          autoCommit: auto,
        });

        return taskInfo;
      });

      return await this.run(
        async () => await this.asyncTaskInfoService.run(task),
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );
    });

    return mapAsyncTaskInfo(result);
  }

  async commit(): Promise<IConnectionExecutionContextUpdateTaskInfo> {
    const result = await this.withContext(async context => {
      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.asyncSqlCommitTransaction({
          projectId: context.projectId,
          connectionId: context.connectionId,
          contextId: context.id,
        });

        return taskInfo;
      });

      return await this.run(
        async () => await this.asyncTaskInfoService.run(task),
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );
    });

    return mapAsyncTaskInfo(result);
  }

  async rollback(): Promise<IConnectionExecutionContextUpdateTaskInfo> {
    const result = await this.withContext(async context => {
      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.asyncSqlRollbackTransaction({
          projectId: context.projectId,
          connectionId: context.connectionId,
          contextId: context.id,
        });

        return taskInfo;
      });

      return await this.run(
        async () => await this.asyncTaskInfoService.run(task),
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );
    });

    return mapAsyncTaskInfo(result);
  }

  async getLog() {
    const result = await this.withContext(async context => {
      const { log } = await this.graphQLService.sdk.getTransactionLog({
        projectId: context.projectId,
        connectionId: context.connectionId,
        contextId: context.id,
      });

      return log;
    });

    return result?.transactionLogInfos;
  }

  private withContext<R>(callback: (context: IConnectionExecutionContextInfo) => Promise<R>): Promise<R> {
    if (!this.context) {
      throw new Error('Execution Context not found');
    }

    return callback(this.context);
  }
}

function mapAsyncTaskInfo(info: AsyncTaskInfo): IConnectionExecutionContextUpdateTaskInfo {
  return {
    name: info.name,
    result: info.taskResult,
  };
}
