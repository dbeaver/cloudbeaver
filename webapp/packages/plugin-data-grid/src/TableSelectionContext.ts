/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface ITableSelection {
  readonly list: string[];
  readonly selected: string[];
  state: Set<string>;
  keys: string[];
  select(id: string): void;
  selectRoot(): void;
  clear(): void;
}

export const TableSelectionContext = createContext<ITableSelection | null>(null);
