/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { CachedResource, CachedResourceParamKey } from './CachedResource.js';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';

export type CachedDataResourceData<TResource> = TResource extends CachedDataResource<infer T, any, any> ? T : never;
export type CachedDataResourceKey<TResource> = TResource extends CachedDataResource<any, infer T, any> ? T : never;

export type CachedDataResourceGetter<TValue, TIncludes> = TValue extends null
  ? CachedResourceValueIncludes<TValue, TIncludes> | null
  : CachedResourceValueIncludes<TValue, TIncludes>;

/**
 * CachedDataResource is a resource that stores data that has no identifiers.
 */
export abstract class CachedDataResource<
  TData,
  TKey = void,
  TContext extends Record<string, any> = Record<string, never>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> extends CachedResource<TData, TData, TKey, CachedResourceIncludeArgs<TData, TContext>, TMetadata> {
  constructor(
    defaultValue: () => TData,
    defaultKey: TKey = undefined as TKey,
    defaultIncludes: CachedResourceIncludeArgs<TData, TContext> = [] as any,
  ) {
    super(defaultKey, defaultValue, defaultIncludes);
  }

  override async refresh<T extends CachedResourceIncludeArgs<TData, TContext> = []>(
    param: TKey,
    context?: T,
  ): Promise<CachedResourceValueIncludes<TData, T>> {
    if (param === undefined) {
      param = CachedResourceParamKey as TKey;
    }
    await this.loadData(param, true, context);
    return this.data as CachedResourceValueIncludes<TData, T>;
  }

  override async load<T extends CachedResourceIncludeArgs<TData, TContext> = []>(
    param: TKey,
    context?: T,
  ): Promise<CachedResourceValueIncludes<TData, T>> {
    if (param === undefined) {
      param = CachedResourceParamKey as TKey;
    }
    await this.loadData(param, false, context);
    return this.data as CachedResourceValueIncludes<TData, T>;
  }

  protected validateKey(key: TKey): boolean {
    return key === undefined;
  }
}

export function getCachedDataResourceLoaderState<TData, TKey = void, TContext extends Record<string, any> = Record<string, never>>(
  resource: CachedDataResource<TData, TKey, TContext>,
  getKey: () => TKey,
  getIncludes?: () => CachedResourceIncludeArgs<TData, TContext> | undefined,
  lazy?: boolean,
): ILoadableState {
  return {
    lazy,
    get exception() {
      return resource.getException(getKey());
    },
    isLoading() {
      return resource.isLoading(getKey());
    },
    isError() {
      return isContainsException(this.exception);
    },
    isLoaded() {
      return resource.isLoaded(getKey(), getIncludes?.());
    },
    isOutdated() {
      return resource.isOutdated(getKey(), getIncludes?.());
    },
    async load() {
      await resource.load(getKey(), getIncludes?.());
    },
    async reload() {
      await resource.refresh(getKey(), getIncludes?.());
    },
  };
}
