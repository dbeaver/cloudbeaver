/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { QuotasService } from '@cloudbeaver/core-root';
import { GraphQLService, ResultDataFormat } from '@cloudbeaver/core-sdk';
import { download, GlobalConstants } from '@cloudbeaver/core-utils';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IResultSetContentValue } from './IResultSetContentValue';
import type { IResultSetDataContentAction } from './IResultSetDataContentAction';
import type { IResultSetElementKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import { IResultSetValue, ResultSetFormatAction } from './ResultSetFormatAction';
import { ResultSetViewAction } from './ResultSetViewAction';

const RESULT_VALUE_PATH = 'sql-result-value';

@databaseDataAction()
export class ResultSetDataContentAction extends DatabaseDataAction<any, IDatabaseResultSet> implements IResultSetDataContentAction {
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly cache: Map<string, string>;
  activeElement: IResultSetElementKey | null;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    private readonly view: ResultSetViewAction,
    private readonly data: ResultSetDataAction,
    private readonly format: ResultSetFormatAction,
    private readonly graphQLService: GraphQLService,
    private readonly quotasService: QuotasService,
  ) {
    super(source);

    this.cache = new Map();
    this.activeElement = null;

    makeObservable<this, 'cache'>(this, {
      cache: observable,
      activeElement: observable.ref,
    });
  }

  isContentTruncated(content: IResultSetContentValue) {
    return (content.contentLength ?? 0) > this.quotasService.getQuota('sqlBinaryPreviewMaxLength');
  }

  isDownloadable(element: IResultSetElementKey) {
    return !!this.result.data?.hasRowIdentifier && isResultSetContentValue(this.format.get(element));
  }

  async getFileDataUrl(element: IResultSetElementKey) {
    const column = this.data.getColumn(element.column);
    const row = this.data.getRowValue(element.row);

    if (!row || !column) {
      throw new Error('Failed to get value metadata information');
    }

    const url = await this.source.runTask(async () => {
      try {
        this.activeElement = element;
        const fileName = await this.loadFileName(this.result, column.position, row);
        return this.generateFileDataUrl(fileName);
      } finally {
        this.activeElement = null;
      }
    });

    return url;
  }

  async resolveFileDataUrl(element: IResultSetElementKey) {
    const cache = this.retrieveFileDataUrlFromCache(element);

    if (cache) {
      return cache;
    }

    const url = await this.getFileDataUrl(element);
    this.cache.set(this.getHash(element), url);

    return url;
  }

  retrieveFileDataUrlFromCache(element: IResultSetElementKey) {
    const hash = this.getHash(element);
    return this.cache.get(hash);
  }

  async downloadFileData(element: IResultSetElementKey) {
    const url = await this.getFileDataUrl(element);
    download(url);
  }

  clearCache() {
    this.cache.clear();
  }

  private generateFileDataUrl(fileName: string) {
    return `${GlobalConstants.serviceURI}/${RESULT_VALUE_PATH}/${fileName}`;
  }

  private getHash(element: IResultSetElementKey) {
    return ResultSetDataKeysUtils.serializeElementKey(element);
  }

  private async loadFileName(result: IDatabaseResultSet, columnIndex: number, row: IResultSetValue[]) {
    if (!result.id) {
      throw new Error("Result's id must be provided");
    }

    const response = await this.graphQLService.sdk.getResultsetDataURL({
      resultsId: result.id,
      connectionId: result.connectionId,
      contextId: result.contextId,
      lobColumnIndex: columnIndex,
      row: {
        data: row,
      },
    });

    return response.url;
  }
}
