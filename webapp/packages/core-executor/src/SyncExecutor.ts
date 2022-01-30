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
import type { IExecutorHandler } from './IExecutorHandler';
import type { ChainLinkType, IExecutorHandlersCollection } from './IExecutorHandlersCollection';
import type { ISyncExecutor } from './ISyncExecutor';

export class SyncExecutor<T = void> extends ExecutorHandlersCollection<T> implements ISyncExecutor<T> {
  constructor(
    private readonly defaultData: T | null = null
  ) {
    super();
  }

  execute(
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>
  ): IExecutionContextProvider<T> {
    data = this.getDefaultData(data);

    if (!context) {
      context = new ExecutionContext(data);
    }
    return this.executeHandlersCollection<T>(this, data, context, flat([(scope || [])]));
  }

  executeScope(
    data: T,
    scope?: IExecutorHandlersCollection<T> | Array<IExecutorHandlersCollection<T>>,
    context?: IExecutionContext<T>
  ): IExecutionContextProvider<T> {
    data = this.getDefaultData(data);

    if (!context) {
      context = new ExecutionContext(data);
    }
    return this.executeHandlersCollection<T>(this, data, context, flat([(scope || [])]));
  }

  private executeHandlersCollection<T>(
    collection: IExecutorHandlersCollection<T>,
    data: T,
    context: IExecutionContext<T>,
    scoped: Array<IExecutorHandlersCollection<T>>
  ): IExecutionContextProvider<T> {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);
    scoped = [...collection.collections, ...scoped];

    this.executeChain(collection, data, context, 'before');

    for (const scope of scoped) {
      this.executeChain(scope, data, context, 'before');
    }

    try {
      this.executeHandlers(data, context, collection.handlers, interrupter);

      for (const scope of scoped) {
        this.executeHandlers(data, context, scope.handlers, interrupter);
      }
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

  private executeChain<T>(
    collection: IExecutorHandlersCollection<T>,
    data: T,
    context: IExecutionContext<T>,
    type: ChainLinkType
  ): void {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);

    for (const link of collection.chain.filter(link => link.type === type)) {
      if (interrupter.interrupted) {
        return;
      }

      const mappedData = link.map ? link.map(data, context) : data;
      const chainedContext = new ExecutionContext(mappedData, context);

      this.executeHandlersCollection(
        link.executor,
        mappedData,
        chainedContext,
        flat([(collection.getLinkHandlers(link.executor) || [])])
      );
    }
  }

  private executeHandlers<T>(
    data: T,
    context: IExecutionContext<T>,
    handlers: Array<IExecutorHandler<any>>,
    interrupter?: IExecutorInterrupter
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

  protected executeHandlerWithInitialData(handler: IExecutorHandler<T>) {
    if (!this.initialDataGetter) {
      return;
    }

    const data = this.initialDataGetter();
    const context = new ExecutionContext(data);

    try {
      handler(data, context);
    } finally {
      this.executeHandlers(data, context, this.postHandlers);
    }
  }
}
