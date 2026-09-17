/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useHotkeys } from '@cloudbeaver/core-blocks';
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTree } from './useElementsTree.js';

export function useElementsTreeHotkeys(
  tree: Pick<IElementsTree, 'disabled' | 'getSelected' | 'select' | 'isNodeExpanded' | 'getNodeChildren' | 'expand' | 'collapse' | 'open'>,
  navNodeInfoResource: { get(nodeId: string): NavNode | undefined; getParents(nodeId: string): string[] },
  isNodeLeaf: (node: NavNode) => boolean,
): React.RefObject<HTMLDivElement | null> {
  return useHotkeys<HTMLDivElement>(
    'enter, arrowright, arrowleft, arrowdown, arrowup',
    async event => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches('[data-tree-node-control]') || event.defaultPrevented) {
        return;
      }

      // Handle the action before list navigation and the node's Enter selection handler.
      event.preventDefault();
      event.stopPropagation();

      const root = event.currentTarget as HTMLElement;
      const controls = Array.from(root.querySelectorAll<HTMLElement>('[data-tree-node-control][data-navigation-node-id][tabindex]:not(:disabled)'));

      async function focusNode(control: HTMLElement | undefined) {
        const id = control?.dataset['navigationNodeId'];
        const node = id === undefined ? undefined : navNodeInfoResource.get(id);
        if (!control || !node) {
          return;
        }

        await tree.select(node, false, false);
        for (const element of controls) {
          element.tabIndex = element === control ? 0 : -1;
        }
        control.focus();
        control.scrollIntoView({ block: 'nearest' });
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const index = controls.indexOf(target);
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (index !== -1) {
          await focusNode(controls[(index + direction + controls.length) % controls.length]);
        }
        return;
      }

      if (event.key === 'Enter' && event.repeat) {
        return;
      }

      // A tree can receive keyboard focus before any node has been selected.
      if (tree.getSelected().length === 0) {
        await focusNode(target);
      }
      const nodeId = tree.getSelected()[0];
      if (nodeId === undefined) {
        return;
      }

      const node = navNodeInfoResource.get(nodeId);
      if (!node) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
          if (tree.isNodeExpanded(nodeId)) {
            const children = tree.getNodeChildren(nodeId);
            await focusNode(controls.find(control => children.includes(control.dataset['navigationNodeId']!)));
          } else {
            await tree.expand(node, true);
          }
          break;
        case 'ArrowLeft':
          if (tree.isNodeExpanded(nodeId)) {
            tree.collapse(nodeId);
          } else {
            await focusNode(controls.find(control => control.dataset['navigationNodeId'] === node.parentId));
          }
          break;
        case 'Enter':
          if (isNodeLeaf(node)) {
            await tree.open(node, navNodeInfoResource.getParents(nodeId), true);
          } else if (tree.isNodeExpanded(nodeId)) {
            tree.collapse(nodeId);
          } else {
            await tree.expand(node, true);
          }
          break;
      }
    },
    { enabled: !tree.disabled, useKey: true, eventListenerOptions: { capture: true } },
    [tree, navNodeInfoResource, isNodeLeaf],
  );
}
