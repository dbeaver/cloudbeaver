/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IContextProvider } from './ExecutionContext';

export interface IExecutorHandler<T> {
  (contexts: IContextProvider<T>, data: T): void | false | Promise<void | false>;
}
