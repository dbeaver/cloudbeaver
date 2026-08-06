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
import { getDefaultQueryGeneratorOptions, SqlGeneratorsResource } from '@cloudbeaver/plugin-sql-generator';
import { useService } from '@cloudbeaver/core-di';

interface IPayload {
  nodeId: string;
  generatorId: string | null;
  showFullDdl: boolean;
}

interface IState extends ILoadableState {
  query: string | null;
  exception: Error | null;
  promise: Promise<string> | null;
  key: string | null;
  payload: IPayload;
  sqlGeneratorsResource: SqlGeneratorsResource;
  getCurrentKey: () => string | null;
}

export function useDdlEntityQuery(payload: IPayload): IState {
  const sqlGeneratorsResource = useService(SqlGeneratorsResource);
  const state = useObservableRef<IState>(
    () => ({
      query: null,
      exception: null,
      promise: null,
      key: null,
      isLoadable() {
        return this.payload.generatorId !== null;
      },
      isLoaded() {
        return this.query !== null;
      },
      isError() {
        return this.exception !== null;
      },
      isLoading() {
        return this.promise !== null;
      },
      isOutdated() {
        return this.getCurrentKey() !== this.key;
      },
      getCurrentKey() {
        const { generatorId, nodeId, showFullDdl } = this.payload;

        if (generatorId === null) {
          return null;
        }

        return `${nodeId}::${generatorId}::${showFullDdl}`;
      },
      async load() {
        if (this.payload.generatorId === null) {
          return;
        }

        const key = this.getCurrentKey();

        try {
          this.exception = null;
          this.promise = this.sqlGeneratorsResource.generateEntityQuery(this.payload.generatorId, this.payload.nodeId, {
            ...getDefaultQueryGeneratorOptions(),
            showFullDdl: this.payload.showFullDdl,
          });
          this.query = await this.promise;
          this.key = key;
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.promise = null;
        }
      },
    }),
    {
      query: observable.ref,
      exception: observable.ref,
      promise: observable.ref,
      key: observable.ref,
      payload: observable.ref,
    },
    { payload, sqlGeneratorsResource },
  );

  return state;
}
