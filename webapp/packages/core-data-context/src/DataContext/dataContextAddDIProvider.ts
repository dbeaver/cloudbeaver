/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { IServiceProvider } from '@cloudbeaver/core-di';

import { DATA_CONTEXT_DI_PROVIDER } from './DATA_CONTEXT_DI_PROVIDER.js';
import type { IDataContext } from './IDataContext.js';

export function dataContextAddDIProvider(context: IDataContext, serviceProvider: IServiceProvider, id: string): IDataContext {
  context.set(DATA_CONTEXT_DI_PROVIDER, serviceProvider, id);
  return context;
}
