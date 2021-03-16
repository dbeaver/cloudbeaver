/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import type { INodeState } from './ElementsTree';

export interface ITreeContext {
  state?: MetadataMap<string, INodeState>;
  getMetadata?: (node: NavNode) => INodeState;
  selectionTree: boolean;
  control?: React.FC<{
    node: NavNode;
  }>;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, multiple: boolean) => void;
  isSelected?: (node: NavNode) => boolean;
  onFilter?: (node: NavNode, value: string) => void;
}

export const TreeContext = createContext<ITreeContext | null>(null);
