/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { ITask, TaskScheduler } from '@cloudbeaver/core-executor';
import type { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';

import type { ConnectionExecutionContextResource, IConnectionExecutionContextInfo } from './ConnectionExecutionContextResource';
import type { IConnectionExecutionContext } from './IConnectionExecutionContext';

const DEFAULT_AUTO_COMMIT = true;

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

  get currentCommitMode() {
    if (this.context) {
      return this.context.autoCommit ?? DEFAULT_AUTO_COMMIT;
    }

    return DEFAULT_AUTO_COMMIT;
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
      currentCommitMode: computed,
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

  async setAutoCommit(auto: boolean) {
    const result = await this.withContext(async context => {
      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.asyncSqlSetAutoCommit({
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

    return result;
  }

  async commit() {
    const result = await this.withContext(async context => {
      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.asyncSqlCommitTransaction({
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

    return result;
  }

  async rollback() {
    const result = await this.withContext(async context => {
      const task = this.asyncTaskInfoService.create(async () => {
        const { taskInfo } = await this.graphQLService.sdk.asyncSqlRollbackTransaction({
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

    return result;
  }

  private withContext<R>(callback: (context: IConnectionExecutionContextInfo) => Promise<R>): Promise<R> {
    if (!this.context) {
      throw new Error('Execution Context not found');
    }

    return callback(this.context);
  }
}
