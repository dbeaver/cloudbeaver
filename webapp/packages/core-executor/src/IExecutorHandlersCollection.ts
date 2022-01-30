/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from './IExecutionContext';
import type { IExecutorHandler } from './IExecutorHandler';

export type ExecutorDataMap<T, TNext> = (data: T, contexts: IExecutionContextProvider<T>) => TNext;
export type ChainLinkType = 'next' | 'before';

export interface IChainLink<T, TResult> {
  executor: IExecutorHandlersCollection<any, TResult>;
  map?: ExecutorDataMap<T, any>;
  type: ChainLinkType;
}

export interface IExecutorHandlersCollection<T = unknown, TResult = any | Promise<any>> {
  readonly handlers: Array<IExecutorHandler<T, TResult>>;
  readonly postHandlers: Array<IExecutorHandler<T, TResult>>;
  readonly chain: Array<IChainLink<T, TResult>>;
  readonly collections: Array<IExecutorHandlersCollection<T, TResult>>;

  setInitialDataGetter(getter: () => T): this;

  before: <TNext>(executor: IExecutorHandlersCollection<TNext, TResult>, map?: ExecutorDataMap<T, TNext>) => this;
  next: <TNext>(executor: IExecutorHandlersCollection<TNext, TResult>, map?: ExecutorDataMap<T, TNext>) => this;
  addCollection: (collection: IExecutorHandlersCollection<T, TResult>) => this;
  hasHandler: (handler: IExecutorHandler<T, TResult>) => boolean;
  addHandler: (handler: IExecutorHandler<T, TResult>) => this;
  removeHandler: (handler: IExecutorHandler<T, TResult>) => void;
  addPostHandler: (handler: IExecutorHandler<T, TResult>) => this;
  removePostHandler: (handler: IExecutorHandler<T, TResult>) => void;

  for: (link: IExecutorHandlersCollection<any, TResult>) => IExecutorHandlersCollection<T, TResult>;
  getLinkHandlers: (
    link: IExecutorHandlersCollection<any, TResult>
  ) => IExecutorHandlersCollection<T, TResult> | undefined;
}
