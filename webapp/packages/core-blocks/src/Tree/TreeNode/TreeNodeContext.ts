/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

export interface ITreeNodeContext {
  expanded: boolean;
  loading: boolean;
  selected: boolean;
  leaf: boolean;
  select: (multiple?: boolean) => boolean;
  expand: () => void;
  open: () => void;
}

export const TreeNodeContext = createContext<ITreeNodeContext | null>(null);
