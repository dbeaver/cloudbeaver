/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IExecutorHandler } from './IExecutorHandler';
import type { ExecutorDataMap, IChainLink, IExecutorHandlersCollection } from './IExecutorHandlersCollection';

export class ExecutorHandlersCollection<T = unknown, TResult = any | Promise<any>>
implements IExecutorHandlersCollection<T, TResult> {
  handlers: Array<IExecutorHandler<T, TResult>> = [];
  postHandlers: Array<IExecutorHandler<T, TResult>> = [];
  chain: Array<IChainLink<T, TResult>> = [];
  readonly collections: Array<IExecutorHandlersCollection<T, TResult>>;
  protected initialDataGetter: (() => T) | null;
  private readonly links: Map<IExecutorHandlersCollection<any, TResult>, IExecutorHandlersCollection<T, TResult>>;

  constructor() {
    this.links = new Map();
    this.collections = [];
    this.initialDataGetter = null;

    makeObservable<this, 'links'>(this, {
      handlers: observable.shallow,
      postHandlers: observable.shallow,
      chain: observable.shallow,
      collections: observable.shallow,
      links: observable.shallow,
    });
  }

  setInitialDataGetter(getter: (() => T) | null): this {
    this.initialDataGetter = getter;
    return this;
  }

  addCollection(collection: IExecutorHandlersCollection<T, TResult>): this {
    this.collections.push(collection);
    return this;
  }

  for(link: IExecutorHandlersCollection<any, TResult>): IExecutorHandlersCollection<T, TResult> {
    if (!this.links.has(link)) {
      this.links.set(link, new ExecutorHandlersCollection());
    }

    return this.links.get(link)!;
  }

  getLinkHandlers(
    link: IExecutorHandlersCollection<any, TResult>
  ): IExecutorHandlersCollection<T, TResult> | undefined {
    return this.links.get(link);
  }

  before<TNext>(executor: IExecutorHandlersCollection<TNext, TResult>, map?: ExecutorDataMap<T, TNext>): this {
    this.chain.push({
      executor,
      map,
      type: 'before',
    });
    return this;
  }

  next<TNext>(executor: IExecutorHandlersCollection<TNext, TResult>, map?: ExecutorDataMap<T, TNext>): this {
    this.chain.push({
      executor,
      map,
      type: 'next',
    });
    return this;
  }

  hasHandler(handler: IExecutorHandler<T, TResult>): boolean {
    return this.handlers.includes(handler);
  }

  addHandler(handler: IExecutorHandler<T, TResult>): this {
    this.handlers.push(handler);
    this.executeHandlerWithInitialData(handler);
    return this;
  }

  removeHandler(handler: IExecutorHandler<T, TResult>): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  addPostHandler(handler: IExecutorHandler<T, TResult>): this {
    this.postHandlers.push(handler);
    return this;
  }

  removePostHandler(handler: IExecutorHandler<T, TResult>): void {
    this.postHandlers = this.postHandlers.filter(h => h !== handler);
  }

  protected executeHandlerWithInitialData(handler: IExecutorHandler<T, TResult>) {
    if (!this.initialDataGetter) {
      return;
    }
  }
}
