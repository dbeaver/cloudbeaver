/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface ITableItemContext {
  item: any;
  selectDisabled: boolean;
  isSelected: () => boolean;
  isExpanded: () => boolean;
}

export const TableItemContext = createContext<ITableItemContext | undefined>(undefined);
