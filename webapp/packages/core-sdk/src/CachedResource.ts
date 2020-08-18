/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';

@injectable()
export abstract class CachedResource<
  TData,
  TParam,
> {
  @observable data: TData;

  readonly onDataUpdate: Observable<TData>;
  readonly onDataOutdated: Observable<TParam>;

  @observable protected outdated = new Set<TParam>();
  @observable protected loading = false;
  protected outdatedSubject: Subject<TParam>;
  protected dataSubject: Subject<TData>;
  @observable protected activePromiseParam: TParam | null = null;
  private activePromise: Promise<any> | null = null;

  constructor(defaultValue: TData) {
    this.data = defaultValue;
    this.outdatedSubject = new Subject();
    this.dataSubject = new Subject();
    this.onDataOutdated = this.outdatedSubject.asObservable();
    this.onDataUpdate = this.dataSubject.asObservable();
  }

  abstract isLoaded(param: TParam): boolean;

  isOutdated(param: TParam): boolean {
    return this.outdated.has(param);
  }

  isLoading(): boolean {
    return this.loading;
  }

  markOutdated(param: TParam): void {
    this.outdated.add(param);
    this.outdatedSubject.next(param);
  }

  markUpdated(param: TParam): void {
    this.outdated.delete(param);
  }

  async refresh(param: TParam): Promise<any> {
    this.markOutdated(param);
    await this.loadData(param);
    return this.data;
  }

  async load(param: TParam): Promise<any> {
    await this.loadData(param);
    return this.data;
  }

  protected abstract loader(param: TParam): Promise<TData>;

  protected async performUpdate<T>(
    param: TParam,
    update: (param: TParam) => Promise<T>,
  ): Promise<T>
  protected async performUpdate<T>(
    param: TParam,
    update: (param: TParam) => Promise<T>,
    exitCheck: () => boolean
  ): Promise<T | undefined>;

  protected async performUpdate<T>(
    param: TParam,
    update: (param: TParam) => Promise<T>,
    exitCheck?: () => boolean
  ): Promise<T | undefined> {
    if (exitCheck && exitCheck()) {
      return;
    }

    await this.waitActive();

    if (exitCheck && exitCheck()) {
      return;
    }

    const result = await this.setActivePromise(param, update(param));
    this.dataSubject.next(this.data);

    return result;
  }

  protected async loadData(param: TParam) {
    if (this.isLoaded(param) && !this.isOutdated(param)) {
      return;
    }

    await this.waitActive();

    // repeated because previous task maybe has been load requested data
    if (this.isLoaded(param) && !this.isOutdated(param)) {
      return;
    }

    await this.setActivePromise(param, this.loadingTask(param));
    this.dataSubject.next(this.data);
  }

  protected async setActivePromise<T>(param: TParam, promise: Promise<T>): Promise<T> {
    this.activePromise = promise;
    this.activePromiseParam = param;
    try {
      this.markOutdated(param);
      const result = await this.activePromise;
      this.markUpdated(param);

      return result;
    } finally {
      this.activePromise = null;
      this.activePromiseParam = null;
    }
  }

  private async loadingTask(param: TParam) {
    const prevState = this.loading;
    this.loading = true;

    try {
      this.data = await this.loader(param);
    } finally {
      this.loading = prevState;
    }
  }

  protected async waitActive() {
    if (this.activePromise) {
      try {
        await this.activePromise;
      } catch {}
    }
  }
}
