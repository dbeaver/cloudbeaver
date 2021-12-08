/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, runInAction } from 'mobx';
import { useMemo, useState } from 'react';

import { IFolderExplorerContext, useExecutor, useObservableRef, useUserData } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavNodeInfoResource } from '../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import type { NavigationNodeRendererComponent } from './NavigationNodeComponent';
import { NavigationTreeService } from './NavigationTreeService';

export type IElementsTreeCustomRenderer = (nodeId: string) => NavigationNodeRendererComponent | undefined;

export type IElementsTreeFilter = (
  node: NavNode,
  children: string[],
  state: MetadataMap<string, ITreeNodeState>
) => string[];

export interface ITreeNodeState {
  filter: string;
  selected: boolean;
  expanded: boolean;
}

interface IElementsTreeUserState {
  foldersTree: boolean;
  showFolderExplorerPath: boolean;
  nodeState: Array<[string, ITreeNodeState]>;
}

interface IOptions {
  baseRoot: string;
  root: string;
  folderExplorer: IFolderExplorerContext;
  foldersTree: boolean;
  showFolderExplorerPath: boolean;
  disabled?: boolean;
  keepData?: boolean;
  localState?: MetadataMap<string, ITreeNodeState>;
  filters?: IElementsTreeFilter[];
  renderers?: IElementsTreeCustomRenderer[];
  customSelect?: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void> | void;
  beforeSelect?: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void> | void;
  isGroup?: (node: NavNode) => boolean;
  onExpand?: (node: NavNode, state: boolean) => Promise<void> | void;
  onSelect?: (node: NavNode, state: boolean) => Promise<void> | void;
  onFilter?: (node: NavNode, value: string) => Promise<void> | void;
}

export interface IElementsTree {
  baseRoot: string;
  root: string;
  loading: boolean;
  disabled: boolean;
  foldersTree: boolean;
  showFolderExplorerPath: boolean;
  renderers: IElementsTreeCustomRenderer[];
  state: MetadataMap<string, ITreeNodeState>;
  getNodeState: (nodeId: string) => ITreeNodeState;
  isNodeSelected: (nodeId: string) => boolean;
  getNodeChildren: (nodeId: string) => string[];
  isGroup?: (node: NavNode) => boolean;
  filter: (node: NavNode, value: string) => Promise<void>;
  select: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void>;
  expand: (node: NavNode, state: boolean) => Promise<void>;
}

export function useElementsTree(options: IOptions): IElementsTree {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeService = useService(NavigationTreeService);
  const navTreeResource = useService(NavTreeResource);
  const connectionInfoResource = useService(ConnectionInfoResource);

  const [localTreeNodesState] = useState(() => new MetadataMap<string, ITreeNodeState>(() => ({
    filter: '',
    selected: false,
    expanded: false,
  })));
  const state = options.localState || localTreeNodesState;
  let foldersTree = options.foldersTree;
  let showFolderExplorerPath = options.showFolderExplorerPath;

  const userState = useUserData<IElementsTreeUserState>(
    `elements-tree-${options.baseRoot}`,
    () => observable<IElementsTreeUserState>({
      foldersTree,
      showFolderExplorerPath,
      nodeState: [],
    }),
    async data => {
      if (options.keepData) {
        state.sync(data.nodeState);

        elementsTree.loading = true;
        try {
          await loadTree(options.root);
        } finally {
          elementsTree.loading = false;
        }
      }
    },
    data => (
      typeof data === 'object'
      && Array.isArray(data.nodeState)
      && typeof data.foldersTree === 'boolean'
      && typeof data.showFolderExplorerPath === 'boolean'
    )
  );

  foldersTree = userState.foldersTree;
  showFolderExplorerPath = userState.showFolderExplorerPath;

  async function loadTree(nodeId: string) {
    const preloaded = await navTreeResource.preloadNodeParents(options.folderExplorer.fullPath);

    if (!preloaded) {
      return;
    }

    let children = [nodeId];

    while (children.length > 0) {
      const nextChildren: string[] = [];

      for (const child of children) {
        await connectionInfoResource.load(CachedMapAllKey);
        await navNodeInfoResource.waitLoad();
        await navTreeResource.waitLoad();

        const nodeState = state.get(child);
        if (!nodeState.expanded && child !== options.root) {
          if (navNodeInfoResource.isOutdated(child)) {
            const node = navNodeInfoResource.get(child);

            if (node?.parentId !== undefined && !navTreeResource.isOutdated(node.parentId)) {
              await navNodeInfoResource.load(child);
            }
          }
          continue;
        }

        const loaded = await navTreeService.loadNestedNodes(child, false);

        if (!loaded) {
          const node = navNodeInfoResource.get(child);

          if (node) {
            await elementsTree.expand(node, false);
          }
          continue;
        }

        nextChildren.push(...(navTreeResource.get(child) || []));
      }

      children = nextChildren;
    }
  }

  function getNodeChildren(nodeId: string): string[] {
    const node = navNodeInfoResource.get(nodeId);

    if (!node) {
      return []; // Maybe filter should accept nodeId, so we be able to apply filters to empty node
    }

    return (options.filters || [])
      .reduce(
        (children, filter) => filter(node, children, state),
        navTreeService.getChildren(node.id) || []
      );
  }

  function getNestedChildren(nodeId: string): string [] {
    const nestedChildren: string[] = [];
    const prevChildren = getNodeChildren(nodeId);
    nestedChildren.push(...prevChildren);

    while (prevChildren.length) {
      const nodeKey = prevChildren.shift()!;
      const children = getNodeChildren(nodeKey);
      prevChildren.push(...children);
      nestedChildren.push(...children);
    }

    return nestedChildren;
  }

  async function clearSelection(nodeId: string) {
    const node = navNodeInfoResource.get(nodeId);

    const ignore = node && options.isGroup?.(node)
      ? getNestedChildren(nodeId)
      : [];

    for (const [id, nodeState] of state) {
      if (nodeState.selected && id !== nodeId && !ignore.includes(id)) {
        nodeState.selected = false;

        if (options.onSelect) {
          const node = navNodeInfoResource.get(id);

          if (node) {
            await options.onSelect(node, false);
          }
        }
      }
    }
  }

  async function setSelection(nodeId: string, selected: boolean): Promise<void> {
    const node = navNodeInfoResource.get(nodeId);

    if (!node) {
      return;
    }

    const treeNodeState = state.get(nodeId);
    const selectionState = elementsTree.isNodeSelected(nodeId);

    if (selectionState === selected) {
      return;
    }

    if (options.isGroup?.(node)) {
      const children = getNodeChildren(nodeId);

      for (const child of children) {
        await setSelection(child, selected);
      }

      if (children.length === 0) {
        return;
      }
    } else {
      treeNodeState.selected = selected;
    }

    await options.onSelect?.(node, selected);
  }

  const renderers = useMemo(() => options.renderers || [], [options.renderers]);

  const elementsTree = useObservableRef<IElementsTree>(() => ({
    state,
    loading: options.keepData || false,
    getNodeState(nodeId: string) {
      return this.state.get(nodeId);
    },
    isNodeSelected(nodeId: string): boolean {
      const node = navNodeInfoResource.get(nodeId);

      if (node && elementsTree.isGroup?.(node)) {
        const children = getNodeChildren(nodeId);

        if (children.length > 0) {
          return children.every(child => elementsTree.getNodeState(child).selected);
        } else {
          return false;
        }
      }
      return this.getNodeState(nodeId).selected;
    },
    getNodeChildren,
    async filter(node: NavNode, value: string) {
      const treeNodeState = this.state.get(node.id);
      treeNodeState.filter = value;

      await options.onFilter?.(node, value);
    },
    async expand(node: NavNode, state: boolean) {
      const treeNodeState = this.state.get(node.id);

      try {
        if (state) {
          state = await navTreeService.loadNestedNodes(node.id, true);
        }

        await options.onExpand?.(node, state);
        treeNodeState.expanded = state;

        if (state) {
          await loadTree(node.id);
        }
      } catch {
        treeNodeState.expanded = false;
      }
    },
    async select(node: NavNode, multiple: boolean, nested: boolean) {
      if (options.customSelect) {
        await options.customSelect(node, multiple, nested);
        return;
      }

      if (options.beforeSelect) {
        await options.beforeSelect(node, multiple, nested);
      }

      const selected = this.isNodeSelected(node.id);

      if (!multiple) {
        await clearSelection(node.id);

        if (selected) {
          return;
        }
      }

      await setSelection(node.id, !selected);
    },
  }), {
    foldersTree: observable.ref,
    showFolderExplorerPath: observable.ref,
    isGroup: observable.ref,
    disabled: observable.ref,
    root: observable.ref,
    loading: observable.ref,
    renderers: observable.ref,
    baseRoot: observable.ref,
  }, {
    isGroup: options.isGroup,
    disabled: options.disabled,
    root: options.root,
    foldersTree,
    showFolderExplorerPath,
    baseRoot: options.baseRoot,
    renderers,
  });

  function exitNodeFolder(nodeId: string) {
    runInAction(() => {
      const folderExplorer = options.folderExplorer;

      if (folderExplorer.fullPath.length === 1) {
        return;
      }

      const pathIndex = folderExplorer.fullPath.indexOf(nodeId);

      if (pathIndex >= 0) {
        folderExplorer.fullPath = folderExplorer.fullPath.slice(0, pathIndex);
        folderExplorer.folder = folderExplorer.fullPath[pathIndex - 1];
        folderExplorer.path = folderExplorer.fullPath.slice(0, pathIndex - 1);
      }
    });
  }

  useExecutor({
    executor: navNodeInfoResource.onDataOutdated,
    postHandlers: [function refreshRoot() {
      loadTree(options.root);
    }],
  });

  useExecutor({
    executor: navNodeInfoResource.onItemAdd,
    handlers: [function exitFolder(key) {
      ResourceKeyUtils.forEach(key, key => {
        const children = navTreeResource.get(key);

        if (!children || children.length === 0) {
          exitNodeFolder(key);
        }
      });
    }],
  });

  useExecutor({
    executor: navNodeInfoResource.onItemDelete,
    handlers: [function deleteNodeState(key) {
      runInAction(() => {
        ResourceKeyUtils.forEach(key, key => {
          state.delete(key);
        });
      });
    }],
  });

  useExecutor({
    executor: navTreeResource.onItemDelete,
    handlers: [async function collapseDeletedTree(key) {
      await ResourceKeyUtils.forEachAsync(key, async key => {
        const node = navNodeInfoResource.get(key);

        if (node) {
          await elementsTree.expand(node, false);

          exitNodeFolder(key);
        }
      });
    }],
  });

  return elementsTree;
}
