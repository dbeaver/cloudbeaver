/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export class ResourceKeyList<TKey> {
  readonly list: TKey[];

  constructor(list: TKey[] | TKey) {
    this.list = Array.isArray(list) ? list : [list];
  }

  includes(key: ResourceKeyList<TKey> | TKey): boolean {
    if(isResourceKeyList(key)){
      return key.list.some(key => this.list.includes(key));
    }
    return this.list.includes(key);
  }
}

export function isResourceKeyList<T>(data: any): data is ResourceKeyList<T> {
  return data instanceof ResourceKeyList;
}

export function resourceKeyList<T>(list: T[]): ResourceKeyList<T> {
  return new ResourceKeyList(list);
}