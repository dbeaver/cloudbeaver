/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

export const TREE_NODE_CONTROL_SELECTOR = '[data-tree-node-control][data-tree-node-id]';

interface ITreeRovingFocusOptions {
  isFocusable?(nodeId: string): boolean;
  revealNode?(nodeId: string): Promise<void> | void;
}

interface ITreeRovingFocus {
  ref: React.RefCallback<HTMLElement>;
  onFocusCapture: React.FocusEventHandler<HTMLElement>;
  onBlurCapture: React.FocusEventHandler<HTMLElement>;
  focus(nodeId: string): Promise<void>;
}

export function useTreeRovingFocus(options: ITreeRovingFocusOptions = {}): ITreeRovingFocus {
  const optionsRef = useObjectRef(options);
  const rootRef = useRef<HTMLElement | null>(null);
  const pendingNodeIdRef = useRef<string | null>(null);
  const focusedWithinRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);

  function getControls(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(TREE_NODE_CONTROL_SELECTOR));
  }

  function getFocusableControls(root: HTMLElement): HTMLElement[] {
    return getControls(root).filter(element => {
      const nodeId = element.dataset['treeNodeId'];
      return !!nodeId && optionsRef.isFocusable?.(nodeId) !== false;
    });
  }

  function getControl(root: HTMLElement, nodeId: string): HTMLElement | undefined {
    return getFocusableControls(root).find(element => element.dataset['treeNodeId'] === nodeId);
  }

  function setTabStop(root: HTMLElement, control: HTMLElement | undefined): void {
    for (const element of getControls(root)) {
      const tabIndex = element === control ? '0' : '-1';

      if (element.getAttribute('tabindex') !== tabIndex) {
        element.setAttribute('tabindex', tabIndex);
      }
    }
  }

  function chooseTabStop(root: HTMLElement): HTMLElement | undefined {
    const controls = getFocusableControls(root);
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return (
      controls.find(element => element === activeElement) ??
      controls.find(element => element.tabIndex === 0) ??
      controls.find(element => element.getAttribute('aria-selected') === 'true') ??
      controls[0]
    );
  }

  function focusControl(root: HTMLElement, nodeId: string): boolean {
    const control = getControl(root, nodeId);

    if (!control) {
      return false;
    }

    pendingNodeIdRef.current = null;
    setTabStop(root, control);
    control.focus();
    control.scrollIntoView?.({ block: 'nearest' });
    return true;
  }

  function synchronize(root: HTMLElement): void {
    const pendingNodeId = pendingNodeIdRef.current;

    if (pendingNodeId) {
      if (focusControl(root, pendingNodeId)) {
        return;
      }

      setTabStop(root, chooseTabStop(root));
      return;
    }

    const tabStop = chooseTabStop(root);
    setTabStop(root, tabStop);

    if (focusedWithinRef.current && !root.contains(document.activeElement)) {
      tabStop?.focus();
    }
  }

  function setRoot(root: HTMLElement | null): void {
    observerRef.current?.disconnect();
    rootRef.current = root;

    if (!root) {
      return;
    }

    synchronize(root);
    observerRef.current = new MutationObserver(() => synchronize(root));
    observerRef.current.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex'] });
  }

  async function focus(nodeId: string): Promise<void> {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    pendingNodeIdRef.current = nodeId;
    if (focusControl(root, nodeId)) {
      return;
    }

    const node = Array.from(root.querySelectorAll<HTMLElement>('[data-tree-node-id]')).find(element => element.dataset['treeNodeId'] === nodeId);
    node?.scrollIntoView?.({ block: 'nearest' });
    await optionsRef.revealNode?.(nodeId);

    if (rootRef.current === root && pendingNodeIdRef.current === nodeId) {
      focusControl(root, nodeId);
    }
  }

  function handleFocus(event: React.FocusEvent<HTMLElement>): void {
    focusedWithinRef.current = true;
    const target = event.target;

    if (
      target instanceof HTMLElement &&
      target.matches(TREE_NODE_CONTROL_SELECTOR) &&
      target.dataset['treeNodeId'] &&
      optionsRef.isFocusable?.(target.dataset['treeNodeId']) !== false
    ) {
      pendingNodeIdRef.current = null;
      setTabStop(event.currentTarget, target);
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLElement>): void {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    focusedWithinRef.current = false;
    pendingNodeIdRef.current = null;
    synchronize(event.currentTarget);
  }

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref: setRoot, onFocusCapture: handleFocus, onBlurCapture: handleBlur, focus };
}
