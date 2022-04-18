/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { QuotasService } from '@cloudbeaver/core-app';
import type { GraphQLService } from '@cloudbeaver/core-sdk';
import { download, GlobalConstants } from '@cloudbeaver/core-utils';

import type { IResultSetContentValue } from './Actions/ResultSet/IResultSetContentValue';
import type { IResultSetElementKey } from './Actions/ResultSet/IResultSetDataKey';
import { isResultSetContentValue } from './Actions/ResultSet/isResultSetContentValue';
import { ResultSetDataAction } from './Actions/ResultSet/ResultSetDataAction';
import { ResultSetDataKeysUtils } from './Actions/ResultSet/ResultSetDataKeysUtils';
import type { IResultSetValue } from './Actions/ResultSet/ResultSetFormatAction';
import { ResultSetViewAction } from './Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseDataManager } from './IDatabaseDataManager';
import type { IDatabaseDataSource } from './IDatabaseDataSource';
import type { IDatabaseResultSet } from './IDatabaseResultSet';

const RESULT_VALUE_PATH = 'sql-result-value';

export class DatabaseDataManager implements IDatabaseDataManager {
  private readonly cache: Map<string, string>;
  activeElement: IResultSetElementKey | null;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly quotasService: QuotasService,
    private readonly source: IDatabaseDataSource<any, any>
  ) {
    this.cache = new Map();
    this.activeElement = null;

    makeObservable<this, 'cache'>(this, {
      cache: observable,
      activeElement: observable.ref,
    });
  }

  isContent(element: IResultSetElementKey, resultIndex: number) {
    const view = this.source.getAction(resultIndex, ResultSetViewAction);
    const cellValue = view.getCellValue(element);

    return isResultSetContentValue(cellValue);
  }

  isContentTruncated(content: IResultSetContentValue) {
    return (content.contentLength ?? 0) > this.quotasService.getQuota('sqlBinaryPreviewMaxLength');
  }

  async getFileDataUrl(element: IResultSetElementKey, resultIndex: number) {
    const result = this.source.getResult(resultIndex);
    const data = this.source.getAction(resultIndex, ResultSetDataAction);
    const column = data.getColumn(element.column);
    const row = data.getRowValue(element.row);

    if (!result || !row || !column) {
      throw new Error('Failed to get value metadata information');
    }

    const url = await this.source.runTask(
      async () => {
        try {
          this.activeElement = element;
          const fileName = await this.loadFileName(result, column.position, row);
          return this.generateFileDataUrl(fileName);
        } finally {
          this.activeElement = null;
        }
      }
    );

    return url;
  }

  async resolveFileDataUrl(element: IResultSetElementKey, resultIndex: number) {
    const cache = this.retrieveFileDataUrlFromCache(element, resultIndex);

    if (cache) {
      return cache;
    }

    const url = await this.getFileDataUrl(element, resultIndex);
    this.cache.set(this.getHash(element, resultIndex), url);

    return url;
  }

  retrieveFileDataUrlFromCache(element: IResultSetElementKey, resultIndex: number) {
    const hash = this.getHash(element, resultIndex);
    return this.cache.get(hash);
  }

  async downloadFileData(element: IResultSetElementKey, resultIndex: number) {
    const url = await this.getFileDataUrl(element, resultIndex);
    download(url);
  }

  clearCache() {
    this.cache.clear();
  }

  private generateFileDataUrl(fileName: string) {
    return `${GlobalConstants.serviceURI}/${RESULT_VALUE_PATH}/${fileName}`;
  }

  private getHash(element: IResultSetElementKey, resultIndex: number) {
    return `${ResultSetDataKeysUtils.serializeElementKey(element)}_${resultIndex}`;
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