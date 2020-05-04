/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

export type Loader<TData, TMetadata = {}, TArgs extends any[] = []> = (
  current: TData,
  metadata: TMetadata,
  update: boolean,
  ...args: TArgs
) => Promise<TData>

export type IsLoaded<TData, TMetadata = {}, TArgs extends any[] = []> = (
  current: TData,
  metadata: TMetadata,
  ...args: TArgs
) => boolean

export class CachedResource<TData, TMetadata = {}, TArgs extends any[] = []> {
  @observable data: TData;

  @observable private loading = false;
  @observable private metadata: TMetadata;
  private loader: Loader<TData, TMetadata, TArgs>;
  private isLoadedCheck: IsLoaded<TData, TMetadata, TArgs>;
  private activePromise: Promise<TData> | null = null;

  constructor(
    defaultValue: TData,
    loader: Loader<TData, TMetadata, TArgs>,
    isLoadedCheck: IsLoaded<TData, TMetadata, TArgs>,
    metadata?: TMetadata,
  ) {
    this.data = defaultValue;
    this.loader = loader;
    this.isLoadedCheck = isLoadedCheck;
    this.metadata = metadata || {} as TMetadata;
  }

  isLoaded(...args: TArgs): boolean {
    return this.isLoadedCheck(this.data, this.metadata, ...args);
  }

  isLoading(): boolean {
    return this.loading;
  }

  async refresh(...args: TArgs): Promise<TData> {
    return this.loadAll(true, args);
  }

  async load(...args: TArgs): Promise<TData> {
    return this.loadAll(false, args);
  }

  private async loadAll(update: boolean, args: TArgs) {
    await this.waitActive();
    this.activePromise = this.loadingTask(update, args);
    try {
      return await this.activePromise;
    } finally {
      this.activePromise = null;
    }
  }

  private async loadingTask(update: boolean, args: TArgs): Promise<TData> {
    this.loading = true;

    try {
      if (this.isLoaded(...args) && !update) {
        return this.data;
      }

      this.data = await this.loader(this.data, this.metadata, update, ...args);
    } finally {
      this.loading = false;
    }

    return this.data;
  }

  private async waitActive() {
    if (this.activePromise) {
      try {
        await this.activePromise;
      } catch {}
    }
  }
}
