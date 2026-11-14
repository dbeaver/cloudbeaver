/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';

export interface IDBAdminLoader<T> extends ILoadableState {
  readonly data: T | null;
  readonly exception: Error | null;
  reload: () => Promise<void>;
}

interface IState<T> extends IDBAdminLoader<T> {
  key: string | null;
  loader: () => Promise<T>;
  promise: Promise<T> | null;
  loadedKey: string | null;
  data: T | null;
  exception: Error | null;
}

/**
 * Loads data on demand. Reloads when `key` changes; `null` key disables loading.
 */
export function useDBAdminLoader<T>(key: string | null, loader: () => Promise<T>): IDBAdminLoader<T> {
  return useObservableRef<IState<T>>(
    () => ({
      promise: null,
      loadedKey: null,
      data: null,
      exception: null,
      isLoading() {
        return this.promise !== null;
      },
      isLoaded() {
        return this.loadedKey !== null && this.exception === null;
      },
      isError() {
        return this.exception !== null && this.loadedKey === this.key;
      },
      isOutdated() {
        return this.loadedKey !== this.key;
      },
      isLoadable() {
        return this.key !== null;
      },
      async load() {
        if (this.promise) {
          await this.promise;
          return;
        }

        const key = this.key;

        try {
          this.exception = null;
          this.promise = this.loader();
          this.data = await this.promise;
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.loadedKey = key;
          this.promise = null;
        }
      },
      async reload() {
        await this.load();
      },
    }),
    {
      key: observable.ref,
      loader: observable.ref,
      promise: observable.ref,
      loadedKey: observable.ref,
      data: observable.ref,
      exception: observable.ref,
    },
    { key, loader },
  );
}
