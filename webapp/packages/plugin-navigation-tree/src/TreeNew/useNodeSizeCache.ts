/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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
    }),
    {},
  );
}
