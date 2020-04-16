/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

export type Loader<TData, TArgs extends any[]> = (current: TData, ...args: TArgs) => Promise<TData>

export class CachedResource<TData, TArgs extends any[] = []> {
  @observable data: TData;

  @observable private loaded = false;
  @observable private loading = false;
  private promise: Promise<TData> | null = null;
  private loader: Loader<TData, TArgs>;

  constructor(defaultValue: TData, loader: Loader<TData, TArgs>) {
    this.data = defaultValue;
    this.loader = loader;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  isLoading(): boolean {
    return this.loading;
  }

  async refresh(...args: TArgs): Promise<TData> {
    if (this.promise) {
      return this.promise;
    }
    this.promise = this.loadingTask(...args);
    try {
      await this.promise;
    } finally {
      this.promise = null;
    }
    return this.data;
  }

  async load(...args: TArgs): Promise<TData> {
    if (!this.loaded) {
      await this.refresh(...args);
    }
    return this.data;
  }

  private async loadingTask(...args: TArgs): Promise<TData> {
    this.loaded = false;
    this.loading = true;

    try {
      this.data = await this.loader(this.data, ...args);
    } finally {
      this.loading = false;
    }

    this.loaded = true;
    return this.data;
  }
}
