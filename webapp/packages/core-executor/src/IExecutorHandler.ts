/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IContextProvider } from './ExecutionContext';

export type IExecutorHandler<T> = (
  contexts: IContextProvider<T>,
  data: T
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => void | false | Promise<void | false>;
