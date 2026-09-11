/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable, runInAction } from 'mobx';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';

import { getTreeKeyboardAction, getVisibleNodeIds, type ITreeKeyboardNavigationModel } from './treeKeyboardNavigation.js';
import { focusTreeItem, getFallbackNodeId, getKeyboardEventTreeItem, TREE_ITEM_SELECTOR } from './treeKeyboardNavigationUtils.js';

const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];

interface IOptions extends ITreeKeyboardNavigationModel {
  disabled?: boolean;
  isSelected?(nodeId: string): boolean;
  revealNode?(nodeId: string): Promise<void> | void;
}

interface IPrivateTreeKeyboardNavigation extends ITreeKeyboardNavigation {
  elements: Map<string, HTMLElement>;
  nodeActions: Map<string, ITreeNodeKeyboardActions>;
  parents: Map<string, string | null>;
  pendingFocusNodeId: string | null;
  pendingActivationNodeIds: Set<string>;
  pendingExpansionNodeIds: Set<string>;
  rootElement: HTMLElement | null;
  visibleNodeIds: string[];
  activateNode(nodeId: string): Promise<void>;
  setNodeExpanded(nodeId: string, expanded: boolean): Promise<void>;
  unregisterNode(nodeId: string): void;
  focusNode(nodeId: string, visibleNodeIds?: string[]): Promise<void>;
  setActiveNode(nodeId: string | null, visibleNodeIds?: string[]): void;
}

export interface ITreeNodeKeyboardActions {
  activate(): Promise<void> | void;
  setExpanded(expanded: boolean): Promise<void> | void;
}

export interface ITreeKeyboardNavigation {
  activeNodeId: string | null;
  activeNodeMounted: boolean;
  registerNode(nodeId: string, element: HTMLElement | null, actions: ITreeNodeKeyboardActions): void;
  setRootRef(element: HTMLElement | null): void;
  onFocusCapture(event: React.FocusEvent<HTMLElement>): void;
  onKeyDown(event: React.KeyboardEvent<HTMLElement>): Promise<void>;
}

export function useTreeKeyboardNavigation(options: IOptions): ITreeKeyboardNavigation {
  const optionsRef = useObjectRef(options);

  return useObservableRef<IPrivateTreeKeyboardNavigation>(
    () => {
      const visibleNodeIds = getVisibleNodeIds(options);

      return {
        activeNodeId: getInitialActiveNodeId(options, visibleNodeIds),
        activeNodeMounted: false,
        elements: new Map(),
        nodeActions: new Map(),
        parents: new Map(),
        pendingFocusNodeId: null,
        pendingActivationNodeIds: new Set(),
        pendingExpansionNodeIds: new Set(),
        rootElement: null,
        visibleNodeIds,
        registerNode(nodeId, element, actions) {
          if (!element) {
            this.unregisterNode(nodeId);
            return;
          }

          const shouldInitializeFocus = !this.activeNodeId && document.activeElement === this.rootElement;
          this.elements.set(nodeId, element);
          this.nodeActions.set(nodeId, actions);
          this.parents.set(nodeId, optionsRef.getParent(nodeId));

          if (!this.activeNodeId) {
            this.visibleNodeIds = getVisibleNodeIds(optionsRef);
            this.activeNodeId = getInitialActiveNodeId(optionsRef, this.visibleNodeIds);
          }

          if (nodeId === this.activeNodeId) {
            this.activeNodeMounted = true;
          }
          if (nodeId === this.pendingFocusNodeId) {
            this.pendingFocusNodeId = null;
            queueMicrotask(() => focusTreeItem(element));
          } else if (nodeId === this.activeNodeId && document.activeElement === this.rootElement) {
            queueMicrotask(() => focusTreeItem(element));
          } else if (shouldInitializeFocus && this.activeNodeId) {
            const activeNodeId = this.activeNodeId;
            queueMicrotask(() => void this.focusNode(activeNodeId));
          }
        },
        unregisterNode(nodeId) {
          const previousElement = this.elements.get(nodeId);
          if (previousElement) {
            this.elements.delete(nodeId);
            this.nodeActions.delete(nodeId);
          }
          if (nodeId !== this.activeNodeId) {
            this.parents.delete(nodeId);
            return;
          }

          this.activeNodeMounted = false;
          const visibleNodeIds = getVisibleNodeIds(optionsRef);

          // Virtualization can unmount a node without removing it from navigation.
          if (visibleNodeIds.includes(nodeId)) {
            return;
          }

          const wasFocused = previousElement === document.activeElement;
          const fallbackNodeId = getFallbackNodeId(nodeId, this.parents.get(nodeId), optionsRef.rootId, this.visibleNodeIds, visibleNodeIds);
          this.parents.delete(nodeId);

          this.activeNodeId = fallbackNodeId;
          this.activeNodeMounted = !!fallbackNodeId && this.elements.has(fallbackNodeId);
          this.visibleNodeIds = visibleNodeIds;

          if (wasFocused && fallbackNodeId) {
            queueMicrotask(() => void this.focusNode(fallbackNodeId));
          } else if (wasFocused) {
            queueMicrotask(() => this.rootElement?.focus());
          }
        },
        setRootRef(element) {
          this.rootElement = element;
        },
        onFocusCapture(event) {
          if (!(event.target instanceof HTMLElement) || !event.target.matches(TREE_ITEM_SELECTOR)) {
            if (event.target === event.currentTarget) {
              const nodeId = this.activeNodeId ?? getVisibleNodeIds(optionsRef)[0];
              if (nodeId) {
                void this.focusNode(nodeId);
              }
            }
            return;
          }

          if (event.target.closest('[role="tree"]') !== event.currentTarget) {
            return;
          }

          const nodeId = event.target.dataset['treeNodeId'];
          if (nodeId && nodeId !== this.activeNodeId) {
            this.setActiveNode(nodeId);
          }
        },
        async onKeyDown(event) {
          const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
          if (optionsRef.disabled || hasModifier) {
            return;
          }

          const treeItem = getKeyboardEventTreeItem(event);
          if (!treeItem) {
            return;
          }
          const nodeId = treeItem.dataset['treeNodeId'];
          if (!nodeId) {
            return;
          }

          const isNestedButtonEvent = event.target !== treeItem;
          if (event.key === 'Enter') {
            if (isNestedButtonEvent) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) {
              await this.activateNode(nodeId);
            }
            return;
          }

          if (!NAVIGATION_KEYS.includes(event.key)) {
            return;
          }

          const visibleNodeIds = getVisibleNodeIds(optionsRef);
          const keyboardAction = getTreeKeyboardAction(optionsRef, nodeId, event.key, visibleNodeIds);

          event.preventDefault();
          event.stopPropagation();

          if (isNestedButtonEvent) {
            this.setActiveNode(nodeId, visibleNodeIds);
            focusTreeItem(treeItem);
          }

          if (!keyboardAction) {
            return;
          }
          if (keyboardAction.type === 'focus') {
            await this.focusNode(keyboardAction.nodeId, visibleNodeIds);
            return;
          }
          if (keyboardAction.type === 'activate') {
            if (!event.repeat) {
              await this.activateNode(nodeId);
            }
            return;
          }
          await this.setNodeExpanded(nodeId, keyboardAction.expanded);
        },
        async activateNode(nodeId) {
          const nodeActions = this.nodeActions.get(nodeId);
          if (!nodeActions || this.pendingActivationNodeIds.has(nodeId)) {
            return;
          }

          this.pendingActivationNodeIds.add(nodeId);
          try {
            await nodeActions.activate();
          } finally {
            this.pendingActivationNodeIds.delete(nodeId);
          }
        },
        async setNodeExpanded(nodeId, expanded) {
          const nodeActions = this.nodeActions.get(nodeId);
          if (!nodeActions || this.pendingExpansionNodeIds.has(nodeId)) {
            return;
          }

          this.pendingExpansionNodeIds.add(nodeId);
          try {
            await nodeActions.setExpanded(expanded);
          } finally {
            this.pendingExpansionNodeIds.delete(nodeId);
          }
        },
        async focusNode(nodeId, visibleNodeIds) {
          const currentVisibleNodeIds = visibleNodeIds ?? getVisibleNodeIds(optionsRef);
          const targetNodeId = currentVisibleNodeIds.includes(nodeId)
            ? nodeId
            : getFallbackNodeId(nodeId, this.parents.get(nodeId), optionsRef.rootId, this.visibleNodeIds, currentVisibleNodeIds);

          this.setActiveNode(targetNodeId || null, currentVisibleNodeIds);
          if (!targetNodeId) {
            return;
          }

          this.pendingFocusNodeId = targetNodeId;

          const element = this.elements.get(targetNodeId);
          if (element) {
            this.pendingFocusNodeId = null;
            focusTreeItem(element);
            return;
          }

          await optionsRef.revealNode?.(targetNodeId);
          await Promise.resolve();

          if (this.pendingFocusNodeId !== targetNodeId) {
            return;
          }

          const revealedElement = this.elements.get(targetNodeId);
          if (revealedElement) {
            runInAction(() => {
              this.pendingFocusNodeId = null;
              this.activeNodeMounted = true;
            });
            focusTreeItem(revealedElement);
          }
        },
        setActiveNode(nodeId, visibleNodeIds = getVisibleNodeIds(optionsRef)) {
          if (this.activeNodeId && this.activeNodeId !== nodeId && !this.elements.has(this.activeNodeId)) {
            this.parents.delete(this.activeNodeId);
          }
          this.activeNodeId = nodeId;
          this.activeNodeMounted = nodeId !== null && this.elements.has(nodeId);
          this.pendingFocusNodeId = null;
          if (nodeId !== null) {
            this.parents.set(nodeId, optionsRef.getParent(nodeId));
          }
          this.visibleNodeIds = visibleNodeIds;
        },
      };
    },
    {
      activeNodeId: observable.ref,
      activeNodeMounted: observable.ref,
      registerNode: action.bound,
      unregisterNode: action.bound,
      setRootRef: action.bound,
      activateNode: action.bound,
      setNodeExpanded: action.bound,
      focusNode: action.bound,
      setActiveNode: action.bound,
    },
    false,
    ['onFocusCapture', 'onKeyDown'],
  );
}

function getInitialActiveNodeId(options: IOptions, visibleNodeIds: string[]): string | null {
  return visibleNodeIds.find(nodeId => options.isSelected?.(nodeId)) ?? visibleNodeIds[0] ?? null;
}
