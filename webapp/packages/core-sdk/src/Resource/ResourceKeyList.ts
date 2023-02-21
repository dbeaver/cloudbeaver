/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type ResourceKey<TKey> = TKey | ResourceKeyList<TKey>;
export type ResourceKeyType<TKey> = TKey extends ResourceKeyList<infer I> ? I : TKey;
export type SingleResourceKey<T> = Exclude<T, Exclude<T, ResourceKeyList<any>>> extends ResourceKeyList<infer TKey>
  ? TKey
  : T;

export class ResourceKeyList<TKey> {
  readonly list: TKey[];
  readonly mark: any;

  constructor(list: TKey[] | TKey, mark?: any) {
    this.list = Array.isArray(list) ? list : [list];
    this.mark = mark;
  }

  includes(
    key: ResourceKeyList<TKey> | TKey,
    isEqual = (keyA: TKey, keyB: TKey) => keyA === keyB
  ): boolean {
    if (isResourceKeyList(key)) {
      return key.list.some(key => this.includes(key, isEqual));
    }

    return this.list.some(current => isEqual(current, key));
  }

  toString(): string {
    const list = this.list.map(s => {
      if (typeof s === 'symbol') {
        return s.toString();
      }

      return s;
    });
    return `ResourceKeyList(${list.join()})${this.mark !== undefined ? '@' + this.mark : ''}`;
  }
}

interface MapFnc {
  <TKey, TValue>(key: ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue): TValue[];
  <TKey, TValue>(
    key: ResourceKey<TKey>,
    selector: (key: TKey, index: number) => TValue
  ): TKey extends ResourceKeyList<any> ? TValue[] : TValue;
}

export interface ResourceKeyUtils {
  isEmpty: <TKey>(key: ResourceKey<TKey>) => boolean;
  hasMark: <TKey>(key: ResourceKey<TKey>, mark: any) => boolean;
  count: <TKey>(key: ResourceKey<TKey>) => number;
  first: <TKey>(key: ResourceKey<TKey>) => TKey;
  forEach: <TKey>(key: ResourceKey<TKey>, action: (key: TKey, index: number) => any) => void;
  forEachAsync: <TKey>(key: ResourceKey<TKey>, action: (key: TKey, index: number) => Promise<any>) => Promise<void>;
  some: <TKey>(key: ResourceKey<TKey>, predicate: (key: TKey, index: number) => boolean) => boolean;
  every: <TKey>(key: ResourceKey<TKey>, predicate: (key: TKey, index: number) => boolean) => boolean;
  map: MapFnc;
  toArray: <TKey>(key: ResourceKey<TKey>) => TKey[];
  filter: <TKey>(key: ResourceKey<TKey>, filter: (key: TKey) => boolean) => TKey[];
  mapKey: <TKey, TValue>(key: ResourceKey<TKey>, selector: (key: TKey, index: number) => TValue) => ResourceKey<TValue>;
  mapArray: <TKey, TValue>(key: ResourceKey<TKey>, selector: (key: TKey, index: number) => TValue) => TValue[];
  includes: <TKey>(
    first: ResourceKey<TKey>,
    second: ResourceKey<TKey>,
    isEqual?: (keyA: TKey, keyB: TKey) => boolean
  ) => boolean;
  exclude: <TKey>(first: ResourceKeyList<TKey>, second: ResourceKey<TKey>) => ResourceKeyList<TKey>;
  join: <TKey>(...keys: Array<ResourceKey<TKey>>) => ResourceKeyList<TKey>;
  add: <TKey>(key: ResourceKey<TKey>, ...elements: TKey[]) => ResourceKeyList<TKey>;
  toList: <TKey>(key: ResourceKey<TKey>) => ResourceKeyList<TKey>;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ResourceKeyUtils: ResourceKeyUtils = {
  isEmpty<TKey>(
    key: ResourceKey<TKey>
  ): boolean {
    if (isResourceKeyList(key)) {
      return key.list.length === 0;
    } else {
      return false;
    }
  },

  hasMark<TKey>(
    key: ResourceKey<TKey>,
    mark: any
  ): boolean {
    if (isResourceKeyList(key)) {
      return key.mark === mark;
    } else {
      return false;
    }
  },

  count<TKey>(
    key: ResourceKey<TKey>
  ): number {
    if (isResourceKeyList(key)) {
      return key.list.length;
    } else {
      return 0;
    }
  },

  first<TKey>(
    key: ResourceKey<TKey>
  ): TKey {
    if (isResourceKeyList(key)) {
      return key.list[0];
    } else {
      return key;
    }
  },

  forEach<TKey>(
    key: ResourceKey<TKey>,
    action: (key: TKey, index: number) => any | Promise<any>
  ): void {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        action(key.list[i], i);
      }
    } else {
      action(key, -1);
    }
  },

  async forEachAsync<TKey>(
    key: ResourceKey<TKey>,
    action: (key: TKey, index: number) => any | Promise<any>
  ): Promise<void> {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        await action(key.list[i], i);
      }
    } else {
      await action(key, -1);
    }
  },

  some<TKey>(key: ResourceKey<TKey>, predicate: (key: TKey, index: number) => boolean): boolean {
    if (isResourceKeyList(key)) {
      return key.list.some(predicate);
    } else {
      return predicate(key, -1);
    }
  },

  every<TKey>(key: ResourceKey<TKey>, predicate: (key: TKey, index: number) => boolean): boolean {
    if (isResourceKeyList(key)) {
      return key.list.every(predicate);
    } else {
      return predicate(key, -1);
    }
  },
  toArray<TKey>(key: ResourceKey<TKey>): TKey[] {
    if (isResourceKeyList(key)) {
      return key.list;
    } else {
      return [key];
    }
  },
  filter<TKey>(key: ResourceKey<TKey>, filter: (key: TKey) => boolean): TKey[] {
    return this.toArray(key).filter(filter);
  },

  mapKey<TKey, TValue>(key: ResourceKey<TKey>, selector: (key: TKey, index: number) => TValue): ResourceKey<TValue> {
    if (isResourceKeyList(key)) {
      return resourceKeyList(key.list.map(selector), key.mark);
    } else {
      return selector(key, -1);
    }
  },

  map<TKey, TValue>(key: ResourceKey<TKey>, selector: (key: TKey, index: number) => TValue): TValue | TValue[] {
    if (isResourceKeyList(key)) {
      return key.list.map(selector);
    } else {
      return selector(key, -1);
    }
  },

  mapArray<TKey, TValue>(key: ResourceKey<TKey>, selector: (key: TKey, index: number) => TValue): TValue[] {
    if (isResourceKeyList(key)) {
      return key.list.map(selector);
    } else {
      return [selector(key, -1)];
    }
  },

  includes<TKey>(
    param: ResourceKey<TKey>,
    key: ResourceKey<TKey>,
    isEqual = (keyA: TKey, keyB: TKey) => keyA === keyB
  ): boolean {
    if (param === key) {
      return true;
    }

    if (isResourceKeyList(param)) {
      return param.includes(key);
    }

    if (isResourceKeyList(key)) {
      return key.includes(param);
    }

    return isEqual(param, key);
  },

  exclude<TKey>(param: ResourceKeyList<TKey>, key: ResourceKey<TKey>): ResourceKeyList<TKey> {
    if (isResourceKeyList(key)) {
      return resourceKeyList(param.list.filter(param => !key.list.includes(param)), param.mark);
    }

    return resourceKeyList(param.list.filter(param => param !== key), param.mark);
  },

  join<TKey>(...keys: Array<ResourceKey<TKey>>): ResourceKeyList<TKey> {
    const list: TKey[] = [];

    for (const param of keys) {
      if (isResourceKeyList(param)) {
        list.push(...param.list);
      } else {
        list.push(param);
      }
    }

    return resourceKeyList(list);
  },

  add<TKey>(key: ResourceKey<TKey>, ...elements: TKey[]): ResourceKeyList<TKey> {
    const list: TKey[] = [];

    if (isResourceKeyList(key)) {
      list.push(...key.list);
    } else {
      list.push(key);
    }

    list.push(...elements);

    return resourceKeyList(list);
  },

  toList<TKey>(key: ResourceKey<TKey>): ResourceKeyList<TKey> {
    if (isResourceKeyList(key)) {
      return key;
    }

    return resourceKeyList([key]);
  },
};

export function isResourceKeyList<T>(data: any): data is ResourceKeyList<T> {
  return data instanceof ResourceKeyList;
}

export function resourceKeyList<T>(list: T[], mark?: any): ResourceKeyList<T> {
  return new ResourceKeyList(list, mark);
}
