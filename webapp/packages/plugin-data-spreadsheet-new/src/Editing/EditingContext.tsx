/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { Position } from 'react-data-grid/lib/types';

export interface IEditingContext {
  edit: (position: Position, key?: string) => void;
  closeEditor: (position: Position) => void;
  close: () => void;
  isEditing: (position: Position) => boolean;
}

export const EditingContext = createContext<IEditingContext | null>(null);
