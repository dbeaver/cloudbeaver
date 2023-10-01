/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { CachedResource, CachedResourceParamKey } from './CachedResource';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata';

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

  async refresh<T extends CachedResourceIncludeArgs<TData, TContext> = []>(param: TKey, context?: T): Promise<CachedResourceValueIncludes<TData, T>> {
    if (param === undefined) {
      param = CachedResourceParamKey as TKey;
    }
    await this.loadData(param, true, context);
    return this.data as CachedResourceValueIncludes<TData, T>;
  }

  async load<T extends CachedResourceIncludeArgs<TData, TContext> = []>(param: TKey, context?: T): Promise<CachedResourceValueIncludes<TData, T>> {
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
  param: TKey,
  context?: CachedResourceIncludeArgs<TData, TContext>,
  lazy?: boolean,
): ILoadableState {
  return {
    lazy,
    get exception() {
      return resource.getException(param);
    },
    isLoading() {
      return resource.isLoading(param);
    },
    isError() {
      return isContainsException(this.exception);
    },
    isLoaded() {
      return resource.isLoaded(param, context);
    },
    isOutdated() {
      return resource.isOutdated(param);
    },
    async load() {
      await resource.load(param, context);
    },
    async reload() {
      await resource.refresh(param, context);
    },
  };
}
