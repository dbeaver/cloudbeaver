/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface IDataGridSelectionContext {
  selectedCells: Map<number, number[]>;
  select: (key: string, rowIdx: number, multiple: boolean, range: boolean) => void;
  isSelected: (key: string, rowIdx: number) => boolean;
}

export const DataGridSelectionContext = createContext<IDataGridSelectionContext | null>(null);
