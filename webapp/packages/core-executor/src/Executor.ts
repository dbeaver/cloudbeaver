/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ExecutionContext, IContextProvider } from './ExecutionContext';
import { IExecutor } from './IExecutor';
import { IExecutorHandler } from './IExecutorHandler';

export class Executor<T> implements IExecutor<T> {
  private handlers: IExecutorHandler<any>[] = [];
  private postHandlers: IExecutorHandler<any>[] = [];

  constructor(
    private defaultData?: T | null
  ) { }

  async execute(data: T): Promise<IContextProvider<T>> {
    if ((data === undefined || data === null) && this.defaultData !== undefined && this.defaultData !== null) {
      data = this.defaultData;
    }

    const context = new ExecutionContext(data);

    for (const handler of this.handlers) {
      const result = await handler(context, data);

      if (result === false) {
        return context;
      }
    }

    for (const handler of this.postHandlers) {
      await handler(context, data);
    }
    return context;
  }

  addHandler(handler: IExecutorHandler<T>) {
    this.handlers.push(handler);
    return this;
  }

  removeHandler(handler: IExecutorHandler<T>) {
    this.handlers = this.handlers.filter(h => h === handler);
  }

  addPostHandler(handler: IExecutorHandler<T>) {
    this.postHandlers.push(handler);
    return this;
  }

  removePostHandler(handler: IExecutorHandler<T>) {
    this.postHandlers = this.postHandlers.filter(h => h === handler);
  }
}
