/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from './IExecutionContext';
import type { IExecutorHandler } from './IExecutorHandler';

export type ExecutorDataMap<T, TNext> = (data: T, contexts: IExecutionContextProvider<T>) => TNext;
export type ChainLinkType = 'next' | 'before';

export interface IChainLink<T> {
  executor: IExecutorHandlersCollection<any>;
  map?: ExecutorDataMap<T, any>;
  type: ChainLinkType;
}

export interface IExecutorHandlersCollection<T = unknown> {
  readonly handlers: Array<IExecutorHandler<T>>;
  readonly postHandlers: Array<IExecutorHandler<T>>;
  readonly chain: Array<IChainLink<T>>;
  readonly collections: Array<IExecutorHandlersCollection<T>>;

  before: <TNext>(executor: IExecutorHandlersCollection<TNext>, map?: ExecutorDataMap<T, TNext>) => this;
  next: <TNext>(executor: IExecutorHandlersCollection<TNext>, map?: ExecutorDataMap<T, TNext>) => this;
  addCollection: (collection: IExecutorHandlersCollection<T>) => this;
  addHandler: (handler: IExecutorHandler<T>) => this;
  removeHandler: (handler: IExecutorHandler<T>) => void;
  addPostHandler: (handler: IExecutorHandler<T>) => this;
  removePostHandler: (handler: IExecutorHandler<T>) => void;

  for: (link: IExecutorHandlersCollection<any>) => IExecutorHandlersCollection<T>;
  getLinkHandlers: (link: IExecutorHandlersCollection<any>) => IExecutorHandlersCollection<T> | undefined;
}
