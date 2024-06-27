/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DynamicTraceProperty } from '@cloudbeaver/core-sdk';
import { ILoadableState, isContainsException } from '@cloudbeaver/core-utils';
import { IDatabaseDataModel, IDatabaseResultSet, IResultSetElementKey, ResultSetCacheAction } from '@cloudbeaver/plugin-data-viewer';

import { DVResultTraceDetailsService } from './DVResultTraceDetailsService';

interface State extends ILoadableState {
  readonly trace: DynamicTraceProperty[] | undefined;
  loading: boolean;
  loaded: boolean;
  exception: Error | null;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
  cache: ResultSetCacheAction;
}

const RESULT_TRACE_DETAILS_CACHE_KEY = Symbol('@cache/ResultTraceDetails');
// @TODO Probably we want to implement a cache behavior that will only use Scope Key as sometimes we want
// a cache that only exists as long as result exists but dont want to specify row/column indexes
const FAKE_ELEMENT_KEY: IResultSetElementKey = {
  column: { index: Number.MAX_SAFE_INTEGER },
  row: { index: Number.MAX_SAFE_INTEGER, subIndex: Number.MAX_SAFE_INTEGER },
};

export function useResultTraceDetails(model: IDatabaseDataModel<any, IDatabaseResultSet>, resultIndex: number) {
  const dvResultTraceDetailsService = useService(DVResultTraceDetailsService);
  const cache = model.source.getAction(resultIndex, ResultSetCacheAction);

  const state = useObservableRef<State>(
    () => ({
      get trace(): DynamicTraceProperty[] | undefined {
        return this.cache.get(FAKE_ELEMENT_KEY, RESULT_TRACE_DETAILS_CACHE_KEY);
      },
      loading: false,
      exception: null,
      isLoading() {
        return this.loading;
      },
      isError() {
        return isContainsException(this.exception);
      },
      isLoaded() {
        return this.trace !== undefined;
      },
      async load() {
        if (this.loading) {
          return;
        }

        const result = this.model.getResult(this.resultIndex);

        try {
          if (!result?.id) {
            throw new Error('Result is not found');
          }

          this.loading = true;
          this.exception = null;

          const { trace } = await dvResultTraceDetailsService.getTraceDetails(result.projectId, result.connectionId, result.contextId, result.id);

          this.cache.set(FAKE_ELEMENT_KEY, RESULT_TRACE_DETAILS_CACHE_KEY, trace);
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.loading = false;
        }
      },
    }),
    {
      loading: observable.ref,
      exception: observable.ref,
      trace: computed,
    },
    { model, resultIndex, cache },
  );

  return state;
}
