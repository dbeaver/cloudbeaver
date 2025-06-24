/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';

import type { TreeDataTransformer } from './DataTransformers/TreeDataTransformer.js';
import type { ITreeData } from './ITreeData.js';

export interface ITreeFilterOptions {
  isNodeMatched?: (nodeId: string, filter: string, isMatched: boolean) => boolean;
}

export interface ITreeFilter {
  filter: string;
  isNodeMatched(treeData: ITreeData, nodeId: string): boolean;
  transformer: TreeDataTransformer<string[]>;
  setFilter(filter: string, treeData?: ITreeData | null): void;
}

function updateTreeNodes(treeData: ITreeData, updateFn: (nodeId: string) => void) {
  const visitedNodes = new Set<string>();
  const nodesToVisit = [treeData.rootId];

  while (nodesToVisit.length > 0) {
    const nodeId = nodesToVisit.pop()!;

    if (visitedNodes.has(nodeId)) {
      continue;
    }
    visitedNodes.add(nodeId);

    updateFn(nodeId);

    const children = treeData.getChildren(nodeId);
    nodesToVisit.push(...children);
  }
}

export function useTreeFilter(options: ITreeFilterOptions = {}): Readonly<ITreeFilter> {
  options = useObjectRef(options);
  const expandedStateCache = new Map<string, boolean>();
  function cacheExpandedState(treeData: ITreeData): void {
    expandedStateCache.clear();

    updateTreeNodes(treeData, nodeId => {
      const state = treeData.getState(nodeId);
      if (state.expanded) {
        expandedStateCache.set(nodeId, true);
      }
    });
  };

  function restoreExpandedState(treeData: ITreeData): void {
    updateTreeNodes(treeData, nodeId => {
      if (nodeId !== treeData.rootId) {
        treeData.updateState(nodeId, { expanded: false });
      }
    });

    for (const [nodeId, expanded] of expandedStateCache) {
      if (expanded) {
        treeData.updateState(nodeId, { expanded: true });
      }
    }

    expandedStateCache.clear();
  };

  return useObservableRef<ITreeFilter>(
    () => ({
      filter: '',
      isNodeMatched(treeData: ITreeData, nodeId: string): boolean {
        const filter = this.filter.trim();
        if (!filter) {
          return true;
        }

        let isNodeMatched = treeData.getNode(nodeId).name.toLowerCase().includes(filter.toLowerCase());

        if (options?.isNodeMatched) {
          isNodeMatched = options.isNodeMatched(nodeId, filter, isNodeMatched);
        }

        if (isNodeMatched) {
          let parent = treeData.getParent(nodeId);
          while (parent) {
            treeData.updateState(parent, { expanded: true });
            parent = treeData.getParent(parent);
          }
        }

        return isNodeMatched || treeData.getChildren(nodeId).length > 0;
      },
      transformer(treeData: ITreeData, nodeId: string, children: string[]): string[] {
        const filter = this.filter.trim();
        if (!filter) {
          return children;
        }

        let parentMatches = treeData.getNode(nodeId).name.toLowerCase().includes(filter.toLowerCase());

        if (options?.isNodeMatched) {
          parentMatches = options.isNodeMatched(nodeId, filter, parentMatches);
        }

        if (parentMatches) {
          return children;
        }

        return children.filter(child => this.isNodeMatched(treeData, child));
      },
      setFilter(filter: string, treeData?: ITreeData | null): void {
        const newFilter = filter.trim();
        const oldFilter = this.filter.trim();

        if (!oldFilter && newFilter && treeData) {
          cacheExpandedState(treeData);
        }

        this.filter = filter;

        if (oldFilter && !newFilter && treeData) {
          restoreExpandedState(treeData);
        }
      },
    }),
    {
      filter: observable.ref,
    },
    false,
    ['setFilter', 'isNodeMatched', 'transformer'],
  );
}
