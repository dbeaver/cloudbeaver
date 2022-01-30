/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { flat } from '@cloudbeaver/core-utils';

import { ExecutionContext } from './ExecutionContext';
import { ExecutorHandlersCollection } from './ExecutorHandlersCollection';
import { ExecutorInterrupter, IExecutorInterrupter } from './ExecutorInterrupter';
import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext';
import type { IExecutor } from './IExecutor';
import type { IExecutorHandler } from './IExecutorHandler';
import type { ChainLinkType, IExecutorHandlersCollection } from './IExecutorHandlersCollection';
import { BlockedExecution, TaskScheduler } from './TaskScheduler/TaskScheduler';

export class Executor<T = void> extends ExecutorHandlersCollection<T> implements IExecutor<T> {
  get executing(): boolean {
    return this.scheduler.executing;
  }

  private readonly scheduler: TaskScheduler<T>;

  constructor(
    private readonly defaultData: T | null = null,
    isBlocked: BlockedExecution<T> | null = null
  ) {
    super();
    this.scheduler = new TaskScheduler(isBlocked);
  }

  async execute(
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>
  ): Promise<IExecutionContextProvider<T>> {
    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      if (!context) {
        context = new ExecutionContext(data);
      }
      return this.executeHandlersCollection<T>(this, data, context, flat([(scope || [])]));
    });
  }

  async executeScope(
    data: T,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>,
    context?: IExecutionContext<T>
  ): Promise<IExecutionContextProvider<T>> {
    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      if (!context) {
        context = new ExecutionContext(data);
      }
      return this.executeHandlersCollection<T>(this, data, context, flat([(scope || [])]));
    });
  }

  private async executeHandlersCollection<T>(
    collection: IExecutorHandlersCollection<T>,
    data: T,
    context: IExecutionContext<T>,
    scoped: Array<IExecutorHandlersCollection<T>>
  ): Promise<IExecutionContextProvider<T>> {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);
    scoped = [...collection.collections, ...scoped];

    await this.executeChain(collection, data, context, 'before');

    for (const scope of scoped) {
      await this.executeChain(scope, data, context, 'before');
    }

    try {
      await this.executeHandlers(data, context, collection.handlers, interrupter);

      for (const scope of scoped) {
        await this.executeHandlers(data, context, scope.handlers, interrupter);
      }
    } finally {
      await this.executeHandlers(data, context, collection.postHandlers);

      for (const scope of scoped) {
        await this.executeHandlers(data, context, scope.postHandlers);
      }
    }

    await this.executeChain(collection, data, context, 'next');

    for (const scope of scoped) {
      await this.executeChain(scope, data, context, 'next');
    }
    return context;
  }

  private async executeChain<T>(
    collection: IExecutorHandlersCollection<T>,
    data: T,
    context: IExecutionContext<T>,
    type: ChainLinkType
  ): Promise<void> {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);

    for (const link of collection.chain.filter(link => link.type === type)) {
      if (interrupter.interrupted) {
        return;
      }

      const mappedData = link.map ? link.map(data, context) : data;
      const chainedContext = new ExecutionContext(mappedData, context);

      await this.executeHandlersCollection(
        link.executor,
        mappedData,
        chainedContext,
        flat([(collection.getLinkHandlers(link.executor) || [])])
      );
    }
  }

  private async executeHandlers<T>(
    data: T,
    context: IExecutionContext<T>,
    handlers: Array<IExecutorHandler<any>>,
    interrupter?: IExecutorInterrupter
  ): Promise<void> {
    for (const handler of handlers) {
      if (interrupter?.interrupted) {
        return;
      }
      await handler(data, context);
    }
  }

  private getDefaultData(data: T): T {
    if (data === null && this.defaultData !== null) {
      return this.defaultData;
    }
    return data;
  }

  protected executeHandlerWithInitialData(handler: IExecutorHandler<T>) {
    if (!this.initialDataGetter) {
      return;
    }

    const data = this.initialDataGetter();
    
    this.scheduler.schedule(data, async () => {
      const context = new ExecutionContext(data);
      
      try {
        await handler(data, context);
      } finally {
        await this.executeHandlers(data, context, this.postHandlers);
      }

      return context;
    });
  }
}
