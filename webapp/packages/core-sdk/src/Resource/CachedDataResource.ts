/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { CachedResource } from './CachedResource';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes';

export type CachedDataResourceData<TResource> = TResource extends CachedDataResource<infer T, any, any, any>
  ? T
  : never;
export type CachedDataResourceParam<TResource> = TResource extends CachedDataResource<any, infer T, any, any>
  ? T
  : never;
export type CachedDataResourceKey<TResource> = TResource extends CachedDataResource<any, any, infer T, any>
  ? T
  : never;

export type CachedDataResourceGetter<
  TValue,
  TIncludes
> = (
  TValue extends null
    ? CachedResourceValueIncludes<TValue, TIncludes> | null
    : CachedResourceValueIncludes<TValue, TIncludes>
);

export abstract class CachedDataResource<
  TData,
  TParam = void,
  TKey = TParam,
  TContext extends Record<string, any> = Record<string, never>
> extends CachedResource<
  TData,
  TData,
  TParam,
  TKey,
  CachedResourceIncludeArgs<TData, TContext>
  > {
  protected loaded: boolean;

  constructor(defaultValue: TData, defaultIncludes: CachedResourceIncludeArgs<TData, TContext> = [] as any) {
    super(defaultValue, defaultIncludes);

    this.loaded = false;

    makeObservable<this, 'loaded'>(this, {
      loaded: observable,
    });

    this.onDataUpdate.addHandler(() => { this.loaded = true; });
  }

  isLoaded(param: TParam, includes?: CachedResourceIncludeArgs<TData, TContext>): boolean {
    if (!this.loaded) {
      return false;
    }

    param = this.transformParam(param);

    if (includes) {
      const metadata = this.getMetadata(param);

      if ((includes as string[]).some(include => !metadata.includes.includes(include))) {
        return false;
      }
    }
    return true;
  }

  async refresh<T extends CachedResourceIncludeArgs<TData, TContext> = []>(
    param: TParam,
    context?: T
  ): Promise<CachedResourceValueIncludes<TData, T>> {
    await this.preLoadData(param, false, context);
    await this.loadData(param, true, context);
    return this.data as CachedResourceValueIncludes<TData, T>;
  }

  async load<T extends CachedResourceIncludeArgs<TData, TContext> = []>(
    param: TParam,
    context?: T
  ): Promise<CachedResourceValueIncludes<TData, T>> {
    await this.preLoadData(param, false, context);
    await this.loadData(param, false, context);
    return this.data as CachedResourceValueIncludes<TData, T>;
  }


  protected validateParam(param: TParam): boolean {
    return (
      super.validateParam(param)
      || typeof param === 'undefined'
    );
  }
}

export function getCachedDataResourceLoaderState<
  TData,
  TParam = void,
  TKey = TParam,
  TContext extends Record<string, any> = Record<string, never>,
>(
  resource: CachedDataResource<TData, TParam, TKey, TContext>,
  param: TParam,
  context?: CachedResourceIncludeArgs<TData, TContext>
): ILoadableState {
  return {
    get exception() {
      return resource.getException(param);
    },
    isLoading() {
      return resource.isDataLoading(param);
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
    load() {
      return resource.load(param, context);
    },
    reload() {
      return resource.refresh(param, context);
    },
  };
}