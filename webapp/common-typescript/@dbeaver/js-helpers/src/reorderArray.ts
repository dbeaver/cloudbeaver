/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ReorderItemTarget<T> {
  item: T;
  position: 'before' | 'after';
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

function getInsertIndex(fromIndex: number, targetIndex: number, position?: 'before' | 'after'): number {
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
