/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTree } from './useElementsTree.js';

export function isLeaf(node: NavNode, children: string[] | undefined, tree: IElementsTree | undefined, outdated: boolean): boolean {
  return (
    (!tree?.settings?.showTableContents &&
      node.objectFeatures.includes(EObjectFeature.entity) &&
      !node.objectFeatures.includes(EObjectFeature.keyValue)) ||
    !node.hasChildren ||
    (children?.length === 0 && !outdated)
  );
}
