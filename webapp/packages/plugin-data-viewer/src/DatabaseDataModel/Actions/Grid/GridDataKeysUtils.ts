/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from './IGridDataKey.js';

export type SerializableKey = IGridColumnKey | IGridRowKey;

export const GridDataKeysUtils = {
  serializeElementKey(elementKey: IGridDataKey): string {
    return this.serialize(elementKey.column) + '.' + this.serialize(elementKey.row);
  },
  isElementsKeyEqual(a: IGridDataKey, b: IGridDataKey): boolean {
    return this.isEqual(a.column, b.column) && this.isEqual(a.row, b.row);
  },
  serialize(key: SerializableKey): string {
    let base = `${key.index}`;

    if ('subIndex' in key) {
      base += `.${key.subIndex}`;
    }

    return base;
  },
  isEqual<T extends SerializableKey>(a: T, b: T): boolean {
    if (a.index !== b.index) {
      return false;
    }

    const keyA = 'subIndex' in a;
    const keyB = 'subIndex' in b;

    if (keyA !== keyB) {
      return false;
    }

    if (keyA && (a as IGridRowKey).subIndex !== (b as IGridRowKey).subIndex) {
      return false;
    }

    return true;
  },
};
