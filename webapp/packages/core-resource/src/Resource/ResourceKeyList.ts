/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isArraysEqual } from '@cloudbeaver/core-utils';

export class ResourceKeyList<TKey> extends Array<TKey> {
  static get [Symbol.species!]() {
    return Array;
  }

  isEqual(key: ResourceKeyList<TKey>, isEqual?: (a: TKey, b: TKey) => boolean): boolean {
    return isArraysEqual(this, key, isEqual, true);
  }

  override includes(key: TKey, fromIndex?: number): boolean;
  override includes(key: TKey | ResourceKeyList<TKey>): boolean;
  override includes(key: TKey | ResourceKeyList<TKey>, isEqual: (keyA: TKey, keyB: TKey) => boolean): boolean;
  override includes(key: TKey | ResourceKeyList<TKey>, dynamic?: number | ((keyA: TKey, keyB: TKey) => boolean)): boolean;
  override includes(key: TKey | ResourceKeyList<TKey>, dynamic?: number | ((keyA: TKey, keyB: TKey) => boolean)): boolean {
    let fromIndex = 0;
    let isEqual = (keyA: TKey, keyB: TKey) => keyA === keyB;

    if (typeof dynamic === 'number') {
      fromIndex = dynamic;
    } else if (typeof dynamic === 'function') {
      isEqual = dynamic;
    }

    if (isResourceKeyList(key)) {
      if (this.length === 0 && key.length === 0) {
        return true;
      }
      return key.some(key => this.includes(key, dynamic));
    }

    return this.some((current, index) => index >= fromIndex && isEqual(current, key));
  }

  exclude(key: TKey | ResourceKeyList<TKey>): ResourceKeyList<TKey> {
    if (isResourceKeyList(key)) {
      return resourceKeyList(this.filter(param => !key.includes(param)));
    }

    return resourceKeyList(this.filter(param => param !== key));
  }

  override toString(): string {
    const list = this.map(s => {
      if (typeof s === 'symbol') {
        return s.toString();
      }

      return JSON.stringify(s);
    }).sort((a, b) => a.localeCompare(b));
    return `ResourceKeyList(${list.join()})`;
  }
}

export function isResourceKeyList<T>(data: any): data is ResourceKeyList<T> {
  return data instanceof ResourceKeyList;
}

export function resourceKeyList<T>(list: T[]): ResourceKeyList<T> {
  return new ResourceKeyList(...list);
}
