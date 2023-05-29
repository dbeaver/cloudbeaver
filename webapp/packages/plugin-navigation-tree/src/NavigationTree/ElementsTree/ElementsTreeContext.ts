/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IFolderExplorerContext } from '@cloudbeaver/core-blocks';

import type { NavTreeControlComponent } from './NavigationNodeComponent';
import type { IElementsTree } from './useElementsTree';

export interface IElementsTreeContext {
  tree: IElementsTree;
  folderExplorer: IFolderExplorerContext;
  selectionTree: boolean;
  control?: NavTreeControlComponent;
  getTreeRoot: () => HTMLDivElement | null;
}

export const ElementsTreeContext = createContext<IElementsTreeContext | null>(null);
