/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

export interface IUsersTableFiltersOpenContext {
  open: boolean;
  onToggle: () => void;
}

export const UsersTableFiltersOpenContext = createContext<IUsersTableFiltersOpenContext | null>(null);
