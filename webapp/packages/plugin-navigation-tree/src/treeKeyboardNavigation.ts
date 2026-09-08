/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITreeKeyboardNavigationModel {
  rootId: string;
  getParent(nodeId: string): string | null;
  getChildren(nodeId: string): string[];
  isExpanded(nodeId: string): boolean;
  isLeaf(nodeId: string): boolean;
  isFocusable?(nodeId: string): boolean;
}

export type TreeKeyboardAction = { type: 'focus'; nodeId: string } | { type: 'expand'; expanded: boolean } | { type: 'activate' };

export function getVisibleNodeIds(model: ITreeKeyboardNavigationModel): string[] {
  const visibleNodeIds: string[] = [];

  function appendChildren(parentId: string): void {
    for (const nodeId of model.getChildren(parentId)) {
      if (model.isFocusable?.(nodeId) !== false) {
        visibleNodeIds.push(nodeId);
      }

      if (model.isExpanded(nodeId)) {
        appendChildren(nodeId);
      }
    }
  }

  appendChildren(model.rootId);
  return visibleNodeIds;
}

export function getTreeKeyboardAction(
  model: ITreeKeyboardNavigationModel,
  nodeId: string,
  key: string,
  visibleNodeIds = getVisibleNodeIds(model),
): TreeKeyboardAction | null {
  const nodeIndex = visibleNodeIds.indexOf(nodeId);

  switch (key) {
    case 'ArrowDown':
      return nodeIndex >= 0 && nodeIndex < visibleNodeIds.length - 1 ? { type: 'focus', nodeId: visibleNodeIds[nodeIndex + 1]! } : null;
    case 'ArrowUp':
      return nodeIndex > 0 ? { type: 'focus', nodeId: visibleNodeIds[nodeIndex - 1]! } : null;
    case 'Home':
      return visibleNodeIds[0] && visibleNodeIds[0] !== nodeId ? { type: 'focus', nodeId: visibleNodeIds[0] } : null;
    case 'End': {
      const lastNodeId = visibleNodeIds.at(-1);
      return lastNodeId && lastNodeId !== nodeId ? { type: 'focus', nodeId: lastNodeId } : null;
    }
    case 'ArrowRight': {
      if (model.isLeaf(nodeId)) {
        return { type: 'activate' };
      }

      if (!model.isExpanded(nodeId)) {
        return { type: 'expand', expanded: true };
      }

      const childId = getFirstVisibleFocusableChild(model, nodeId);
      return childId ? { type: 'focus', nodeId: childId } : null;
    }
    case 'ArrowLeft': {
      if (model.isExpanded(nodeId) && !model.isLeaf(nodeId)) {
        return { type: 'expand', expanded: false };
      }

      let parentId = model.getParent(nodeId);
      while (parentId && parentId !== model.rootId && model.isFocusable?.(parentId) === false) {
        parentId = model.getParent(parentId);
      }
      return parentId && parentId !== model.rootId ? { type: 'focus', nodeId: parentId } : null;
    }
    default:
      return null;
  }
}

function getFirstVisibleFocusableChild(model: ITreeKeyboardNavigationModel, parentId: string): string | null {
  for (const nodeId of model.getChildren(parentId)) {
    if (model.isFocusable?.(nodeId) !== false) {
      return nodeId;
    }

    if (model.isExpanded(nodeId)) {
      const childId = getFirstVisibleFocusableChild(model, nodeId);
      if (childId) {
        return childId;
      }
    }
  }

  return null;
}
