/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useState } from 'react';

import { useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavNodeInfoResource } from '../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import { NavigationTreeService } from './NavigationTreeService';

export type ElementsTreeCustomRendererComponent = React.FC<{
  nodeId: string;
  component: React.FC<{
    nodeId: string;
  }>;
}>;

export type IElementsTreeCustomRenderer = (nodeId: string) => ElementsTreeCustomRendererComponent | undefined;

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

interface IOptions {
  root: string;
  localState?: MetadataMap<string, ITreeNodeState>;
  filters?: IElementsTreeFilter[];
  renderers?: IElementsTreeCustomRenderer[];
  customSelect?: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void> | void;
  isGroup?: (node: NavNode) => boolean;
  onExpand?: (node: NavNode, state: boolean) => Promise<void> | void;
  onSelect?: (node: NavNode, state: boolean) => Promise<void> | void;
  onFilter?: (node: NavNode, value: string) => Promise<void> | void;
}

export interface IElementsTree {
  root: string;
  renderers: IElementsTreeCustomRenderer[];
  state: MetadataMap<string, ITreeNodeState>;
  getNodeState: (nodeId: string) => ITreeNodeState;
  getNodeChildren: (nodeId: string) => string[];
  filter: (node: NavNode, value: string) => Promise<void>;
  select: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void>;
  expand: (node: NavNode, state: boolean) => Promise<void>;
}

export function useElementsTree(options: IOptions): IElementsTree {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeService = useService(NavigationTreeService);
  const navTreeResource = useService(NavTreeResource);

  const [localTreeNodesState] = useState(() => new MetadataMap<string, ITreeNodeState>(() => ({
    filter: '',
    selected: false,
    expanded: false,
  })));

  const state = options.localState || localTreeNodesState;

  async function loadTree(nodeId: string) {
    let children = [nodeId];

    while (children.length > 0) {
      const nextChildren: string[] = [];

      for (const child of children) {
        const nodeState = state.get(child);
        if (!nodeState.expanded && child !== options.root) {
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

    if (treeNodeState.selected === selected) {
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
    }

    treeNodeState.selected = selected;
    await options.onSelect?.(node, selected);
  }

  const elementsTree = useObjectRef<IElementsTree>({
    root: options.root,
    renderers: options.renderers || [],
    state,
    getNodeState(nodeId: string) {
      return this.state.get(nodeId);
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

      const treeNodeState = this.state.get(node.id);

      if (!multiple) {
        await clearSelection(node.id);

        if (treeNodeState.selected) {
          return;
        }
      }

      await setSelection(node.id, !treeNodeState.selected);
    },
  }, undefined, { root: observable.ref, renderers: observable.ref });

  useExecutor({
    executor: navNodeInfoResource.onDataOutdated,
    postHandlers: [function refreshRoot() {
      loadTree(options.root);
    }],
  });
  useExecutor({
    executor: navTreeResource.onNodeRefresh,
    postHandlers: [loadTree],
  });

  useExecutor({
    executor: navNodeInfoResource.onItemDelete,
    handlers: [function deleteNodeState(key) {
      ResourceKeyUtils.forEach(key, key => {
        state.delete(key);
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
        }
      });
    }],
  });

  return elementsTree;
}
