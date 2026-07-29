/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

interface IAIChatContext {
  disabled: boolean;
  connectionKey?: IConnectionInfoParams;
  catalog?: string;
  schema?: string;
}

export const AIChatContext = createContext<IAIChatContext>({ disabled: false });
