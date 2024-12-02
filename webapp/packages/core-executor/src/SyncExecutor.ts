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
import type { IExecutorHandler } from './IExecutorHandler.js';
import type { ChainLinkType, IExecutorHandlersCollection } from './IExecutorHandlersCollection.js';
import type { ISyncExecutor } from './ISyncExecutor.js';

export class SyncExecutor<T = void> extends ExecutorHandlersCollection<T> implements ISyncExecutor<T> {
  constructor(private readonly defaultData: T | null = null) {
    super();
  }

  execute(
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>,
  ): IExecutionContextProvider<T> {
    if (context && ExecutorInterrupter.isInterrupted(context)) {
      return context;
    }

    data = this.getDefaultData(data);

    if (!context) {
      context = new ExecutionContext(data);
    }
    return this.executeHandlersCollection<T>(this, data, context, [scope || []].flat());
  }

  executeScope(
    data: T,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>,
    context?: IExecutionContext<T>,
  ): IExecutionContextProvider<T> {
    if (context && ExecutorInterrupter.isInterrupted(context)) {
      return context;
    }

    data = this.getDefaultData(data);

    if (!context) {
      context = new ExecutionContext(data);
    }
    return this.executeHandlersCollection<T>(this, data, context, [scope || []].flat());
  }

  private executeHandlersCollection<T>(
    collection: IExecutorHandlersCollection<T>,
    data: T,
    context: IExecutionContext<T>,
    scoped: Array<IExecutorHandlersCollection<T>>,
  ): IExecutionContextProvider<T> {
    scoped = [...collection.collections, ...scoped];

    context.addContextCreators(collection.contextCreators as any);

    for (const scope of scoped) {
      context.addContextCreators(scope.contextCreators as any);
    }

    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);

    this.executeChain(collection, data, context, 'before');

    for (const scope of scoped) {
      this.executeChain(scope, data, context, 'before');
    }

    try {
      this.executeHandlers(data, context, collection.handlers, interrupter);

      for (const scope of scoped) {
        this.executeHandlers(data, context, scope.handlers, interrupter);
      }
    } catch (exception: any) {
      const exceptionContext = context.getContext(executionExceptionContext);
      exceptionContext.setException(exception);
      throw exception;
    } finally {
      this.executeHandlers(data, context, collection.postHandlers);

      for (const scope of scoped) {
        this.executeHandlers(data, context, scope.postHandlers);
      }
    }

    this.executeChain(collection, data, context, 'next');

    for (const scope of scoped) {
      this.executeChain(scope, data, context, 'next');
    }
    return context;
  }

  private executeChain<T>(collection: IExecutorHandlersCollection<T>, data: T, context: IExecutionContext<T>, type: ChainLinkType): void {
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

      this.executeHandlersCollection(link.executor, mappedData, chainedContext, [collection.getLinkHandlers(link.executor) || []].flat());
    }
  }

  private executeHandlers<T>(
    data: T,
    context: IExecutionContext<T>,
    handlers: Array<IExecutorHandler<any>>,
    interrupter?: IExecutorInterrupter,
  ): void {
    for (const handler of handlers) {
      if (interrupter?.interrupted) {
        return;
      }
      handler(data, context);
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
    const context = new ExecutionContext(data);

    context.addContextCreators(this.contextCreators as any);

    try {
      handler(data, context);
    } finally {
      this.executeHandlers(data, context, this.postHandlers);
    }
  }
}
