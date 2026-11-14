/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IElementsTreeFilter } from './ElementsTree/useElementsTree.js';
import type { NavigationTreeService } from './NavigationTreeService.js';

/** Adds virtual children registered in NavigationTreeService before the server nodes */
export function navigationTreeVirtualChildrenFilter(navigationTreeService: NavigationTreeService): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    if (filter) {
      return children;
    }

    const virtualChildren = navigationTreeService.getVirtualChildren(node);

    if (virtualChildren.length === 0) {
      return children;
    }

    return [...virtualChildren, ...children];
  };
}
