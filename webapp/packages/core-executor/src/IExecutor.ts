/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from './ExecutionContext';
import type { IExecutorHandler } from './IExecutorHandler';

export interface IExecutor<T = unknown> {
  execute: (data: T) => Promise<IExecutionContextProvider<T>>;
  addHandler: (handler: IExecutorHandler<T>) => this;
  removeHandler: (handler: IExecutorHandler<T>) => void;
  addPostHandler: (handler: IExecutorHandler<T>) => this;
  removePostHandler: (handler: IExecutorHandler<T>) => void;
}
