/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ExecutionContext } from './ExecutionContext';
import { ExecutorInterrupter, IExecutorInterrupter } from './ExecutorInterrupter';
import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext';
import type { IExecutor } from './IExecutor';
import type { IExecutorHandler } from './IExecutorHandler';
import type { ChainLinkType, IChainLink, IExecutorHandlersCollection } from './IExecutorHandlersCollection';

export class ExecutorHandlersCollection<T = unknown> implements IExecutorHandlersCollection<T> {
  handlers: Array<IExecutorHandler<T>> = [];
  postHandlers: Array<IExecutorHandler<T>> = [];
  chain: Array<IChainLink<T>> = [];
  private links: Map<IExecutor<any>, ExecutorHandlersCollection<T>>;

  constructor() {
    this.links = new Map();
  }

  for(link: IExecutor<any>): IExecutorHandlersCollection<T> {
    if (!this.links.has(link)) {
      this.links.set(link, new ExecutorHandlersCollection());
    }

    return this.links.get(link)!;
  }

  getLinkHandlers(
    link: IExecutor<any>,
    scoped?: IExecutorHandlersCollection<T>
  ): IExecutorHandlersCollection<T> | undefined {
    return this.links.get(link) || scoped?.getLinkHandlers(link, scoped.getLinkHandlers(link));
  }

  before<TNext extends T>(executor: IExecutor<TNext>, map?: (data: T) => TNext): this {
    this.chain.push({
      executor,
      map,
      type: 'before',
    });
    return this;
  }

  next<TNext extends T>(executor: IExecutor<TNext>, map?: (data: T) => TNext): this {
    this.chain.push({
      executor,
      map,
      type: 'next',
    });
    return this;
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

  async execute(
    data: T,
    context: IExecutionContext<T>,
    scoped?: IExecutorHandlersCollection<T>
  ): Promise<IExecutionContextProvider<T>> {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);

    await this.executeChain(data, context, 'before', scoped);

    try {
      await this.executeHandlers(data, context, this.handlers, interrupter);

      if (scoped) {
        await this.executeHandlers(data, context, scoped.handlers, interrupter);
      }
    } finally {
      await this.executeHandlers(data, context, this.postHandlers);

      if (scoped) {
        await this.executeHandlers(data, context, scoped.postHandlers);
      }
    }

    await this.executeChain(data, context, 'next', scoped);
    return context;
  }

  private async executeChain(
    data: T,
    context: IExecutionContext<T>,
    type: ChainLinkType,
    scoped?: IExecutorHandlersCollection<T>
  ): Promise<void> {
    const interrupter = context.getContext(ExecutorInterrupter.interruptContext);
    const chain = [...this.chain, ...(scoped?.chain || [])];

    for (const link of chain.filter(link => link.type === type)) {
      if (interrupter.interrupted) {
        return;
      }

      const mappedData = link.map ? link.map(data) : data;
      const chainedContext = new ExecutionContext(mappedData, context);
      await link.executor.execute(mappedData, chainedContext, this.getLinkHandlers(link.executor, scoped));
    }
  }

  private async executeHandlers(
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
}
