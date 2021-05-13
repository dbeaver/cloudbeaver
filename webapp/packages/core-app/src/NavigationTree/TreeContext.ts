/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import type { IElementsTree } from './useElementsTree';

export interface ITreeContext {
  tree: IElementsTree;
  selectionTree: boolean;
  control?: React.FC<{
    node: NavNode;
  }>;
  onOpen?: (node: NavNode) => Promise<void> | void;
}

export const TreeContext = createContext<ITreeContext | null>(null);
