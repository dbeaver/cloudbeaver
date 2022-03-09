/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

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
export type CachedDataResourceContext<TResource> = TResource extends CachedDataResource<any, any, any, infer T>
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

type ContextArg<TData, TContext> = TContext extends void ? void : CachedResourceIncludeArgs<TData, TContext>;

export abstract class CachedDataResource<
  TData,
  TParam = void,
  TKey = TParam,
  TContext extends Record<string, any> | void = void,
> extends CachedResource<
  TData,
  TParam,
  TKey,
  ContextArg<TData, TContext>
  > {
  protected loaded: boolean;

  constructor(defaultValue: TData, defaultIncludes: ContextArg<TData, TContext>) {
    super(defaultValue, defaultIncludes as any as string[]);

    this.loaded = false;

    makeObservable<this, 'loaded'>(this, {
      loaded: observable,
    });

    this.onDataUpdate.addHandler(() => { this.loaded = true; });
  }

  isLoaded(param: TParam, includes: ContextArg<TData, TContext>): boolean {
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

  async refresh(param: TParam, context: ContextArg<TData, TContext>): Promise<TData> {
    await this.loadData(param, true, context);
    return this.data;
  }

  async load(param: TParam, context: ContextArg<TData, TContext>): Promise<TData> {
    await this.loadData(param, false, context);
    return this.data;
  }
}
