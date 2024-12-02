/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey.js';

export type SerializableKey = IResultSetColumnKey | IResultSetRowKey;

export const ResultSetDataKeysUtils = {
  serializeElementKey(elementKey: IResultSetElementKey): string {
    return this.serialize(elementKey.column) + '.' + this.serialize(elementKey.row);
  },
  isElementsKeyEqual(a: IResultSetElementKey, b: IResultSetElementKey) {
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

    if (keyA && (a as IResultSetRowKey).subIndex !== (b as IResultSetRowKey).subIndex) {
      return false;
    }

    return true;
  },
};
