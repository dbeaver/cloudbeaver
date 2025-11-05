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

export function reorderArray<T>(array: T[], sourceItem: T, target: number): T[];
export function reorderArray<T>(array: T[], sourceItem: T, target: ReorderItemTarget<T>): T[];
export function reorderArray<T>(array: T[], sourceItem: T, target: number | ReorderItemTarget<T>): T[] {
  const fromIndex = array.indexOf(sourceItem);
  let finalTargetIndex: number;

  if (typeof target === 'number') {
    finalTargetIndex = target;
  } else {
    finalTargetIndex = array.indexOf(target.item);
  }

  if (fromIndex === -1 || finalTargetIndex === -1 || fromIndex === finalTargetIndex) {
    return array;
  }

  const reordered = [...array];

  let insertIndex: number;

  if (typeof target === 'number') {
    insertIndex = finalTargetIndex;
  } else {
    insertIndex = target.position === 'before' ? finalTargetIndex : finalTargetIndex + 1;
    if (fromIndex < finalTargetIndex) {
      insertIndex--;
    }
  }

  reordered.splice(fromIndex, 1);
  reordered.splice(insertIndex, 0, sourceItem);

  return reordered;
}
