/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext';
import type { IExecutorHandlersCollection } from './IExecutorHandlersCollection';

export interface IExecutor<T = void> extends IExecutorHandlersCollection<T> {
  readonly executing: boolean;

  execute: (
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T>
  ) => Promise<IExecutionContextProvider<T>>;

  executeScope: (
    data: T,
    scope?: IExecutorHandlersCollection<T>,
    context?: IExecutionContext<T>
  ) => Promise<IExecutionContextProvider<T>>;
}
