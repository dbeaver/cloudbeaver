/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { untracked } from 'mobx';

import type { NavNodeViewService } from '../NodesManager/NavNodeView/NavNodeViewService.js';
import type { IElementsTreeFilter } from './ElementsTree/useElementsTree.js';

export function navigationTreeDuplicateFilter(navNodeViewService: NavNodeViewService): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    const { nodes, duplicates } = navNodeViewService.filterDuplicates(children);

    untracked(() => {
      navNodeViewService.logDuplicates(node.id, duplicates);
    });

    return nodes;
  };
}
