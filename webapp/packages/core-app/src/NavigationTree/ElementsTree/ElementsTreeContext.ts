/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { IFolderExplorerContext } from '@cloudbeaver/core-blocks';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import type { NavTreeControlComponent } from './NavigationNodeComponent';
import type { IElementsTree } from './useElementsTree';

export interface IElementsTreeContext {
  tree: IElementsTree;
  folderExplorer: IFolderExplorerContext;
  selectionTree: boolean;
  control?: NavTreeControlComponent;
  onOpen?: (node: NavNode, path: string[], leaf: boolean) => Promise<void> | void;
  onClick?: (node: NavNode, path: string[], leaf: boolean) => Promise<void> | void;
}

export const ElementsTreeContext = createContext<IElementsTreeContext | null>(null);
