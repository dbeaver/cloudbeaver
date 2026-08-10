/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';
import { DDL_GENERATOR_ID, getDefaultQueryGeneratorOptions, SqlGeneratorsResource } from '@cloudbeaver/plugin-sql-generator';
import { useService } from '@cloudbeaver/core-di';
import { DDLViewerFooterService } from './DDLViewerFooterService.js';

interface IState extends ILoadableState {
  query: string | null;
  exception: Error | null;
  promise: Promise<string> | null;
  key: string | null;
  nodeId: string;
  sqlGeneratorsResource: SqlGeneratorsResource;
  ddlGeneratorId: string | null;
  ddlViewerFooterService: DDLViewerFooterService;
  getCurrentKey: () => string | null;
}

export function useDdlEntityQuery(nodeId: string): IState {
  const ddlViewerFooterService = useService(DDLViewerFooterService);
  const sqlGeneratorsResource = useResource(useDdlEntityQuery, SqlGeneratorsResource, nodeId);
  const ddlGenerator = sqlGeneratorsResource.data?.find(generator => generator.id.toLowerCase().includes(DDL_GENERATOR_ID.toLowerCase()));
  const ddlGeneratorId = ddlGenerator?.id ?? null;

  const state = useObservableRef<IState>(
    () => ({
      query: null,
      exception: null,
      promise: null,
      key: null,
      isLoadable() {
        return this.ddlGeneratorId !== null;
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
        if (this.ddlGeneratorId === null) {
          return null;
        }

        const isFullDdl = this.ddlViewerFooterService.isFullDdlEnabled(this.nodeId);

        return `${this.nodeId}::${this.ddlGeneratorId}::${isFullDdl}`;
      },
      async load() {
        if (this.ddlGeneratorId === null) {
          return;
        }

        const key = this.getCurrentKey();
        const isFullDdl = this.ddlViewerFooterService.isFullDdlEnabled(this.nodeId);

        try {
          this.exception = null;
          this.promise = this.sqlGeneratorsResource.generateEntityQuery(this.ddlGeneratorId, this.nodeId, {
            ...getDefaultQueryGeneratorOptions(),
            showFullDdl: isFullDdl,
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
      nodeId: observable.ref,
      ddlGeneratorId: observable.ref,
    },
    { nodeId, ddlGeneratorId, sqlGeneratorsResource: sqlGeneratorsResource.resource, ddlViewerFooterService },
  );

  return state;
}
