/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const TREE_ITEM_SELECTOR = '[role="treeitem"][data-tree-node-id]';

export function focusTreeItem(element: HTMLElement): void {
  element.focus({ preventScroll: true });
  // A tree item includes its expanded children; reveal only the row or its loading placeholder.
  const row = element.querySelector<HTMLElement>(':scope > [data-tree-node-content]') ?? element.firstElementChild ?? element;
  row.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
}

export function getFallbackNodeId(
  nodeId: string,
  parentId: string | null | undefined,
  rootId: string,
  previousVisibleNodeIds: string[],
  visibleNodeIds: string[],
): string | null {
  if (parentId && parentId !== rootId && visibleNodeIds.includes(parentId)) {
    return parentId;
  }

  const previousIndex = previousVisibleNodeIds.indexOf(nodeId);
  const nextVisibleNodeId = previousVisibleNodeIds.slice(previousIndex + 1).find(id => visibleNodeIds.includes(id));
  if (nextVisibleNodeId !== undefined) {
    return nextVisibleNodeId;
  }

  const previousVisibleNodeId = previousVisibleNodeIds
    .slice(0, Math.max(previousIndex, 0))
    .reverse()
    .find(id => visibleNodeIds.includes(id));

  return previousVisibleNodeId ?? visibleNodeIds[0] ?? null;
}

export function getKeyboardEventTreeItem(event: React.KeyboardEvent<HTMLElement>): HTMLElement | null {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  let treeItem: HTMLElement | null = null;
  if (target.matches(TREE_ITEM_SELECTOR)) {
    treeItem = target;
  } else if (isTreeItemButton(target)) {
    treeItem = target.closest<HTMLElement>(TREE_ITEM_SELECTOR);
  }

  return treeItem?.closest('[role="tree"]') === event.currentTarget ? treeItem : null;
}

function isTreeItemButton(element: HTMLElement): boolean {
  if (element.closest('[role="menu"]') || element.matches('input,textarea,select,[role="checkbox"],[role="radio"],[role="menuitem"]')) {
    return false;
  }

  const role = element.getAttribute('role');
  return (element instanceof HTMLButtonElement && (!role || role === 'button')) || role === 'button';
}
