/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable, runInAction } from 'mobx';

import { useAutoLoad, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Task, type ITask } from '@cloudbeaver/core-executor';
import type { SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

export interface IGeneratedSqlSource {
  query?: string;
  options?: SqlQueryGeneratorOptions;
  generate(options: SqlQueryGeneratorOptions): Promise<string>;
}

interface IGeneratedSql {
  readonly query: string;
  readonly options: Readonly<SqlQueryGeneratorOptions>;
  readonly error: boolean;
  readonly loading: boolean;
  generate(options?: SqlQueryGeneratorOptions): Promise<void>;
  cancel(): Promise<void>;
}

interface IGeneratedSqlState extends ILoadableState {
  query: string;
  options: SqlQueryGeneratorOptions;
  error: boolean;
  task: ITask<string> | null;
  loaded: boolean;
  loading: boolean;
  closed: boolean;
  cancelling: boolean;
  generate(options?: SqlQueryGeneratorOptions): Promise<void>;
  cancel(): Promise<void>;
}

export function useGeneratedSql(source: IGeneratedSqlSource): IGeneratedSql {
  const notificationService = useService(NotificationService);
  const state = useObservableRef<IGeneratedSqlState, { source: IGeneratedSqlSource }>(
    () => ({
      query: source.query ?? '',
      options: { useFullyQualifiedNames: true, compactSql: false, showFullDdl: false, ...source.options },
      error: false,
      task: null,
      loaded: source.query !== undefined,
      loading: false,
      closed: false,
      cancelling: false,
      isLoading(): boolean {
        return this.loading || this.cancelling || (!this.loaded && !this.error && !this.closed);
      },
      isLoaded(): boolean {
        return this.loaded;
      },
      isError(): boolean {
        return this.error;
      },
      isLoadable(): boolean {
        return !this.loading && !this.cancelling && !this.closed;
      },
      load(): Promise<void> {
        return this.generate();
      },
      async generate(options?: SqlQueryGeneratorOptions): Promise<void> {
        if (this.loading || this.cancelling || this.closed) {
          return;
        }

        const previousOptions = this.options;
        this.options = { ...this.options, ...options };
        this.error = false;
        this.loading = true;

        try {
          this.task = null;
          const operation = this.source.generate(this.options);
          this.task = operation instanceof Task ? operation : null;
          const query = await operation;
          runInAction(() => {
            if (!this.closed) {
              this.query = query;
              this.loaded = true;
            }
          });
        } catch (error: any) {
          runInAction(() => {
            this.options = previousOptions;
            this.error = true;
          });

          if (!this.task?.cancelled && !this.closed) {
            notificationService.logException(error, 'app_shared_sql_generators_error_title');
          }
        } finally {
          runInAction(() => {
            this.loading = false;
          });
        }
      },
      async cancel(): Promise<void> {
        this.cancelling = true;

        try {
          if (this.task?.executing && this.task.cancellable) {
            await this.task.cancel();
          }

          runInAction(() => {
            this.closed = true;
          });
        } finally {
          runInAction(() => {
            this.cancelling = false;
          });
        }
      },
    }),
    {
      query: observable.ref,
      options: observable.ref,
      error: observable.ref,
      task: observable.ref,
      loaded: observable.ref,
      loading: observable.ref,
      closed: observable.ref,
      cancelling: observable.ref,
      load: action.bound,
      generate: action.bound,
      cancel: action.bound,
    },
    { source },
  );

  useAutoLoad(useGeneratedSql, state);

  return {
    query: state.query,
    options: state.options,
    error: state.error,
    loading: state.isLoading(),
    generate: state.generate,
    cancel: state.cancel,
  };
}
