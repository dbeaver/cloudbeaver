/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState, type RefCallback } from 'react';

import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { EventKeyboardNavigationFlag } from '../useListKeyboardNavigation.js';
import { EventTreeNodeExpandFlag } from './TreeNode/EventTreeNodeExpandFlag.js';
import type { ITreeNodeContext } from './TreeNode/TreeNodeContext.js';

const nodes = new WeakMap<HTMLElement, ITreeNodeContext>();
const trees = new WeakSet<HTMLElement>();

export function registerTreeNode(element: HTMLElement, context: ITreeNodeContext): void {
  nodes.set(element, context);
}

export function unregisterTreeNode(element: HTMLElement): void {
  nodes.delete(element);
}

export function useTreeKeyboardActions(): RefCallback<HTMLDivElement> {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!root) {
      return;
    }

    trees.add(root);
    // Run before list navigation and React's Enter selection handler.
    root.addEventListener('keydown', handleKeyDown, true);
    return () => {
      trees.delete(root);
      root.removeEventListener('keydown', handleKeyDown, true);
    };

    async function handleKeyDown(event: KeyboardEvent) {
      if (
        !(event.target instanceof HTMLElement) ||
        event.target !== event.target.ownerDocument.activeElement ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        EventContext.has(event, EventKeyboardNavigationFlag, EventStopPropagationFlag)
      ) {
        return;
      }

      const context = nodes.get(event.target);
      if (!context) {
        return;
      }

      // Nested trees own their keyboard actions.
      let owner: HTMLElement | null = event.target.parentElement;
      while (owner && !trees.has(owner)) {
        owner = owner.parentElement;
      }
      if (owner !== root) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
          if (context.leaf) {
            await handleAction(context, event, context.open);
          } else if (!context.expanded && !context.externalExpanded) {
            await handleAction(context, event, context.expand);
          }
          break;
        case 'ArrowLeft':
          if (context.expanded && !context.leaf && !context.externalExpanded) {
            await handleAction(context, event, context.expand);
          } else {
            EventContext.set(event, EventKeyboardNavigationFlag);
            event.preventDefault();

            const parent = event.target.closest('[data-tree-node]')?.parentElement?.closest('[data-tree-node]');
            const control = parent?.querySelector<HTMLElement>('[data-tree-node-control]');
            if (parent && root?.contains(parent) && control && nodes.has(control) && control.closest('[data-tree-node]') === parent) {
              event.target.tabIndex = -1;
              control.tabIndex = 0;
              control.focus();
            }
          }
          break;
        case 'Enter':
          if (context.leaf) {
            await handleAction(context, event, context.open);
          } else if (!context.externalExpanded) {
            await handleAction(context, event, context.expand);
          }
          break;
      }
    }
  }, [root]);

  return setRoot;
}

async function handleAction(context: ITreeNodeContext, event: KeyboardEvent, action: () => Promise<void>) {
  EventContext.set(event, EventKeyboardNavigationFlag);
  EventContext.set(event, EventTreeNodeExpandFlag);
  event.preventDefault();

  if (context.disabled || context.loading || context.processing) {
    return;
  }

  await action.call(context);
}
