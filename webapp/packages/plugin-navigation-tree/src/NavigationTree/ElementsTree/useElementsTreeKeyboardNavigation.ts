/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef } from 'react';

import { EventKeyboardNavigationFlag, useHotkeys } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import { isLeaf } from './NavigationTreeNode/useNavigationNode.js';
import type { IElementsTree } from './useElementsTree.js';

export function useElementsTreeKeyboardNavigation(tree: IElementsTree): React.RefObject<HTMLDivElement | null> {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const expandingNodes = useRef(new Set<string>()).current;

  async function expandNode(nodeId: string, state: boolean): Promise<void> {
    // Prevent multiple simultaneous expansions of the same node
    if (expandingNodes.has(nodeId)) {
      return;
    }

    const node = navNodeInfoResource.get(nodeId);

    if (node) {
      expandingNodes.add(nodeId);
      try {
        await tree.expand(node, state);
      } finally {
        expandingNodes.delete(nodeId);
      }
    }
  }

  async function selectAndFocus(nodeId: string): Promise<void> {
    const node = navNodeInfoResource.get(nodeId);

    if (node) {
      await tree.select(node, false, false);
      tree.focus(nodeId);
    }
  }

  return useHotkeys<HTMLDivElement>(
    ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'enter'],
    async event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const control = target?.closest<HTMLElement>('[data-tree-node-control]');
      const nodeId = tree.getSelected()[0];
      const node = nodeId ? navNodeInfoResource.get(nodeId) : undefined;

      if (!nodeId || !node) {
        return;
      }

      // Ignore enter if focused context menu or other control
      if (event.key === 'Enter' && target !== control) {
        return;
      }

      EventContext.set(event, EventKeyboardNavigationFlag);
      EventContext.set(event, EventStopPropagationFlag);
      event.preventDefault();
      event.stopPropagation();

      // holding right arrow won't trigger multiple expansions
      if (event.key === 'ArrowRight' && event.repeat) {
        return;
      }

      const leaf = isLeaf(node, navTreeResource.get(nodeId), tree, navNodeInfoResource.isOutdated(nodeId) || navTreeResource.isOutdated(nodeId));
      const expanded = !leaf && tree.isNodeExpanded(nodeId);

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || (event.key === 'ArrowRight' && expanded)) {
        const visibleNodes = getVisibleNodes(tree);
        const currentIndex = visibleNodes.indexOf(nodeId);

        if (currentIndex === -1) {
          return;
        }

        const offset = event.key === 'ArrowUp' ? -1 : 1;
        const nextNodeId = visibleNodes[(currentIndex + offset + visibleNodes.length) % visibleNodes.length];

        if (nextNodeId) {
          await selectAndFocus(nextNodeId);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (expanded) {
            await expandNode(nodeId, false);
          } else {
            const parentId = navNodeInfoResource.getParent(nodeId);
            const parent = parentId ? navNodeInfoResource.get(parentId) : undefined;

            if (parentId && parent && getVisibleNodes(tree).includes(parentId)) {
              await selectAndFocus(parentId);
            }
          }
          break;
        case 'ArrowRight':
          if (!leaf) {
            await expandNode(nodeId, true);
          }
          break;
        case 'Enter':
          await tree.open(node, navNodeInfoResource.getParents(nodeId), leaf);
          break;
      }
    },
    { useKey: true },
  );
}

function getVisibleNodes(tree: IElementsTree): string[] {
  const visibleNodes: string[] = [];
  const nodes = tree.root === tree.baseRoot ? tree.getNodeChildren(tree.root) : [tree.root];
  const stack = [...nodes].reverse();

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    visibleNodes.push(nodeId);

    if (tree.isNodeExpanded(nodeId)) {
      stack.push(...[...tree.getNodeChildren(nodeId)].reverse());
    }
  }

  return visibleNodes;
}
