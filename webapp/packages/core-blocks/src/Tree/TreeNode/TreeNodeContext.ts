/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface ITreeNodeContext {
  processing: boolean;
  expanded: boolean;
  loading: boolean;
  selected: boolean;
  leaf: boolean;
  select: (multiple?: boolean, nested?: boolean) => Promise<void>;
  filter: (value: string) => Promise<void>;
  filterValue: string;
  expand: () => Promise<void>;
  open: () => Promise<void>;
}

export const TreeNodeContext = createContext<ITreeNodeContext | null>(null);
