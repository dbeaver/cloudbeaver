/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isPrimitive } from './isPrimitive.js';

const isObjectEqual = <T>(a: T, b: T) => a === b;

export function isArraysEqual<T>(first: T[], second: T[], isEqual: (a: T, b: T) => boolean = isObjectEqual, order?: boolean): boolean {
  if (first.length !== second.length) {
    return false;
  }

  const map = new Map<T, number>();

  for (let i = 0; i < first.length; i++) {
    const currentFirst = first[i]!;
    const currentSecond = second[i]!;

    if (order && !isEqual(currentFirst, currentSecond)) {
      return false;
    }

    map.set(currentFirst, (map.get(currentFirst) ?? 0) + 1);
  }

  if (order) {
    return true;
  }

  for (let i = 0; i < second.length; i++) {
    const currentSecond = second[i]!;
    const isPrimitiveValue = isPrimitive(currentSecond);

    if (!isPrimitiveValue) {
      for (let j = 0; j < first.length; j++) {
        if (isEqual(first[j]!, currentSecond)) {
          map.set(currentSecond, Number(map.get(currentSecond)) - 1);
          break;
        }

        if (j === first.length - 1) {
          return false;
        }
      }
      continue;
    }

    const mapValue = map.get(currentSecond);

    if (mapValue === undefined || mapValue <= 0) {
      return false;
    }

    map.set(currentSecond, Number(map.get(currentSecond)) - 1);
  }

  return true;
}
