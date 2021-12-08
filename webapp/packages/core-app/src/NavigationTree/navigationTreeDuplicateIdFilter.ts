/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import type { NavNodeViewService } from '../shared/NodesManager/NavNodeView/NavNodeViewService';
import type { IElementsTreeFilter } from './useElementsTree';

export function navigationTreeDuplicateFilter(
  navNodeViewService: NavNodeViewService,
): IElementsTreeFilter {
  return (node: NavNode, children: string[]) => {
    const nextChildren: string[] = [];
    const duplicates: string[] = [];

    for (const child of children) {
      if (nextChildren.includes(child)) {
        if (!duplicates.includes(child)) {
          duplicates.push(child);
          nextChildren.splice(nextChildren.indexOf(child), 1);
        }
      } else {
        nextChildren.push(child);
      }
    }

    untracked(() => {
      navNodeViewService.logDuplicates(node.id, duplicates);
    });

    return nextChildren;
  };
}
