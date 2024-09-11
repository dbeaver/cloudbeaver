/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';

import { TreeDataTransformer } from './DataTransformers/TreeDataTransformer';
import type { ITreeData } from './ITreeData';

export interface ITreeFilterOptions {
  isNodeMatched?: (nodeId: string, filter: string, isMatched: boolean) => boolean;
}

export interface ITreeFilter {
  filter: string;
  isNodeMatched(treeData: ITreeData, nodeId: string): boolean;
  transformer: TreeDataTransformer<string[]>;
  setFilter(filter: string): void;
}

export function useTreeFilter(options: ITreeFilterOptions = {}): Readonly<ITreeFilter> {
  options = useObjectRef(options);
  return useObservableRef<ITreeFilter>(
    () => ({
      filter: '',
      isNodeMatched(treeData: ITreeData, nodeId: string): boolean {
        if (!this.filter) {
          return true;
        }

        let isNodeMatched = treeData.getNode(nodeId).name.toLowerCase().includes(this.filter.toLowerCase());

        if (options?.isNodeMatched) {
          isNodeMatched = options.isNodeMatched(nodeId, this.filter, isNodeMatched);
        }

        return isNodeMatched || treeData.getChildren(nodeId).length > 0;
      },
      transformer(treeData: ITreeData, nodeId: string, children: string[]): string[] {
        return children.filter(child => this.isNodeMatched(treeData, child));
      },
      setFilter(filter: string): void {
        this.filter = filter;
      },
    }),
    {
      filter: observable.ref,
    },
    false,
    ['setFilter', 'isNodeMatched', 'transformer'],
  );
}
