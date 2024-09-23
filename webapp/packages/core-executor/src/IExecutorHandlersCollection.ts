/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAsyncContextLoader, IContextLoader, IExecutionContextProvider, ISyncContextLoader } from './IExecutionContext.js';
import type { IExecutorHandler } from './IExecutorHandler.js';

export type ExecutorDataFilter<T> = (data: T, contexts: IExecutionContextProvider<T>) => boolean;
export type ExecutorDataMap<T, TNext> = (data: T, contexts: IExecutionContextProvider<T>) => TNext;
export type ChainLinkType = 'next' | 'before';

export interface IChainLink<T, TResult> {
  executor: IExecutorHandlersCollection<any, TResult>;
  map?: ExecutorDataMap<T, any>;
  filter?: ExecutorDataFilter<T>;
  type: ChainLinkType;
}

export interface IExecutorHandlersCollection<T = unknown, TResult = any | Promise<any>> {
  readonly isEmpty: boolean;
  readonly handlers: Array<IExecutorHandler<T, TResult>>;
  readonly postHandlers: Array<IExecutorHandler<T, TResult>>;
  readonly chain: Array<IChainLink<T, TResult>>;
  readonly collections: Array<IExecutorHandlersCollection<T, TResult>>;
  readonly contextCreators: Map<IContextLoader<any, T>, IContextLoader<any, T>>;

  setInitialDataGetter(getter: () => T): this;

  addContextCreator<TContext>(context: ISyncContextLoader<TContext, T>, creator: ISyncContextLoader<TContext, T>): this;
  addContextCreator<TContext>(context: IAsyncContextLoader<TContext, T>, creator: IAsyncContextLoader<TContext, T>): this;

  before: <TNext>(executor: IExecutorHandlersCollection<TNext, TResult>, map?: ExecutorDataMap<T, TNext>, filter?: ExecutorDataFilter<T>) => this;
  removeBefore: (executor: IExecutorHandlersCollection<any, TResult>) => void;
  next: <TNext>(executor: IExecutorHandlersCollection<TNext, TResult>, map?: ExecutorDataMap<T, TNext>, filter?: ExecutorDataFilter<T>) => this;
  removeNext: (executor: IExecutorHandlersCollection<any, TResult>) => void;
  addCollection: (collection: IExecutorHandlersCollection<T, TResult>) => this;
  hasHandler: (handler: IExecutorHandler<T, TResult>) => boolean;
  addHandler: (handler: IExecutorHandler<T, TResult>) => this;
  removeHandler: (handler: IExecutorHandler<T, TResult>) => void;
  addPostHandler: (handler: IExecutorHandler<T, TResult>) => this;
  removePostHandler: (handler: IExecutorHandler<T, TResult>) => void;

  for: (link: IExecutorHandlersCollection<any, TResult>) => IExecutorHandlersCollection<T, TResult>;
  getLinkHandlers: (link: IExecutorHandlersCollection<any, TResult>) => IExecutorHandlersCollection<T, TResult> | undefined;
}
