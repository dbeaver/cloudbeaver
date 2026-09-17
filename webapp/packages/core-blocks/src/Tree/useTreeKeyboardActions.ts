/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useContext, type RefCallback } from 'react';

import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { useHotkeys } from '../useHotkeys.js';
import { EventKeyboardNavigationFlag, useListKeyboardNavigation } from '../useListKeyboardNavigation.js';
import { useMergeRefs } from '../useMergeRefs.js';
import { EventTreeNodeExpandFlag } from './TreeNode/EventTreeNodeExpandFlag.js';
import { TreeNodeContext, type ITreeNodeContext } from './TreeNode/TreeNodeContext.js';

const TREE_KEYBOARD_ACTIONS_SELECTOR = '[data-tree-keyboard-actions]';
const nodeContexts = new WeakMap<HTMLElement, ITreeNodeContext>();

export function useTreeNodeKeyboardActions(): RefCallback<HTMLDivElement> {
  const context = useContext(TreeNodeContext);
  return useCallback(
    node => {
      if (node) {
        nodeContexts.set(node, context);
      }
    },
    [context],
  );
}

export function useTreeKeyboardActions(): RefCallback<HTMLDivElement> {
  const hotkeysRef = useHotkeys<HTMLDivElement>(
    'enter, arrowright, arrowleft',
    async event => {
      const node = event.target;
      if (
        !(node instanceof HTMLElement) ||
        node !== node.ownerDocument.activeElement ||
        event.defaultPrevented ||
        EventContext.has(event, EventKeyboardNavigationFlag, EventStopPropagationFlag)
      ) {
        return;
      }

      const root = node.closest(TREE_KEYBOARD_ACTIONS_SELECTOR);
      const context = nodeContexts.get(node);
      if (!root || root !== event.currentTarget || !context) {
        return;
      }

      switch (event.key) {
        case 'Enter':
        case 'ArrowRight':
          if (context.leaf) {
            await handleAction(context, event, context.open);
          } else if (!context.externalExpanded && (event.key === 'Enter' || !context.expanded)) {
            await handleAction(context, event, context.expand);
          }
          break;
        case 'ArrowLeft':
          if (context.expanded && !context.leaf && !context.externalExpanded) {
            await handleAction(context, event, context.expand);
          } else {
            EventContext.set(event, EventKeyboardNavigationFlag);
            event.preventDefault();

            const parent = node.closest('[data-tree-node]')?.parentElement?.closest('[data-tree-node]');
            const control = parent?.querySelector<HTMLElement>('[data-tree-node-control]');
            if (
              parent &&
              root.contains(parent) &&
              control &&
              control.closest(TREE_KEYBOARD_ACTIONS_SELECTOR) === root &&
              control.closest('[data-tree-node]') === parent
            ) {
              node.tabIndex = -1;
              control.tabIndex = 0;
              control.focus();
            }
          }
          break;
      }
    },
    // Run before native list navigation and React's Enter selection handler.
    { useKey: true, eventListenerOptions: { capture: true } },
  );
  const listRef = useListKeyboardNavigation<HTMLDivElement>('[data-tree-node-control][tabindex]:not(:disabled)');
  const markRoot = useCallback((node: HTMLDivElement | null) => {
    node?.setAttribute('data-tree-keyboard-actions', '');
  }, []);
  return useMergeRefs(hotkeysRef, listRef, markRoot);
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
