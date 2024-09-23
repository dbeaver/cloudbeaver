/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ExecutionContext } from './ExecutionContext.js';
import { executionExceptionContext } from './executionExceptionContext.js';
import { ExecutorHandlersCollection } from './ExecutorHandlersCollection.js';
import { ExecutorInterrupter, type IExecutorInterrupter } from './ExecutorInterrupter.js';
import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext.js';
import type { IExecutor } from './IExecutor.js';
import type { IExecutorHandler } from './IExecutorHandler.js';
import type { ChainLinkType, IExecutorHandlersCollection } from './IExecutorHandlersCollection.js';
import { type BlockedExecution, TaskScheduler } from './TaskScheduler/TaskScheduler.js';

export class Executor<T = void> extends ExecutorHandlersCollection<T> implements IExecutor<T> {
  get executing(): boolean {
    return this.scheduler.executing;
  }

  private readonly scheduler: TaskScheduler<T>;

  constructor(
    private readonly defaultData: T | null = null,
    isBlocked: BlockedExecution<T> | null = null,
  ) {
    super();
    this.scheduler = new TaskScheduler(isBlocked);
  }

  async execute(
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>,
  ): Promise<IExecutionContextProvider<T>> {
    if (context && ExecutorInterrupter.isInterrupted(context)) {
      return context;
    }

    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      if (!context) {
        context = new ExecutionContext(data);
      }
      return this.executeHandlersCollection<T>(this, data, context, [scope || []].flat());
    });
  }

  async executeScope(
    data: T,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>,
    context?: IExecutionContext<T>,
  ): Promise<IExecutionContextProvider<T>> {
    if (context && ExecutorInterrupter.isInterrupted(context)) {
      return context;
    }

    data = this.getDefaultData(data);

    return await this.scheduler.schedule(data, async () => {
      if (!context) {
        context = new ExecutionContext(data);
      }
      return this.executeHandlersCollection<T>(this, data, context, [scope || []].flat());
    });
  }

  private async executeHandlersCollection<T>(
    collection: IExecutorHandlersCollection<T>,
    data: T,
    context: IExecutionContext<T>,
    scoped: Array<IExecutorHandlersCollection<T>>,
  ): Promise<IExecutionContextProvider<T>> {
    scoped = [...collection.collections, ...scoped];

    context.addContextCreators(collection.contextCreators as any);

    for (const scope of scoped) {
      context.addContextCreators(scope.contextCreators as any);
    }

    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);

    await this.executeChain(collection, data, context, 'before');

    for (const scope of scoped) {
      await this.executeChain(scope, data, context, 'before');
    }

    try {
      await this.executeHandlers(data, context, collection.handlers, interrupter);

      for (const scope of scoped) {
        await this.executeHandlers(data, context, scope.handlers, interrupter);
      }
    } catch (exception: any) {
      const exceptionContext = context.getContext(executionExceptionContext);
      exceptionContext.setException(exception);
      throw exception;
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
    type: ChainLinkType,
  ): Promise<void> {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);

    for (const link of collection.chain.filter(link => link.type === type)) {
      if (interrupter.interrupted) {
        return;
      }

      if (link.filter && !link.filter(data, context)) {
        continue;
      }

      const mappedData = link.map ? link.map(data, context) : data;
      const chainedContext = new ExecutionContext(mappedData, context);

      await this.executeHandlersCollection(link.executor, mappedData, chainedContext, [collection.getLinkHandlers(link.executor) || []].flat());
    }
  }

  private async executeHandlers<T>(
    data: T,
    context: IExecutionContext<T>,
    handlers: Array<IExecutorHandler<any>>,
    interrupter?: IExecutorInterrupter,
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

  protected override executeHandlerWithInitialData(handler: IExecutorHandler<T>) {
    if (!this.initialDataGetter) {
      return;
    }

    const data = this.initialDataGetter();

    this.scheduler.schedule(data, async () => {
      const context = new ExecutionContext(data);
      context.addContextCreators(this.contextCreators as any);

      try {
        await handler(data, context);
      } finally {
        await this.executeHandlers(data, context, this.postHandlers);
      }

      return context;
    });
  }
}
