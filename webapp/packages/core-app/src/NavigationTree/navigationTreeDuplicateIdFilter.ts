/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import type { NavNodeViewService } from '../shared/NodesManager/NavNodeView/NavNodeViewService';
import type { IElementsTreeFilter } from './ElementsTree/useElementsTree';

export function navigationTreeDuplicateFilter(
  navNodeViewService: NavNodeViewService,
): IElementsTreeFilter {
  return (filter: string, node: NavNode, children: string[]) => {
    const { nodes, duplicates } = navNodeViewService.filterDuplicates(children);

    untracked(() => {
      navNodeViewService.logDuplicates(node.id, duplicates);
    });

    return nodes;
  };
}
