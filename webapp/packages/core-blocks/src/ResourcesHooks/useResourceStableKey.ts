/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { CachedResourceContext, CachedResourceKey, Resource, ResourceKey } from '@cloudbeaver/core-resource';
import { useObjectRef } from '../useObjectRef.js';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export interface ResourceKeyWithIncludes<TKey, TIncludes> {
  readonly key: TKey | null;
  readonly includes: TIncludes;
}

interface IResourceStableKey<
  TResource extends Resource<any, any, any, any>,
  TKeyArg extends ResourceKey<CachedResourceKey<TResource>>,
  TIncludes extends CachedResourceContext<TResource>,
> {
  key: ResourceKey<TKeyArg> | null;
  includes: TIncludes;
  isChanged: boolean;
}

export function useResourceStableKey<
  TResource extends Resource<any, any, any, any>,
  TKeyArg extends ResourceKey<CachedResourceKey<TResource>>,
  TIncludes extends CachedResourceContext<TResource>,
>(
  resource: TResource,
  keyObj: TResource extends any ? TKeyArg | null | ResourceKeyWithIncludes<TKeyArg, TIncludes> : never,
): IResourceStableKey<TResource, TKeyArg, TIncludes> {
  let key: ResourceKey<TKeyArg> | null = keyObj as ResourceKey<TKeyArg>;
  let includes: TIncludes = [] as unknown as TIncludes;

  if (isKeyWithIncludes<TKeyArg, TIncludes>(keyObj)) {
    key = keyObj.key;
    includes = keyObj.includes;
  }

  const propertiesRef = useObjectRef(
    () => ({
      key,
      includes,
    }),
    false,
  );

  let isChanged = false;
  if (!isArraysEqual(includes, propertiesRef.includes)) {
    propertiesRef.includes = includes;
    isChanged = true;
  }

  if (key === null || propertiesRef.key === null || !resource.isEqual(key, propertiesRef.key)) {
    if (propertiesRef.key !== key) {
      propertiesRef.key = key;
      isChanged = true;
    }
  }

  key = propertiesRef.key;
  includes = propertiesRef.includes;

  return {
    key,
    includes,
    isChanged,
  };
}

function isKeyWithIncludes<TKey, TIncludes>(obj: any): obj is ResourceKeyWithIncludes<TKey, TIncludes> {
  return obj && typeof obj === 'object' && 'includes' in obj && 'key' in obj;
}
