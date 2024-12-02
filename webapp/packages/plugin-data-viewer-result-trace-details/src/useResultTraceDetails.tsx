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
import type { DynamicTraceProperty, GetSqlDynamicTraceMutation } from '@cloudbeaver/core-sdk';
import { type ILoadableState, isContainsException } from '@cloudbeaver/core-utils';
import {
  DatabaseMetadataAction,
  type IDatabaseDataModel,
  type IResultSetElementKey,
  ResultSetCacheAction,
  ResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';

import { DVResultTraceDetailsService } from './DVResultTraceDetailsService.js';

type ResultTraceDetailsPromise = Promise<GetSqlDynamicTraceMutation>;

interface MetadataState {
  promise: ResultTraceDetailsPromise | null;
  exception: Error | null;
}
interface State extends ILoadableState {
  readonly trace: DynamicTraceProperty[] | undefined;
  model: IDatabaseDataModel<ResultSetDataSource>;
  resultIndex: number;
  cache: ResultSetCacheAction;
  metadataState: MetadataState;
}

const RESULT_TRACE_DETAILS_CACHE_KEY = Symbol('@cache/ResultTraceDetails');
const RESULT_TRACE_DETAILS_METADATA_KEY = 'result-trace-details-panel';
// @TODO Probably we want to implement a cache behavior that will only use Scope Key as sometimes we want
// a cache that only exists as long as result exists but dont want to specify row/column indexes
const FAKE_ELEMENT_KEY: IResultSetElementKey = {
  column: { index: Number.MAX_SAFE_INTEGER },
  row: { index: Number.MAX_SAFE_INTEGER, subIndex: Number.MAX_SAFE_INTEGER },
};

export function useResultTraceDetails(model: IDatabaseDataModel<ResultSetDataSource>, resultIndex: number) {
  const dvResultTraceDetailsService = useService(DVResultTraceDetailsService);
  const cache = model.source.getAction(resultIndex, ResultSetCacheAction);
  const metadataAction = model.source.getAction(resultIndex, DatabaseMetadataAction);

  const metadataState = metadataAction.get(RESULT_TRACE_DETAILS_METADATA_KEY, () =>
    observable<MetadataState>({
      promise: null,
      exception: null,
    }),
  );

  const state = useObservableRef<State>(
    () => ({
      get trace(): DynamicTraceProperty[] | undefined {
        return this.cache.get(FAKE_ELEMENT_KEY, RESULT_TRACE_DETAILS_CACHE_KEY);
      },
      get promise(): ResultTraceDetailsPromise | null {
        return this.metadataState.promise;
      },
      get exception(): Error | null {
        return this.metadataState.exception;
      },
      isError() {
        return isContainsException(this.exception);
      },
      isLoaded() {
        return this.trace !== undefined;
      },
      async load() {
        const result = this.model.source.getResult(this.resultIndex);

        try {
          if (!result?.id) {
            throw new Error('Result is not found');
          }

          if (this.metadataState.promise) {
            return;
          }

          this.metadataState.exception = null;

          this.metadataState.promise = dvResultTraceDetailsService.getTraceDetails(
            result.projectId,
            result.connectionId,
            result.contextId,
            result.id,
          );

          const { trace } = await this.metadataState.promise;

          this.cache.set(FAKE_ELEMENT_KEY, RESULT_TRACE_DETAILS_CACHE_KEY, trace);
        } catch (exception: any) {
          this.metadataState.exception = exception;
        } finally {
          this.metadataState.promise = null;
        }
      },
    }),
    {
      promise: computed,
      exception: computed,
      trace: computed,
      model: observable.ref,
    },
    { model, resultIndex, cache, metadataState },
  );

  return state;
}
