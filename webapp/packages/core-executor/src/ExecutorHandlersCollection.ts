/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutorHandler } from './IExecutorHandler';
import type { ExecutorDataMap, IChainLink, IExecutorHandlersCollection } from './IExecutorHandlersCollection';

export class ExecutorHandlersCollection<T = unknown> implements IExecutorHandlersCollection<T> {
  handlers: Array<IExecutorHandler<T>> = [];
  postHandlers: Array<IExecutorHandler<T>> = [];
  chain: Array<IChainLink<T>> = [];
  readonly collections: Array<IExecutorHandlersCollection<T>>;
  private links: Map<IExecutorHandlersCollection<any>, IExecutorHandlersCollection<T>>;

  constructor() {
    this.links = new Map();
    this.collections = [];
  }

  addCollection(collection: IExecutorHandlersCollection<T>): this {
    this.collections.push(collection);
    return this;
  }

  for(link: IExecutorHandlersCollection<any>): IExecutorHandlersCollection<T> {
    if (!this.links.has(link)) {
      this.links.set(link, new ExecutorHandlersCollection());
    }

    return this.links.get(link)!;
  }

  getLinkHandlers(link: IExecutorHandlersCollection<any>): IExecutorHandlersCollection<T> | undefined {
    return this.links.get(link);
  }

  before<TNext>(executor: IExecutorHandlersCollection<TNext>, map?: ExecutorDataMap<T, TNext>): this {
    this.chain.push({
      executor,
      map,
      type: 'before',
    });
    return this;
  }

  next<TNext>(executor: IExecutorHandlersCollection<TNext>, map?: ExecutorDataMap<T, TNext>): this {
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
}
