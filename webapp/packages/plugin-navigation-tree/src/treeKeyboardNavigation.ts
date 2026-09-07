/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITreeKeyboardNavigationModel {
  getParent(nodeId: string): string | null;
  getChildren(nodeId: string): string[];
  isExpanded(nodeId: string): boolean;
  isLeaf(nodeId: string): boolean;
  isFocusable?(nodeId: string): boolean;
}

type TreeKeyboardAction = { type: 'focus'; nodeId: string } | { type: 'expand'; expanded: boolean } | { type: 'activate' };

function isFocusable(model: ITreeKeyboardNavigationModel, nodeId: string): boolean {
  return model.isFocusable?.(nodeId) !== false;
}

function findFirstFocusable(model: ITreeKeyboardNavigationModel, nodeIds: string[]): string | null {
  for (const nodeId of nodeIds) {
    if (isFocusable(model, nodeId)) {
      return nodeId;
    }

    if (model.isExpanded(nodeId)) {
      const child = findFirstFocusable(model, model.getChildren(nodeId));

      if (child) {
        return child;
      }
    }
  }

  return null;
}

function findDeepestFocusable(model: ITreeKeyboardNavigationModel, nodeId: string): string | null {
  if (model.isExpanded(nodeId)) {
    const children = model.getChildren(nodeId);

    for (let i = children.length - 1; i >= 0; i--) {
      const child = findDeepestFocusable(model, children[i]!);

      if (child) {
        return child;
      }
    }
  }

  return isFocusable(model, nodeId) ? nodeId : null;
}

function getNextTreeNode(model: ITreeKeyboardNavigationModel, nodeId: string): string | null {
  if (model.isExpanded(nodeId)) {
    const child = findFirstFocusable(model, model.getChildren(nodeId));

    if (child) {
      return child;
    }
  }

  let currentId = nodeId;
  let parentId = model.getParent(currentId);

  while (parentId) {
    const siblings = model.getChildren(parentId);
    const nextSibling = findFirstFocusable(model, siblings.slice(siblings.indexOf(currentId) + 1));

    if (nextSibling) {
      return nextSibling;
    }

    currentId = parentId;
    parentId = model.getParent(currentId);
  }

  return null;
}

function getPreviousTreeNode(model: ITreeKeyboardNavigationModel, nodeId: string): string | null {
  let currentId = nodeId;
  let parentId = model.getParent(currentId);

  while (parentId) {
    const siblings = model.getChildren(parentId);

    for (let i = siblings.indexOf(currentId) - 1; i >= 0; i--) {
      const previousSibling = findDeepestFocusable(model, siblings[i]!);

      if (previousSibling) {
        return previousSibling;
      }
    }

    if (isFocusable(model, parentId)) {
      return parentId;
    }

    currentId = parentId;
    parentId = model.getParent(currentId);
  }

  return null;
}

export function getTreeKeyboardAction(model: ITreeKeyboardNavigationModel, nodeId: string, key: string): TreeKeyboardAction | null {
  switch (key) {
    case 'ArrowDown': {
      const nextNode = getNextTreeNode(model, nodeId);
      return nextNode ? { type: 'focus', nodeId: nextNode } : null;
    }
    case 'ArrowUp': {
      const previousNode = getPreviousTreeNode(model, nodeId);
      return previousNode ? { type: 'focus', nodeId: previousNode } : null;
    }
    case 'ArrowRight': {
      if (model.isLeaf(nodeId)) {
        return null;
      }

      if (!model.isExpanded(nodeId)) {
        return { type: 'expand', expanded: true };
      }

      const child = findFirstFocusable(model, model.getChildren(nodeId));
      return child ? { type: 'focus', nodeId: child } : null;
    }
    case 'ArrowLeft': {
      if (model.isExpanded(nodeId) && !model.isLeaf(nodeId)) {
        return { type: 'expand', expanded: false };
      }

      let parentId = model.getParent(nodeId);

      while (parentId && !isFocusable(model, parentId)) {
        parentId = model.getParent(parentId);
      }

      return parentId ? { type: 'focus', nodeId: parentId } : null;
    }
    case 'Enter':
      if (!model.isLeaf(nodeId)) {
        return { type: 'expand', expanded: !model.isExpanded(nodeId) };
      }

      return { type: 'activate' };
    default:
      return null;
  }
}
