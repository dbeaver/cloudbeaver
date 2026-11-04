/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IElementsTreeCustomRenderer } from '../ElementsTree/useElementsTree.js';
import { NAVIGATION_TREE_CONNECTION_GROUPS } from './navigationTreeConnectionGroupFilter.js';
import { ManageableGroup } from './ManageableGroup.js';
import { UnManageableGroup } from './UnManageableGroup.js';

export const navigationTreeConnectionGroupRenderers: IElementsTreeCustomRenderer[] = [
  {
    matches: nodeId => nodeId === NAVIGATION_TREE_CONNECTION_GROUPS.manageable,
    Component: ManageableGroup,
  },
  {
    matches: nodeId => nodeId === NAVIGATION_TREE_CONNECTION_GROUPS.unmanageable,
    Component: UnManageableGroup,
  },
];
