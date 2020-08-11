/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface ITableContext {
  selectedItems: Map<any, boolean>;
  expandedItems: Map<any, boolean>;
  setItemSelect: (item: any, state: boolean) => void;
  setItemExpand: (item: any, state: boolean) => void;
  clearSelection: () => void;
  collapse: () => void;
}

export const TableContext = createContext<ITableContext | undefined>(undefined);
