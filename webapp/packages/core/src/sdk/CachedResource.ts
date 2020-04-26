/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

export type Loader<TData, TArgs extends any[]> = (current: TData, update: boolean, ...args: TArgs) => Promise<TData>

export class CachedResource<TData, TArgs extends any[] = []> {
  @observable data: TData;

  @observable private loaded = false;
  @observable private loading = false;
  private refreshPromise: Promise<TData> | null = null;
  private singleElementPromise: Promise<TData> | null = null;
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
    if (args.length > 0) {
      await this.loadSingle(true, args);
    } else {
      await this.loadAll(true, args);
    }
    return this.data;
  }

  async load(...args: TArgs): Promise<TData> {
    if (!this.loaded) {
      if (args.length > 0) {
        await this.loadSingle(false, args);
      } else {
        await this.loadAll(false, args);
      }
    }
    return this.data;
  }

  private async loadAll(update: boolean, args: TArgs) {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.loadingTask(update, args);
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async loadSingle(update: boolean, args: TArgs) {
    if (this.singleElementPromise) {
      return this.singleElementPromise;
    }
    this.singleElementPromise = this.loadingTask(update, args);
    try {
      await this.singleElementPromise;
    } finally {
      this.singleElementPromise = null;
    }
  }

  private async loadingTask(update: boolean, args: TArgs): Promise<TData> {
    if (args.length === 0) {
      this.loaded = false;
    }
    this.loading = true;

    try {
      this.data = await this.loader(this.data, update, ...args);
    } finally {
      this.loading = false;
    }

    if (args.length === 0) {
      this.loaded = true;
    }
    return this.data;
  }
}
