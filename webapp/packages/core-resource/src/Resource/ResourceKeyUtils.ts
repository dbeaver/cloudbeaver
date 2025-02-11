/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResourceKey, ResourceKeySimple } from './ResourceKey.js';
import { isResourceKeyList, type ResourceKeyList, resourceKeyList } from './ResourceKeyList.js';

interface MapFnc {
  <TKey, TValue>(key: TKey | ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue): TValue | TValue[];
  <TKey, TValue>(key: ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue): TValue[];
  <TKey, TValue>(key: TKey, selector: (key: TKey, index: number) => TValue): TValue;
}

export interface ResourceKeyUtils {
  forEach: <TKey extends ResourceKey<unknown>>(key: TKey, action: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => any) => void;
  forEachAsync: <TKey extends ResourceKey<unknown>>(
    key: TKey,
    action: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => Promise<any>,
  ) => Promise<void>;
  some: <TKey extends ResourceKey<unknown>>(
    key: TKey,
    predicate: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => boolean,
  ) => boolean;
  every: <TKey extends ResourceKey<unknown>>(
    key: TKey,
    predicate: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => boolean,
  ) => boolean;
  map: MapFnc;
  filter: <TKey>(key: TKey | ResourceKeyList<TKey>, filter: (key: TKey) => boolean) => TKey[];
  mapKey: <TKey, TValue>(key: TKey | ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue) => ResourceKeySimple<TValue>;
  mapArray: <TKey, TValue>(key: TKey | ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue) => TValue[];
  isIntersect: <TKey>(
    first: TKey | ResourceKeyList<TKey>,
    second: TKey | ResourceKeyList<TKey>,
    isEqual?: (keyA: TKey, keyB: TKey) => boolean,
  ) => boolean;
  isEqual: <TKey>(
    first: TKey | ResourceKeyList<TKey>,
    second: TKey | ResourceKeyList<TKey>,
    isEqualFn?: (keyA: TKey, keyB: TKey) => boolean,
  ) => boolean;
  join: <TKey>(...keys: Array<TKey | ResourceKeyList<TKey>>) => ResourceKeyList<TKey>;
  toArray: <TKey>(key: TKey | ResourceKeyList<TKey>) => TKey[];
  toList: <TKey>(key: TKey | ResourceKeyList<TKey>) => ResourceKeyList<TKey>;
}

export const ResourceKeyUtils: ResourceKeyUtils = {
  forEach<TKey extends ResourceKey<unknown>>(
    key: TKey,
    action: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => any | Promise<any>,
  ): void {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.length; i++) {
        action(key[i] as Exclude<TKey, ResourceKeyList<unknown>>, i);
      }
    } else {
      action(key as Exclude<TKey, ResourceKeyList<unknown>>, -1);
    }
  },
  async forEachAsync<TKey extends ResourceKey<unknown>>(
    key: TKey,
    action: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => any | Promise<any>,
  ): Promise<void> {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.length; i++) {
        await action(key[i] as Exclude<TKey, ResourceKeyList<unknown>>, i);
      }
    } else {
      await action(key as Exclude<TKey, ResourceKeyList<unknown>>, -1);
    }
  },
  some<TKey extends ResourceKey<unknown>>(key: TKey, predicate: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => boolean): boolean {
    if (isResourceKeyList<Exclude<TKey, ResourceKeyList<unknown>>>(key)) {
      return key.some(predicate);
    } else {
      return predicate(key as Exclude<TKey, ResourceKeyList<unknown>>, -1);
    }
  },
  every<TKey extends ResourceKey<unknown>>(key: TKey, predicate: (key: Exclude<TKey, ResourceKeyList<unknown>>, index: number) => boolean): boolean {
    if (isResourceKeyList<Exclude<TKey, ResourceKeyList<unknown>>>(key)) {
      return key.every(predicate);
    } else {
      return predicate(key as Exclude<TKey, ResourceKeyList<unknown>>, -1);
    }
  },
  filter<TKey>(key: TKey | ResourceKeyList<TKey>, filter: (key: TKey) => boolean): TKey[] {
    return this.toArray(key).filter(filter);
  },
  mapKey<TKey, TValue>(key: TKey | ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue): ResourceKeySimple<TValue> {
    if (isResourceKeyList(key)) {
      return resourceKeyList(key.map(selector));
    } else {
      return selector(key, -1);
    }
  },
  map<TKey, TValue>(key: TKey | ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue): TValue | TValue[] {
    if (isResourceKeyList(key)) {
      return key.map(selector);
    } else {
      return selector(key, -1);
    }
  },
  mapArray<TKey, TValue>(key: TKey | ResourceKeyList<TKey>, selector: (key: TKey, index: number) => TValue): TValue[] {
    if (isResourceKeyList(key)) {
      return key.map(selector);
    } else {
      return [selector(key, -1)];
    }
  },
  isIntersect<TKey>(
    param: TKey | ResourceKeyList<TKey>,
    key: TKey | ResourceKeyList<TKey>,
    isEqual = (keyA: TKey, keyB: TKey) => keyA === keyB,
  ): boolean {
    if (param === key) {
      return true;
    }

    if (isResourceKeyList(param)) {
      return param.includes(key, isEqual);
    }

    if (isResourceKeyList(key)) {
      return key.includes(param, isEqual);
    }

    return isEqual(param, key);
  },
  isEqual<TKey>(
    param: TKey | ResourceKeyList<TKey>,
    key: TKey | ResourceKeyList<TKey>,
    isEqualFn = (keyA: TKey, keyB: TKey) => keyA === keyB,
  ): boolean {
    if (param === key) {
      return true;
    }

    if (isResourceKeyList(param) && isResourceKeyList(key)) {
      return param.isEqual(key, isEqualFn);
    }

    if (isResourceKeyList(key) || isResourceKeyList(param)) {
      return false;
    }

    return isEqualFn(param, key);
  },
  join<TKey>(...keys: Array<TKey | ResourceKeyList<TKey>>): ResourceKeyList<TKey> {
    const list: TKey[] = [];

    for (const param of keys) {
      if (isResourceKeyList(param)) {
        list.push(...param);
      } else {
        list.push(param);
      }
    }

    return resourceKeyList(list);
  },
  toArray<TKey>(key: TKey | ResourceKeyList<TKey>): TKey[] {
    if (isResourceKeyList(key)) {
      return key;
    } else {
      return [key];
    }
  },
  toList<TKey>(key: TKey | ResourceKeyList<TKey>): ResourceKeyList<TKey> {
    if (isResourceKeyList(key)) {
      return key;
    }

    return resourceKeyList([key]);
  },
};
