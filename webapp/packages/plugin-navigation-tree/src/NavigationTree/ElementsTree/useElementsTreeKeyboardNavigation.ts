/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { EventKeyboardNavigationFlag, useHotkeys } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTree } from './useElementsTree.js';

export function useElementsTreeKeyboardNavigation(tree: IElementsTree): React.RefObject<HTMLDivElement | null> {
  const navNodeInfoResource = useService(NavNodeInfoResource);

  return useHotkeys<HTMLDivElement>(
    ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'enter'],
    async event => {
      const nodeId = tree.getSelected()[0];
      const node = nodeId ? navNodeInfoResource.get(nodeId) : undefined;

      if (!nodeId || !node) {
        return;
      }

      EventContext.set(event, EventKeyboardNavigationFlag);
      EventContext.set(event, EventStopPropagationFlag);
      event.preventDefault();

      const { expanded } = tree.getNodeState(nodeId);

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || (event.key === 'ArrowRight' && expanded)) {
        const visibleNodes = getVisibleNodes(tree);
        const currentIndex = visibleNodes.indexOf(nodeId);

        if (currentIndex === -1) {
          return;
        }

        const offset = event.key === 'ArrowUp' ? -1 : 1;
        const nextNodeId = visibleNodes[(currentIndex + offset + visibleNodes.length) % visibleNodes.length];
        const nextNode = nextNodeId ? navNodeInfoResource.get(nextNodeId) : undefined;

        if (nextNode) {
          await tree.select(nextNode, false, false);
          tree.focus(nextNode.uri);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (expanded) {
            await tree.expand(node, false);
          } else {
            const parentId = navNodeInfoResource.getParent(nodeId);
            const parent = parentId ? navNodeInfoResource.get(parentId) : undefined;

            if (parentId && parent && getVisibleNodes(tree).includes(parentId)) {
              await tree.select(parent, false, false);
              tree.focus(parentId);
            }
          }
          break;
        case 'ArrowRight':
          await tree.expand(node, true);
          break;
        case 'Enter':
          await tree.open(node, navNodeInfoResource.getParents(nodeId), !node.hasChildren);
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
