/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

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

export type IsLoading<TData, TMetadata = {}, TArgs extends any[] = []> = (
  current: TData,
  metadata: TMetadata,
  ...args: TArgs
) => boolean

export class CachedResource<TData, TMetadata = {}, TArgs extends any[] = []> {
  @observable data: TData;

  @observable private loading = false;
  @observable private metadata: TMetadata;

  readonly onDataUpdate: Observable<TData>;
  private dataSubject: Subject<TData>;
  private loader: Loader<TData, TMetadata, TArgs>;
  private isLoadedCheck: IsLoaded<TData, TMetadata, TArgs>;
  private isLoadingCheck?: IsLoading<TData, TMetadata, TArgs>;
  private activePromise: Promise<TData> | null = null;

  constructor(
    defaultValue: TData,
    loader: Loader<TData, TMetadata, TArgs>,
    isLoadedCheck: IsLoaded<TData, TMetadata, TArgs>,
    metadata?: TMetadata,
    isLoadingCheck?: IsLoading<TData, TMetadata, TArgs>,
  ) {
    this.data = defaultValue;
    this.loader = loader;
    this.isLoadedCheck = isLoadedCheck;
    this.isLoadingCheck = isLoadingCheck;
    this.metadata = metadata || {} as TMetadata;
    this.dataSubject = new Subject<TData>();
    this.onDataUpdate = this.dataSubject.asObservable();
  }

  isLoaded(...args: TArgs): boolean {
    return this.isLoadedCheck(this.data, this.metadata, ...args);
  }

  isLoading(): boolean {
    return this.loading;
  }
  isDataLoading(...args: TArgs): boolean {
    if (this.isLoadingCheck) {
      return this.loading && this.isLoadingCheck(this.data, this.metadata, ...args);
    }
    return this.loading;
  }

  async refresh(load = false, ...args: TArgs): Promise<TData> {
    return this.loadData(load, true, args);
  }

  async load(...args: TArgs): Promise<TData> {
    return this.loadData(true, false, args);
  }

  async refreshUnblocked(load = false, ...args: TArgs): Promise<TData> {
    return this.loadData(load, true, args, true);
  }

  async loadUnblocked(...args: TArgs): Promise<TData> {
    return this.loadData(true, false, args, true);
  }

  private async loadData(load: boolean, update: boolean, args: TArgs, unblocked?: boolean) {
    if (unblocked) {
      return this.loadingTask(load, update, args);
    }
    await this.waitActive();
    this.activePromise = this.loadingTask(load, update, args);
    try {
      return await this.activePromise;
    } finally {
      this.activePromise = null;
      this.dataSubject.next(this.data);
    }
  }

  private async loadingTask(load: boolean, update: boolean, args: TArgs): Promise<TData> {
    const prevState = this.loading;
    this.loading = true;

    try {
      // don't load existed data & don't refresh doesn't loaded data
      if ((this.isLoaded(...args) && !update) || (!this.isLoaded(...args) && update && !load)) {
        return this.data;
      }

      this.data = await this.loader(this.data, this.metadata, load, ...args);
    } finally {
      this.loading = prevState;
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
