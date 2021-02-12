/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext';
import type { IExecutor } from './IExecutor';
import type { IExecutorHandler } from './IExecutorHandler';

export type ChainLinkType = 'next' | 'before';

export interface IChainLink<T> {
  executor: IExecutor<any>;
  map?: (data: T) => any;
  type: ChainLinkType;
}

export interface IExecutorHandlersCollection<T = unknown> {
  readonly handlers: Array<IExecutorHandler<T>>;
  readonly postHandlers: Array<IExecutorHandler<T>>;
  readonly chain: Array<IChainLink<T>>;

  before: <TNext extends T>(executor: IExecutor<TNext>, map?: (data: T) => TNext) => this;
  next: <TNext extends T>(executor: IExecutor<TNext>, map?: (data: T) => TNext) => this;
  execute: (
    data: T,
    context: IExecutionContext<T>,
    scoped?: IExecutorHandlersCollection<T>
  ) => Promise<IExecutionContextProvider<T>>;
  addHandler: (handler: IExecutorHandler<T>) => this;
  removeHandler: (handler: IExecutorHandler<T>) => void;
  addPostHandler: (handler: IExecutorHandler<T>) => this;
  removePostHandler: (handler: IExecutorHandler<T>) => void;

  for: (link: IExecutor<any>) => IExecutorHandlersCollection<T>;
  getLinkHandlers: (
    link: IExecutor<any>,
    scoped?: IExecutorHandlersCollection<T>
  ) => IExecutorHandlersCollection<T> | undefined;
}
