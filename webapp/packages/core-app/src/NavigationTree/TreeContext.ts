/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import { NavNode } from '../shared/NodesManager/EntityTypes';

export interface ITreeContext {
  control?: React.FC<{
    node: NavNode;
  }>;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, multiple: boolean) => boolean;
  isSelected?: (node: NavNode) => boolean;
}

export const TreeContext = createContext<ITreeContext | null>(null);
