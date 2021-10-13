/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { CachedResource } from './CachedResource';

export abstract class CachedDataResource<
  TData,
  TParam = void,
  TKey = TParam,
  TContext = void,
> extends CachedResource<TData, TParam, TKey, TContext> {
  protected loaded: boolean;

  constructor(defaultValue: TData) {
    super(defaultValue);

    this.loaded = false;

    makeObservable<CachedResource<TData, TParam, TKey, TContext>, 'loaded'>(this, {
      loaded: observable,
    });

    this.onDataUpdate.addHandler(() => { this.loaded = true; });
  }

  isLoaded(param: TParam, context: TContext): boolean {
    return this.loaded;
  }

  async refresh(param: TParam, context: TContext): Promise<TData> {
    await this.loadData(param, true, context);
    return this.data;
  }

  async load(param: TParam, context: TContext): Promise<TData> {
    await this.loadData(param, false, context);
    return this.data;
  }
}
