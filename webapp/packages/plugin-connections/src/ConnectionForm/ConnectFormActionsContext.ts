/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IConnectionFormState } from './IConnectionFormProps.js';

export interface IConnectionFormActionsContext {
  save: IConnectionFormState['save'];
  test: IConnectionFormState['test'];
}

export const ConnectionFormActionsContext = createContext<IConnectionFormActionsContext | null>(null);
