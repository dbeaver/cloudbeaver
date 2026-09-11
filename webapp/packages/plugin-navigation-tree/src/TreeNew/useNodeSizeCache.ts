/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, type IComputedValue } from 'mobx';
import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { ITreeData } from './ITreeData.js';
import type { ITree } from './useTree.js';

export interface INodeSizeCache {
  getSize(id: string): number;
  getOffset(id: string): number;
}

export function useNodeSizeCache(tree: ITree, treeData: ITreeData): INodeSizeCache {
  const [sizeRangeCache] = useState(
    () =>
      new MetadataMap<string, IComputedValue<number>>((id, metadata) =>
        computed(() => {
          let size = tree.getNodeHeight(id);
          const expanded = treeData.getState(id).expanded;

          if (expanded) {
            const children = treeData.getChildren(id);

            for (const child of children) {
              size += metadata.get(child).get();
            }
          }

          return size;
        }),
      ),
  );

  return useObjectRef(
    () => ({
      getSize(id: string): number {
        return sizeRangeCache.get(id).get();
      },
      getOffset(id: string): number {
        let offset = 0;
        let currentId = id;
        let parentId = treeData.getParent(currentId);

        while (parentId && currentId !== treeData.rootId) {
          const siblings = treeData.getChildren(parentId);

          for (const sibling of siblings) {
            if (sibling === currentId) {
              break;
            }

            offset += this.getSize(sibling);
          }

          if (parentId !== treeData.rootId) {
            offset += tree.getNodeHeight(parentId);
          }

          currentId = parentId;
          parentId = treeData.getParent(currentId);
        }

        return offset;
      },
    }),
    {},
  );
}
