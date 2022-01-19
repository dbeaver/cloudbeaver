/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface IEditingContext {
  readonly readonly: boolean;
  edit: (position: CellPosition, code?: string, key?: string) => void;
  closeEditor: (position: CellPosition) => void;
  close: () => void;
  isEditorActive: () => boolean;
  isEditing: (position: CellPosition) => boolean;
}

export interface CellPosition {
  idx: number;
  rowIdx: number;
}

export const EditingContext = createContext<IEditingContext>(undefined as any);
