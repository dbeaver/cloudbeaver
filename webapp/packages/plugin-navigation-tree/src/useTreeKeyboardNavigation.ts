/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import { getTreeKeyboardAction, type ITreeKeyboardNavigationModel } from './treeKeyboardNavigation.js';
import { TREE_NODE_CONTROL_SELECTOR, useTreeRovingFocus } from './useTreeRovingFocus.js';

const ARROW_KEYS = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'];

export interface ITreeKeyboardNavigationOptions extends ITreeKeyboardNavigationModel {
  setExpanded(nodeId: string, expanded: boolean): Promise<void> | void;
  activateNode?(nodeId: string): Promise<void> | void;
  revealNode?(nodeId: string): Promise<void> | void;
  disabled?: boolean;
}

interface ITreeKeyboardNavigationHandlers {
  ref: React.RefCallback<HTMLElement>;
  onKeyDownCapture: React.KeyboardEventHandler<HTMLElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
  onFocusCapture: React.FocusEventHandler<HTMLElement>;
  onBlurCapture: React.FocusEventHandler<HTMLElement>;
}

export function useTreeKeyboardNavigation(options: ITreeKeyboardNavigationOptions): ITreeKeyboardNavigationHandlers {
  const optionsRef = useObjectRef(options);
  const pendingExpansionNodeIdsRef = useRef(new Set<string>());
  const rovingFocus = useTreeRovingFocus({
    isFocusable: nodeId => optionsRef.isFocusable?.(nodeId) !== false,
    revealNode: nodeId => optionsRef.revealNode?.(nodeId),
  });

  async function handleKeyDownCapture(event: React.KeyboardEvent<HTMLElement>): Promise<void> {
    const arrowKey = ARROW_KEYS.includes(event.key);
    let control: HTMLElement | null = null;

    if (event.target instanceof HTMLElement) {
      if (arrowKey) {
        control = event.target.closest<HTMLElement>(TREE_NODE_CONTROL_SELECTOR);
      } else if (event.target.matches(TREE_NODE_CONTROL_SELECTOR)) {
        control = event.target;
      }
    }

    if (
      optionsRef.disabled ||
      !control ||
      (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) ||
      (arrowKey && (event.altKey || event.ctrlKey || event.metaKey))
    ) {
      return;
    }

    const nodeId = control.dataset['treeNodeId'];

    if (!nodeId) {
      return;
    }

    const action = getTreeKeyboardAction(optionsRef, nodeId, event.key);

    if (action?.type === 'activate') {
      return;
    }

    if (!action) {
      if (arrowKey) {
        event.preventDefault();
        event.stopPropagation();
      }

      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (action.type === 'focus') {
      await rovingFocus.focus(action.nodeId);
      return;
    }

    if (event.repeat || pendingExpansionNodeIdsRef.current.has(nodeId)) {
      return;
    }

    pendingExpansionNodeIdsRef.current.add(nodeId);
    try {
      await optionsRef.setExpanded(nodeId, action.expanded);
    } finally {
      pendingExpansionNodeIdsRef.current.delete(nodeId);
    }
  }

  async function handleKeyDown(event: React.KeyboardEvent<HTMLElement>): Promise<void> {
    if (
      optionsRef.disabled ||
      !optionsRef.activateNode ||
      !(event.target instanceof HTMLElement) ||
      !event.target.matches(TREE_NODE_CONTROL_SELECTOR)
    ) {
      return;
    }

    const nodeId = event.target.dataset['treeNodeId'];
    if (!nodeId || event.key !== 'Enter' || event.ctrlKey || event.metaKey) {
      return;
    }

    event.preventDefault();
    await optionsRef.activateNode(nodeId);
  }

  return {
    ref: rovingFocus.ref,
    onFocusCapture: rovingFocus.onFocusCapture,
    onBlurCapture: rovingFocus.onBlurCapture,
    onKeyDownCapture: handleKeyDownCapture,
    onKeyDown: handleKeyDown,
  };
}
