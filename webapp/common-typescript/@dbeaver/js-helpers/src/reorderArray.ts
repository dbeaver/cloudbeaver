/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

type ReorderPosition = 'before' | 'after';

export interface ReorderItemTarget<T> {
  item: T;
  position: ReorderPosition;
}

function reorderByIndices<T>(arr: T[], from: number, to: number): T[] {
  if (from < 0 || from >= arr.length || to < 0 || to >= arr.length || from === to) {
    return arr;
  }
  const newArray = [...arr];
  const item = newArray.splice(from, 1)[0]!;
  newArray.splice(to, 0, item);
  return newArray;
}

function getInsertIndex(fromIndex: number, targetIndex: number, position?: ReorderPosition): number {
  if (position === undefined) {
    return targetIndex;
  }
  let insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  if (fromIndex < targetIndex) {
    insertIndex--;
  }
  return insertIndex;
}

export function reorderArray<T>(array: T[], from: number, to: number): T[];
export function reorderArray<T>(array: T[], sourceItem: T, target: number): T[];
export function reorderArray<T>(array: T[], sourceItem: T, target: ReorderItemTarget<T>): T[];
export function reorderArray<T>(array: T[], sourceItemOrFrom: T | number, targetOrTo: number | ReorderItemTarget<T>): T[] {
  const fromIndex = typeof sourceItemOrFrom === 'number' && typeof targetOrTo === 'number' ? sourceItemOrFrom : array.indexOf(sourceItemOrFrom as T);
  let targetIndex, position;

  if (typeof targetOrTo === 'number') {
    targetIndex = targetOrTo;
    position = undefined;
  } else {
    targetIndex = array.indexOf(targetOrTo.item);
    position = targetOrTo.position;
  }

  const insertIndex = getInsertIndex(fromIndex, targetIndex, position);

  return reorderByIndices(array, fromIndex, insertIndex);
}

export interface ReorderArrayWithOrderOptions<T> {
  getId: (item: T) => string;
  getOrder: (item: T) => number;
  setOrder: (item: T, order: number) => void;
}

type DefaultOrderItem = { id: string; order: number };

/**
 * Reorders items in an array by updating their order property.
 * MUTATES the original array.
 */
export function reorderArrayWithOrder<T extends DefaultOrderItem>(
  array: T[],
  draggedItemId: string,
  targetItemId: string,
  position: ReorderPosition,
): void;
export function reorderArrayWithOrder<T>(
  array: T[],
  draggedItemId: string,
  targetItemId: string,
  position: ReorderPosition,
  options: ReorderArrayWithOrderOptions<T>,
): void;
export function reorderArrayWithOrder<T>(
  array: T[],
  draggedItemId: string,
  targetItemId: string,
  position: ReorderPosition,
  options?: ReorderArrayWithOrderOptions<T>,
): void {
  const getId = options?.getId ?? ((item: any) => item.id);
  const getOrder = options?.getOrder ?? ((item: any) => item.order);
  const setOrder = options?.setOrder ?? ((item: any, order: number) => { item.order = order; });

  const draggedItem = array.find(item => getId(item) === draggedItemId);
  const targetItem = array.find(item => getId(item) === targetItemId);

  if (!draggedItem || !targetItem || draggedItem === targetItem) {
    return;
  }

  const draggedOrder = getOrder(draggedItem);
  const targetOrder = getOrder(targetItem);
  
  const newOrder = position === 'before' ? targetOrder : targetOrder + 1;

  if (draggedOrder < newOrder) {
    for (const item of array) {
      const itemOrder = getOrder(item);
      if (itemOrder > draggedOrder && itemOrder < newOrder) {
        setOrder(item, itemOrder - 1);
      }
    }
    setOrder(draggedItem, newOrder - 1);
  } else if (draggedOrder > newOrder) {
    for (const item of array) {
      const itemOrder = getOrder(item);
      if (itemOrder >= newOrder && itemOrder < draggedOrder) {
        setOrder(item, itemOrder + 1);
      }
    }
    setOrder(draggedItem, newOrder);
  }
}
