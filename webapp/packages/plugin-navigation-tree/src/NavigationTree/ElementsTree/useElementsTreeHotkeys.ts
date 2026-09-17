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
  tree: Pick<IElementsTree, 'disabled' | 'getSelected' | 'expand' | 'collapse' | 'open'>,
  navNodeInfoResource: { get(nodeId: string): NavNode | undefined; getParents(nodeId: string): string[] },
): React.RefObject<HTMLDivElement | null> {
  return useHotkeys<HTMLDivElement>(
    'enter, arrowright, arrowleft',
    async event => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches('[data-tree-node-control]') || event.defaultPrevented) {
        return;
      }

      // Handle the action before list navigation and the node's Enter selection handler.
      event.preventDefault();
      event.stopPropagation();

      const nodeId = tree.getSelected()[0];
      if (nodeId === undefined || (event.key === 'Enter' && event.repeat)) {
        return;
      }

      const node = navNodeInfoResource.get(nodeId);
      if (!node) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
          await tree.expand(node, true);
          break;
        case 'ArrowLeft':
          tree.collapse(nodeId);
          break;
        case 'Enter':
          await tree.open(node, navNodeInfoResource.getParents(nodeId), !node.hasChildren);
          break;
      }
    },
    { enabled: !tree.disabled, useKey: true, eventListenerOptions: { capture: true } },
    [tree, navNodeInfoResource],
  );
}
