/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IContextProvider } from './ExecutionContext';
import { IExecutorHandler } from './IExecutorHandler';

export interface IExecutor<T> {
  execute(data: T): Promise<IContextProvider<T>>;
  addHandler(handler: IExecutorHandler<T>): void;
  removeHandler(handler: IExecutorHandler<T>): void;
  addPostHandler(handler: IExecutorHandler<T>): void;
  removePostHandler(handler: IExecutorHandler<T>): void;
}
