/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ExecutionContext } from './ExecutionContext';
import { ExecutorHandlersCollection } from './ExecutorHandlersCollection';
import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext';
import type { IExecutor } from './IExecutor';
import type { IExecutorHandler } from './IExecutorHandler';
import type { IExecutorHandlersCollection } from './IExecutorHandlersCollection';
import { BlockedExecution, TaskScheduler } from './TaskScheduler/TaskScheduler';

export class Executor<T = void> implements IExecutor<T> {
  private collection: ExecutorHandlersCollection<T>;
  private scheduler: TaskScheduler<T>;

  constructor(
    private defaultData: T | null = null,
    isBlocked: BlockedExecution<T> | null = null
  ) {
    this.scheduler = new TaskScheduler(isBlocked);
    this.collection = new ExecutorHandlersCollection();
  }

  before<TNext>(executor: IExecutor<TNext>, map?: (data: T) => TNext): this {
    this.collection.before(executor, map);
    return this;
  }

  next<TNext>(executor: IExecutor<TNext>, map?: (data: T) => TNext): this {
    this.collection.next(executor, map);
    return this;
  }

  async execute(
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T>
  ): Promise<IExecutionContextProvider<T>> {
    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      if (!context) {
        context = new ExecutionContext(data);
      }
      return this.collection.execute(data, context, scope);
    });
  }

  async executeScope(
    data: T,
    scoped?: IExecutorHandlersCollection<T>,
    context?: IExecutionContext<T>
  ): Promise<IExecutionContextProvider<T>> {
    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      if (!context) {
        context = new ExecutionContext(data);
      }
      return this.collection.execute(data, context, scoped);
    });
  }

  addHandler(handler: IExecutorHandler<T>): this {
    this.collection.addHandler(handler);
    return this;
  }

  removeHandler(handler: IExecutorHandler<T>): void {
    this.collection.removeHandler(handler);
  }

  addPostHandler(handler: IExecutorHandler<T>): this {
    this.collection.addPostHandler(handler);
    return this;
  }

  removePostHandler(handler: IExecutorHandler<T>): void {
    this.collection.removePostHandler(handler);
  }

  private getDefaultData(data: T): T {
    if (data === null && this.defaultData !== null) {
      return this.defaultData;
    }
    return data;
  }
}
