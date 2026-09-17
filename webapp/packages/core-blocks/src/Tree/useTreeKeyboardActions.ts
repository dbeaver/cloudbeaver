/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, type KeyboardEvent } from 'react';

import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { EventKeyboardNavigationFlag } from '../useListKeyboardNavigation.js';
import { EventTreeNodeExpandFlag } from './TreeNode/EventTreeNodeExpandFlag.js';
import { TreeNodeContext, type ITreeNodeContext } from './TreeNode/TreeNodeContext.js';

const TREE_KEYBOARD_ACTIONS_SELECTOR = '[data-tree-keyboard-actions]';

export function useTreeNodeKeyboardActions(): (event: KeyboardEvent<HTMLDivElement>) => Promise<void> {
  const context = useContext(TreeNodeContext);

  // Capture runs before native list navigation and React's Enter selection handler.
  return async function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const node = event.currentTarget;
    if (
      event.target !== node ||
      node !== node.ownerDocument.activeElement ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.defaultPrevented ||
      EventContext.has(event, EventKeyboardNavigationFlag, EventStopPropagationFlag) ||
      EventContext.has(event.nativeEvent, EventKeyboardNavigationFlag, EventStopPropagationFlag)
    ) {
      return;
    }

    const root = node.closest(TREE_KEYBOARD_ACTIONS_SELECTOR);
    if (!root) {
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
          EventContext.set(event.nativeEvent, EventKeyboardNavigationFlag);
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
  };
}

async function handleAction(context: ITreeNodeContext, event: KeyboardEvent<HTMLDivElement>, action: () => Promise<void>) {
  EventContext.set(event.nativeEvent, EventKeyboardNavigationFlag);
  EventContext.set(event.nativeEvent, EventTreeNodeExpandFlag);
  event.preventDefault();

  if (context.disabled || context.loading || context.processing) {
    return;
  }

  await action.call(context);
}
