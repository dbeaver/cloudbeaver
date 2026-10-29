/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, useContext } from 'react';

import type { ITableSelection } from '@cloudbeaver/plugin-data-grid';

import type { useTeamsTable } from './useTeamsTable.js';

interface ITeamsTableContext {
  selection: ITableSelection;
  table: ReturnType<typeof useTeamsTable>;
}

export const TeamsTableContext = createContext<ITeamsTableContext | null>(null);

export function useTeamsTableContext(): ITeamsTableContext {
  const context = useContext(TeamsTableContext);

  if (!context) {
    throw new Error('Teams table context was not provided');
  }

  return context;
}
