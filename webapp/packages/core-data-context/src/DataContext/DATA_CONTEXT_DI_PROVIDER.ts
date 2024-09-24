/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';

import { createDataContext } from './createDataContext.js';

export const DATA_CONTEXT_DI_PROVIDER = createDataContext<IServiceProvider>('DI Provider');
