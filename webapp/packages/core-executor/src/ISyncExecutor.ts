/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContext, IExecutionContextProvider } from './IExecutionContext';
import type { IExecutorHandlersCollection } from './IExecutorHandlersCollection';

export interface ISyncExecutor<T = void> extends IExecutorHandlersCollection<T> {
  execute: (
    data: T,
    context?: IExecutionContext<T>,
    scope?: IExecutorHandlersCollection<T>
  ) => IExecutionContextProvider<T>;

  executeScope: (
    data: T,
    scope?: IExecutorHandlersCollection<T>,
    context?: IExecutionContext<T>
  ) => IExecutionContextProvider<T>;
}
