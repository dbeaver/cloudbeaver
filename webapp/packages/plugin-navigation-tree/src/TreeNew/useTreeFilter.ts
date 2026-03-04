/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { useMemo } from 'react';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';

import type { TreeDataTransformer } from './DataTransformers/TreeDataTransformer.js';
import type { ITreeData } from './ITreeData.js';
import type { INodeState } from './INodeState.js';
import type { ITreeSettings } from './useTreeSettings.js';

export interface ITreeFilterOptions {
  isNodeMatched?: (nodeId: string, filter: string, isMatched: boolean) => boolean;
}

export interface ITreeFilter {
  filter: string;
  isNodeMatched(treeData: ITreeData, nodeId: string): boolean;
  transformer: TreeDataTransformer<string[]>;
  stateTransformer: TreeDataTransformer<INodeState>;
  setFilter(filter: string): void;
}

export interface ITreeFilterState {
  enabled: boolean;
  childrenTransformers: Array<TreeDataTransformer<string[]>>;
  stateTransformers: Array<TreeDataTransformer<INodeState>>;
  toolbarFilter: ITreeFilter | undefined;
}

export type ITreeFilterWithState = Readonly<ITreeFilter & ITreeFilterState>;

export const TREE_SETTINGS_FILTER_ENABLED = 'tree.filter.enabled';

export function useTreeFilterState(
  treeFilter: Readonly<ITreeFilter>,
  settings?: ITreeSettings,
  enabledKey: string = TREE_SETTINGS_FILTER_ENABLED,
): ITreeFilterState {
  const enabled = settings?.get<boolean>(enabledKey) ?? true;

  const childrenTransformers = useMemo(() => (enabled ? [treeFilter.transformer] : []), [enabled, treeFilter]);
  const stateTransformers = useMemo(() => (enabled ? [treeFilter.stateTransformer] : []), [enabled, treeFilter]);

  return {
    enabled,
    childrenTransformers,
    stateTransformers,
    toolbarFilter: enabled ? treeFilter : undefined,
  };
}

function useTreeFilterBase(options: ITreeFilterOptions = {}): Readonly<ITreeFilter> {
  options = useObjectRef(options);
  const matchCache = new Map<string, boolean>();

  function matchesOrHasMatchingDescendant(
    treeData: ITreeData,
    nodeId: string,
    filter: string,
    matchFn: (treeData: ITreeData, nodeId: string) => boolean,
  ): boolean {
    const cacheKey = `${nodeId}:${filter}`;
    if (matchCache.has(cacheKey)) {
      return matchCache.get(cacheKey)!;
    }

    if (matchFn(treeData, nodeId)) {
      matchCache.set(cacheKey, true);
      return true;
    }

    const children = treeData.getUnfilteredChildren(nodeId);
    for (const childId of children) {
      if (matchesOrHasMatchingDescendant(treeData, childId, filter, matchFn)) {
        matchCache.set(cacheKey, true);
        return true;
      }
    }

    matchCache.set(cacheKey, false);
    return false;
  }

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
      stateTransformer(treeData: ITreeData, nodeId: string, state: INodeState): INodeState {
        const filter = this.filter.trim();
        if (!filter) {
          return state;
        }

        if (matchesOrHasMatchingDescendant(treeData, nodeId, filter, this.isNodeMatched.bind(this))) {
          return { ...state };
        }

        return state;
      },
      setFilter(filter: string): void {
        matchCache.clear();
        this.filter = filter;
      },
    }),
    {
      filter: observable.ref,
    },
    false,
    ['setFilter', 'isNodeMatched', 'transformer', 'stateTransformer'],
  );
}

export function useTreeFilter(
  options: ITreeFilterOptions = {},
  settings?: ITreeSettings,
  enabledKey: string = TREE_SETTINGS_FILTER_ENABLED,
): ITreeFilterWithState {
  const treeFilter = useTreeFilterBase(options);
  const filterState = useTreeFilterState(treeFilter, settings, enabledKey);

  return useMemo(
    () => ({
      get filter() {
        return treeFilter.filter;
      },
      isNodeMatched(treeData: ITreeData, nodeId: string): boolean {
        return treeFilter.isNodeMatched(treeData, nodeId);
      },
      transformer(treeData: ITreeData, nodeId: string, children: string[]): string[] {
        return treeFilter.transformer(treeData, nodeId, children);
      },
      stateTransformer(treeData: ITreeData, nodeId: string, state: INodeState): INodeState {
        return treeFilter.stateTransformer(treeData, nodeId, state);
      },
      setFilter(filter: string): void {
        treeFilter.setFilter(filter);
      },
      get enabled() {
        return filterState.enabled;
      },
      get childrenTransformers() {
        return filterState.childrenTransformers;
      },
      get stateTransformers() {
        return filterState.stateTransformers;
      },
      get toolbarFilter() {
        return filterState.toolbarFilter;
      },
    }),
    [
      filterState.childrenTransformers,
      filterState.enabled,
      filterState.stateTransformers,
      filterState.toolbarFilter,
      treeFilter,
    ],
  );
}
