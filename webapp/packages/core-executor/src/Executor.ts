/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ExecutionContext, IExecutionContextProvider } from './ExecutionContext';
import { IExecutor } from './IExecutor';
import { IExecutorHandler } from './IExecutorHandler';
import { BlockedExecution, TaskScheduler } from './TaskScheduler/TaskScheduler';

export class Executor<T = unknown> implements IExecutor<T> {
  private handlers: Array<IExecutorHandler<any>> = [];
  private postHandlers: Array<IExecutorHandler<any>> = [];
  private scheduler: TaskScheduler<T>;

  constructor(
    private defaultData: T | null = null,
    isBlocked: BlockedExecution<T> | null = null
  ) {
    this.scheduler = new TaskScheduler(isBlocked);
  }

  async execute(data: T): Promise<IExecutionContextProvider<T>> {
    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      const context = new ExecutionContext(data);

      try {
        for (const handler of this.handlers) {
          const result = await handler(data, context);

          if (result === false) {
            return context;
          }
        }
      } finally {
        for (const handler of this.postHandlers) {
          await handler(data, context);
        }
      }
      return context;
    });
  }

  addHandler(handler: IExecutorHandler<T>): this {
    this.handlers.push(handler);
    return this;
  }

  removeHandler(handler: IExecutorHandler<T>): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  addPostHandler(handler: IExecutorHandler<T>): this {
    this.postHandlers.push(handler);
    return this;
  }

  removePostHandler(handler: IExecutorHandler<T>): void {
    this.postHandlers = this.postHandlers.filter(h => h !== handler);
  }

  private getDefaultData(data: T): T {
    if (data === null && this.defaultData !== null) {
      return this.defaultData;
    }
    return data;
  }
}
